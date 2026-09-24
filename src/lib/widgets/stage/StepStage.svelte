<script lang="ts" module>
  /** How close the stage's top must be to count as filling the viewport, px. */
  const ENGAGED_PX = 2;
  /** How much of a viewport away an approaching stage pulls the reader in. */
  const ARRIVE_FRACTION = 0.5;
  /** Where a touch or scrollbar scroll that comes to rest near the stage is pulled in. */
  const SETTLE_FRACTION = 0.3;
  /** Controls inside the stage: a press on one of these never steps. */
  const CONTROL = 'button, a, input, select, textarea, label, [role="button"], [data-control]';
</script>

<script lang="ts">
  /**
   * The step player (ADR-017). One viewport-tall section; while it fills the
   * viewport, every reading gesture is a step. Before its first step and after
   * its last, gestures go back to the page — that boundary is what keeps a
   * stage that owns gestures from becoming the kind of trap R31 removed.
   *
   * It knows nothing about any scene. A scene attaches a list of steps (data)
   * and two functions — play and settle — and reports holds released.
   */
  import { onMount, setContext, type Snippet } from 'svelte';
  import {
    STEP_STAGE_CONTEXT,
    StepMachine,
    type StepResult,
    type StepScene,
    type StepSpec,
    type StepStageContext,
  } from './steps';
  import { motionOk } from './motion';
  import { SWIPE_MIN_PX, WHEEL_GESTURE_REST_MS, keyDirection, keyIsClaimed } from '../shared/gesture';

  interface Props {
    /** Stable name; keys the remembered step for reloads. */
    id: string;
    /** What a screen reader hears the stage called. */
    label: string;
    children: Snippet;
  }

  let { id, label, children }: Props = $props();

  let root: HTMLElement;
  let machine: StepMachine | null = null;
  let scene: StepScene | null = null;

  const live = $state({ index: 0, reduced: false });
  const storageKey = $derived(`merit-or-math:stage:${id}:v1`);

  setContext<StepStageContext>(STEP_STAGE_CONTEXT, {
    attach(steps, attachedScene) {
      machine = new StepMachine(steps);
      scene = attachedScene;
    },
    release(stepId) {
      if (!machine) return;
      const from = machine.index;
      const result = machine.release(stepId);
      if (result === 'moved') show(from, 'forward');
      else remember();
    },
    get index() {
      return live.index;
    },
    get reduced() {
      return live.reduced;
    },
  });

  function remember(): void {
    if (!machine) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(machine.snapshot()));
    } catch {
      // private mode: the stage still works, it just forgets on reload
    }
  }

  let autoTimer: number | undefined;

  function clearAuto(): void {
    if (autoTimer !== undefined) window.clearTimeout(autoTimer);
    autoTimer = undefined;
  }

  /** Auto steps run only while the stage is being looked at, and never under reduced motion. */
  function scheduleAuto(): void {
    clearAuto();
    if (!machine || live.reduced) return;
    const wait = machine.step.wait;
    if (wait.kind !== 'auto') return;
    const at = machine.index;
    autoTimer = window.setTimeout(function fire() {
      if (!machine || machine.index !== at) return;
      if (!inView()) {
        autoTimer = window.setTimeout(fire, 400);
        return;
      }
      const from = machine.index;
      if (machine.next() === 'moved') show(from, 'forward');
    }, wait.ms);
  }

  /** Put the scene on the machine's step. Forward by one plays; anything else settles. */
  function show(from: number, how: 'forward' | 'jump'): void {
    if (!machine || !scene) return;
    const to = machine.index;
    live.index = to;
    if (how === 'forward' && to === from + 1 && !live.reduced) scene.play(to, from);
    else scene.settle(to);
    remember();
    scheduleAuto();
  }

  function step(direction: 1 | -1): StepResult {
    if (!machine) return direction > 0 ? 'end' : 'start';
    const from = machine.index;
    const result = direction > 0 ? machine.next() : machine.back();
    if (result === 'moved') show(from, direction > 0 ? 'forward' : 'jump');
    else if (result === 'held') scene?.nudge?.(machine.index);
    return result;
  }

  function top(): number {
    return root.getBoundingClientRect().top;
  }

  function engaged(): boolean {
    return Math.abs(top()) <= ENGAGED_PX;
  }

  function inView(): boolean {
    return Math.abs(top()) < window.innerHeight * ARRIVE_FRACTION;
  }

  /**
   * Bring the stage to fill the viewport. From below, the reader is walking
   * back through the essay, so the stage shows its END state and stepping back
   * walks it in reverse.
   */
  function arrive(direction: 1 | -1): void {
    if (!machine) return;
    if (direction < 0 && !machine.atLast) {
      machine.seek(machine.steps.length - 1);
      show(machine.index, 'jump');
    }
    window.scrollTo({ top: window.scrollY + top(), behavior: live.reduced ? 'auto' : 'smooth' });
  }

  function approaching(direction: 1 | -1): boolean {
    const t = top();
    const reach = window.innerHeight * ARRIVE_FRACTION;
    return direction > 0 ? t > ENGAGED_PX && t < reach : t < -ENGAGED_PX && t > -reach;
  }

  // ---- wheel -------------------------------------------------------------

  let wheelLock: number | undefined;

  function lockWheel(): void {
    if (wheelLock !== undefined) window.clearTimeout(wheelLock);
    wheelLock = window.setTimeout(() => (wheelLock = undefined), WHEEL_GESTURE_REST_MS);
  }

  function onWheel(e: WheelEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 2) return;
    const direction: 1 | -1 = delta > 0 ? 1 : -1;

    if (!engaged()) {
      // The inertial tail of the gesture that just arrived stays swallowed.
      if (wheelLock !== undefined && inView()) {
        e.preventDefault();
        lockWheel();
        return;
      }
      if (approaching(direction)) {
        e.preventDefault();
        lockWheel();
        arrive(direction);
      }
      return;
    }

    if (wheelLock !== undefined) {
      e.preventDefault();
      lockWheel();
      return;
    }
    const result = step(direction);
    // Past either end the gesture is the page's: no preventDefault, no lock.
    if (result === 'end' || result === 'start') return;
    e.preventDefault();
    lockWheel();
  }

  // ---- keys --------------------------------------------------------------

  function onKey(e: KeyboardEvent): void {
    const direction = keyDirection(e);
    if (direction === 0 || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (keyIsClaimed(document.activeElement)) return;
    if (engaged()) {
      const result = step(direction);
      if (result === 'moved' || result === 'held') e.preventDefault();
      return;
    }
    if (approaching(direction)) {
      e.preventDefault();
      arrive(direction);
    }
  }

  // ---- touch -------------------------------------------------------------

  let touchStartY: number | null = null;

  function onTouchStart(e: TouchEvent): void {
    touchStartY = engaged() && e.touches.length === 1 ? e.touches[0].clientY : null;
  }

  function onTouchMove(e: TouchEvent): void {
    if (touchStartY === null || !machine) return;
    const dy = touchStartY - e.touches[0].clientY;
    if (Math.abs(dy) < 4) return;
    // Leaving past an end: the finger scrolls the page as normal.
    const leaving = dy > 0 ? machine.atLast && !machine.holding : machine.atFirst;
    if (leaving) {
      touchStartY = null;
      return;
    }
    if (e.cancelable) e.preventDefault();
  }

  function onTouchEnd(e: TouchEvent): void {
    if (touchStartY === null) return;
    const start = touchStartY;
    touchStartY = null;
    const end = e.changedTouches[0]?.clientY;
    if (end === undefined || Math.abs(start - end) < SWIPE_MIN_PX) return;
    if (e.cancelable) e.preventDefault();
    step(start > end ? 1 : -1);
  }

  // ---- a scroll that comes to rest near the stage ------------------------
  //
  // Wheel and keys arrive on purpose above. A finger or a dragged scrollbar
  // can leave the page resting with the stage half on screen, where nothing
  // would step. Pull it in — only in the direction the reader was already
  // going, and only once per approach (the sandbox's maybeSnap rule, which
  // R31 proved does not trap).

  let lastScrollY = 0;
  let travel: 1 | -1 = 1;
  let settleArmed = true;
  let settleTimer: number | undefined;

  function onScroll(): void {
    const y = window.scrollY;
    if (y !== lastScrollY) travel = y > lastScrollY ? 1 : -1;
    lastScrollY = y;
    if (Math.abs(top()) > window.innerHeight * SETTLE_FRACTION) settleArmed = true;
    if (settleTimer !== undefined) window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(maybeSettle, 160);
  }

  function maybeSettle(): void {
    settleTimer = undefined;
    if (!settleArmed || wheelLock !== undefined) return;
    const t = top();
    if (Math.abs(t) <= ENGAGED_PX || Math.abs(t) > window.innerHeight * SETTLE_FRACTION) return;
    // below the stage and travelling down, or above it and travelling up
    if ((t > 0 && travel > 0) || (t < 0 && travel < 0)) {
      settleArmed = false;
      arrive(travel);
    }
  }

  // ---- a tap on empty stage ----------------------------------------------

  function onClick(e: MouseEvent): void {
    if ((e.target as Element | null)?.closest(CONTROL)) return;
    if (!engaged()) {
      arrive(top() > 0 ? 1 : -1);
      return;
    }
    step(1);
  }

  onMount(() => {
    live.reduced = !motionOk();
    if (!machine || !scene) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) machine.restore(JSON.parse(saved));
    } catch {
      // a broken entry is ignored; the stage starts from the top
    }
    live.index = machine.index;
    scene.settle(machine.index);
    // On a fresh stage the first step plays rather than appearing finished.
    if (machine.index === 0 && !live.reduced) scene.play(0, -1);
    scheduleAuto();

    lastScrollY = window.scrollY;
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearAuto();
      if (wheelLock !== undefined) window.clearTimeout(wheelLock);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

<!-- a click on empty stage is a mouse/touch convenience; the keyboard path is
     the reading keys, handled on window -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<section
  bind:this={root}
  class="step-stage"
  aria-label={label}
  aria-roledescription="stage"
  data-step={live.index}
  onclick={onClick}
>
  {@render children()}
</section>

<style>
  .step-stage {
    position: relative;
    block-size: 100svh;
    overflow: hidden;
    /* a full viewport, edge to edge, whatever column the essay sets */
    inline-size: 100vw;
    margin-inline-start: calc(50% - 50vw);
    touch-action: pan-y;
  }
</style>
