<script lang="ts" module>
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
    ARRIVE_FRACTION,
    ENGAGED_PX,
    STEP_STAGE_CONTEXT,
    StepMachine,
    claim,
    readingMs,
    type Claim,
    type StepResult,
    type StepScene,
    type StepSpec,
    type StepStageContext,
  } from './steps';
  import { motionOk } from './motion';
  import { STAGE_STATE_ATTRIBUTE } from '$lib/deferredEvents';
  import { STAGE_STEP_EVENT, type StageStep } from './branch';
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
    isReleased(stepId) {
      return machine?.isReleased(stepId) ?? false;
    },
    advance() {
      inside = true;
      step(1);
    },
    pause(on) {
      paused = on;
      if (!on && owed) {
        owed = false;
        // the reader looked away from a line that was due: a moment more, then go
        scheduleAuto(RESUME_MS);
      }
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
  /** The pointer rests on a bubble; a chat step that comes due waits for it to leave. */
  let paused = false;
  let owed = false;
  const RESUME_MS = 1200;

  function clearAuto(): void {
    if (autoTimer !== undefined) window.clearTimeout(autoTimer);
    autoTimer = undefined;
  }

  /**
   * Auto steps run only while the stage is being looked at, never under reduced
   * motion, and only when the reader arrived going FORWARD. A reader stepping
   * back into the title or a toss is reviewing it; a timer there pushed them
   * forward again, so walking back through two auto steps never got past them.
   */
  function scheduleAuto(after: number | null = null): void {
    clearAuto();
    owed = false;
    if (!machine || live.reduced) return;
    const wait = machine.step.wait;
    if (wait.kind !== 'auto' && wait.kind !== 'chat') return;
    const at = machine.index;
    const ms = after ?? (wait.kind === 'auto' ? wait.ms : (scene?.readingMs?.(at) ?? readingMs(8)));
    autoTimer = window.setTimeout(function fire() {
      if (!machine || machine.index !== at) return;
      if (!inView()) {
        autoTimer = window.setTimeout(fire, 400);
        return;
      }
      if (paused && wait.kind === 'chat') {
        owed = true;
        autoTimer = undefined;
        return;
      }
      const from = machine.index;
      if (machine.next() === 'moved') show(from, 'forward');
    }, ms);
  }

  /** Put the scene on the machine's step. Forward by one plays; anything else settles. */
  function show(from: number, how: 'forward' | 'jump'): void {
    if (!machine || !scene) return;
    const to = machine.index;
    live.index = to;
    if (how === 'forward' && to === from + 1 && !live.reduced) scene.play(to, from);
    else scene.settle(to);
    remember();
    if (how === 'forward') scheduleAuto();
    else clearAuto();
    publish();
  }

  function publish(): void {
    const el = document.documentElement;
    const playing = autoTimer !== undefined && machine?.step.wait.kind === 'auto';
    const state = !machine || !engaged() ? null : playing ? 'playing' : 'reading';
    if (state === null) el.removeAttribute(STAGE_STATE_ATTRIBUTE);
    else if (el.getAttribute(STAGE_STATE_ATTRIBUTE) !== state) el.setAttribute(STAGE_STATE_ATTRIBUTE, state);
  }

  function step(direction: 1 | -1): StepResult {
    if (!machine) return direction > 0 ? 'end' : 'start';
    const from = machine.index;
    if (direction > 0 && scene?.hurry?.(from)) return 'hurried';
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
   * Whether the reader is IN the stage: stepped, arrived or aligned since they
   * last left past an end or scrolled far away. A stage a few pixels off is
   * then a stage that slid, not one being arrived at (see `claim`).
   */
  let inside = false;

  function claimFor(direction: 1 | -1, busy: boolean): Claim {
    if (!machine) return 'pass';
    return claim({ top: top(), viewport: window.innerHeight, inside, busy }, direction, machine);
  }

  /** Carry a claim out. True when the gesture was the stage's. */
  function act(what: Claim, direction: 1 | -1): boolean {
    switch (what) {
      case 'pass':
        // handing an end to the page is leaving the stage
        if (engaged()) inside = false;
        return false;
      case 'swallow':
        return true;
      case 'align':
        align();
        return true;
      case 'arrive':
        arrive(direction);
        return true;
      case 'step': {
        inside = true;
        const result = step(direction);
        return result === 'moved' || result === 'held' || result === 'hurried';
      }
    }
  }

  /**
   * Bring the stage to fill the viewport. From below, the reader is walking
   * back through the essay, so the stage shows its END state and stepping back
   * walks it in reverse.
   */
  function arrive(direction: 1 | -1): void {
    if (!machine) return;
    if (direction < 0 && !inside && !machine.atLast) {
      machine.seek(machine.steps.length - 1);
      show(machine.index, 'jump');
    }
    inside = true;
    window.scrollTo({ top: window.scrollY + top(), behavior: live.reduced ? 'auto' : 'smooth' });
  }

  /** The page slid under a reader who never left: put it back, on the same step. */
  function align(): void {
    inside = true;
    window.scrollTo({ top: window.scrollY + top(), behavior: 'auto' });
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
    if (delta === 0) return;
    const direction: 1 | -1 = delta > 0 ? 1 : -1;
    const busy = wheelLock !== undefined;
    const what = claimFor(direction, busy);
    if (what === 'pass') {
      act(what, direction);
      return;
    }
    e.preventDefault();
    // A trackpad's tail thins to fractions of a pixel. It is still the stage's —
    // letting it through slid the page off the stage, after which flicks
    // scrolled straight past it — but too faint to act on, or to start a gesture.
    if (Math.abs(delta) < 2) {
      if (busy) lockWheel();
      return;
    }
    act(what, direction);
    lockWheel();
  }

  // ---- keys --------------------------------------------------------------

  function onKey(e: KeyboardEvent): void {
    const direction = keyDirection(e);
    if (direction === 0 || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (keyIsClaimed(document.activeElement)) return;
    if (act(claimFor(direction, false), direction)) e.preventDefault();
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
      inside = false;
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
    inside = true;
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
    const t = Math.abs(top());
    if (t > window.innerHeight * SETTLE_FRACTION) settleArmed = true;
    if (t >= window.innerHeight * ARRIVE_FRACTION) inside = false;
    publish();
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

  // ---- focus ---------------------------------------------------------------
  //
  // A reader tabbing to a control inside the stage must not be scrolled out of
  // it. The browser reveals a focused element by scrolling — the credit link at
  // the stage's foot sits inside the page's scroll padding, and focusing it
  // moved the page 416px, which disengaged the stage and turned the next Space
  // into a page-down. Everything inside a viewport-tall stage is already in
  // view, so put the stage back where it fills the screen.

  function onFocusIn(): void {
    requestAnimationFrame(() => {
      const t = top();
      if (Math.abs(t) > ENGAGED_PX && Math.abs(t) < window.innerHeight) {
        inside = true;
        window.scrollTo({ top: window.scrollY + t, behavior: 'auto' });
      }
    });
  }

  // ---- a tap on empty stage ----------------------------------------------

  function onClick(e: MouseEvent): void {
    if ((e.target as Element | null)?.closest(CONTROL)) return;
    if (engaged()) {
      inside = true;
      step(1);
    } else if (inside) align();
    else arrive(top() > 0 ? 1 : -1);
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
    inside = engaged();
    publish();

    // back from a branch, to a named step
    const onStep = (event: Event) => {
      const { stage, step: stepId } = (event as CustomEvent<StageStep>).detail;
      if (stage !== id || !machine) return;
      const index = machine.steps.findIndex((s) => s.id === stepId);
      if (index < 0) return;
      const from = machine.index;
      machine.reach(index);
      show(from, 'jump');
      inside = true;
      window.scrollTo({ top: window.scrollY + top(), behavior: live.reduced ? 'auto' : 'smooth' });
    };
    window.addEventListener(STAGE_STEP_EVENT, onStep);
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
      document.documentElement.removeAttribute(STAGE_STATE_ATTRIBUTE);
      window.removeEventListener(STAGE_STEP_EVENT, onStep);
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
  onfocusin={onFocusIn}
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
