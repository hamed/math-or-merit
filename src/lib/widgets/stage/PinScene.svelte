<script lang="ts" module>
  let fontsRefreshHooked = false;

  interface SceneNav {
    from(): number;
    to(): number;
    strict: boolean;
    go(direction: -1 | 1): void;
  }

  const navs = new Set<SceneNav>();
  let hooksAttached = false;
  let touchStartY: number | null = null;
  let wheelGesture: SceneNav | undefined;
  let wheelRestTimer: number | undefined;
  const WHEEL_REST_MS = 300;

  function holdWheelGesture(nav: SceneNav): void {
    wheelGesture = nav;
    if (wheelRestTimer !== undefined) window.clearTimeout(wheelRestTimer);
    wheelRestTimer = window.setTimeout(() => {
      wheelGesture = undefined;
      wheelRestTimer = undefined;
    }, WHEEL_REST_MS);
  }

  function clearWheelGesture(): void {
    if (wheelRestTimer !== undefined) window.clearTimeout(wheelRestTimer);
    wheelGesture = undefined;
    wheelRestTimer = undefined;
  }

  /** Space belongs to the focused control, not to the page. */
  function keyIsClaimed(el: Element | null): boolean {
    if (!el || el === document.body) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return true;
    return (el as HTMLElement).isContentEditable === true;
  }

  function activeNav(strictOnly = false): SceneNav | undefined {
    const y = window.scrollY;
    for (const nav of navs) {
      if (strictOnly && !nav.strict) continue;
      if (y >= nav.from() - 4 && y <= nav.to() + 4) return nav;
    }
    return undefined;
  }

  function keyDirection(e: KeyboardEvent): -1 | 0 | 1 {
    if ((e.key === ' ' || e.key === 'Spacebar') && e.shiftKey) return -1;
    if ([' ', 'Spacebar', 'Enter', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) return 1;
    if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) return -1;
    return 0;
  }

  function onBeatKey(e: KeyboardEvent): void {
    const direction = keyDirection(e);
    if (direction === 0 || e.repeat) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (keyIsClaimed(document.activeElement)) return;
    const nav = activeNav();
    if (!nav) return;
    e.preventDefault();
    nav.go(direction);
  }

  function onBeatWheel(e: WheelEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 2) return;
    const nav = activeNav(true);
    if (wheelGesture) {
      e.preventDefault();
      holdWheelGesture(wheelGesture);
      return;
    }
    if (!nav) return;
    e.preventDefault();
    holdWheelGesture(nav);
    nav.go(delta > 0 ? 1 : -1);
  }

  function onBeatTouchStart(e: TouchEvent): void {
    if (!activeNav(true) || e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
  }

  function onBeatTouchMove(e: TouchEvent): void {
    if (touchStartY === null || !activeNav(true)) return;
    if (e.cancelable) e.preventDefault();
  }

  function onBeatTouchEnd(e: TouchEvent): void {
    if (touchStartY === null) return;
    const start = touchStartY;
    touchStartY = null;
    const end = e.changedTouches[0]?.clientY;
    const nav = activeNav(true);
    if (end === undefined || !nav || Math.abs(start - end) < 24) return;
    if (e.cancelable) e.preventDefault();
    nav.go(start > end ? 1 : -1);
  }

  function attachNavHooks(): void {
    if (hooksAttached) return;
    hooksAttached = true;
    window.addEventListener('keydown', onBeatKey);
    window.addEventListener('wheel', onBeatWheel, { passive: false });
    window.addEventListener('touchstart', onBeatTouchStart, { passive: true });
    window.addEventListener('touchmove', onBeatTouchMove, { passive: false });
    window.addEventListener('touchend', onBeatTouchEnd, { passive: false });
  }

  function detachNavHooksIfIdle(): void {
    if (!hooksAttached || navs.size > 0) return;
    hooksAttached = false;
    touchStartY = null;
    clearWheelGesture();
    window.removeEventListener('keydown', onBeatKey);
    window.removeEventListener('wheel', onBeatWheel);
    window.removeEventListener('touchstart', onBeatTouchStart);
    window.removeEventListener('touchmove', onBeatTouchMove);
    window.removeEventListener('touchend', onBeatTouchEnd);
  }
</script>

<script lang="ts">
  import { onMount, setContext, tick, type Snippet } from 'svelte';
  import { gsap, ScrollTrigger, type StageTimeline } from './gsap';
  import { STAGE_CONTEXT, type BeatSpec, type StageContext } from './contract';
  import { motionOk } from './motion';

  interface Props {
    /** Viewport-heights of scroll per beat-length unit. */
    pace?: number;
    /**
     * What advances the timeline. 'scroll' (default) pins the viewport and
     * scrubs; 'time' plays the same timeline once on the wall clock when the
     * scene first becomes visible (beat lengths are seconds) — no pin, the
     * section scrolls away in normal flow.
     */
    driver?: 'scroll' | 'time';
    /** Free scroll-scrub, or one completed authored beat per gesture/key. */
    navigation?: 'scrub' | 'step';
    /** Hold illustrated image requests until the scene is one viewport away. */
    deferAssets?: boolean;
    children: Snippet;
  }

  let { pace = 0.85, driver = 'scroll', navigation = 'scrub', deferAssets = false, children }: Props = $props();

  let root: HTMLElement;

  /** How much of the scene's height is kept below the caption, always. */
  const CAPTION_FLOOR = 0.18;
  let beats: readonly BeatSpec[] = [];
  let build: ((tl: StageTimeline) => void) | null = null;
  const captions: { el: HTMLElement; beat: number }[] = [];

  let reduced = $state(false);
  let overArt = $state(false);
  const initialAssetsReady = () => !deferAssets;
  let assetsReady = $state(initialAssetsReady());

  setContext<StageContext>(STAGE_CONTEXT, {
    attach(sceneBeats, sceneBuild) {
      beats = sceneBeats;
      build = sceneBuild;
    },
    assetsReady: () => assetsReady,
    registerCaption(el, beat) {
      const entry = { el, beat };
      captions.push(entry);
      return () => {
        const i = captions.indexOf(entry);
        if (i >= 0) captions.splice(i, 1);
      };
    },
  });

  /**
   * Put --picture-bottom where the ART actually ends.
   *
   * Two things can push the real ink above its box edge: plates carry a transparent
   * margin, and the vector scenes draw sparse art inside a taller viewBox. The
   * gap that opened up made picture and words read as two separate things.
   *
   * So each scene declares how far down its own box the art reaches
   * (--art-bottom, a fraction, default 1) and this measures the box. One line
   * of air below that is all the caption gets.
   */
  let lastBottom = -1;
  /** Set by the timeline as it plays; see BeatSpec.artBottom. */
  let beatArtBottom: number | undefined;

  const placeCaptions = () => {
    const art = root?.querySelector<SVGSVGElement>('.scene-art svg');
    if (!art) return;
    // Per-beat if the scene said so, otherwise the one number in its CSS.
    const declared = Number(getComputedStyle(art).getPropertyValue('--art-bottom')) || 1;
    const fraction = beatArtBottom ?? declared;
    const rootBox = root.getBoundingClientRect();
    const box = art.getBoundingClientRect();
    const top = box.top - rootBox.top;

    // The caption follows the picture, but it may not follow it off the screen:
    // a scene that pushes into its own art (the football zoom) grows the
    // picture past the bottom of the viewport, and the words still have to be
    // somewhere a reader can see them.
    const floor = rootBox.height - CAPTION_FLOOR * rootBox.height;
    const bottom = Math.round(Math.min(top + box.height * fraction, floor));

    // Whether the picture is UNDER the words at that point. When it is, the
    // caption is over ink rather than over paper and needs to hold its own.
    let ink = -Infinity;
    for (const el of art.querySelectorAll<SVGGraphicsElement>('image')) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || Number(style.opacity) < 0.05) continue;
      ink = Math.max(ink, el.getBoundingClientRect().bottom - rootBox.top);
    }
    overArt = ink > bottom;

    if (bottom === lastBottom) return;
    lastBottom = bottom;
    root.style.setProperty('--picture-bottom', `${bottom}px`);
  };

  onMount(() => {
    if (!build || beats.length === 0) return;
    reduced = !motionOk();

    placeCaptions();
    const resize = new ResizeObserver(placeCaptions);
    resize.observe(root);
    // Layout at mount is not the layout the reader gets: the scene has not been
    // pinned yet and the display face may still be swapping in. Every refresh
    // re-measures, which is also what a rotate or a resize goes through.
    ScrollTrigger.addEventListener('refresh', placeCaptions);
    document.fonts?.ready.then(placeCaptions);

    if (!fontsRefreshHooked) {
      fontsRefreshHooked = true;
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }

    const decodePlates = async () => {
      await tick();
      const plateSources = new Set<string>();
      for (const image of root.querySelectorAll('image')) {
        const href = image.getAttribute('href') ?? image.getAttribute('xlink:href');
        if (href) plateSources.add(href);
      }
      Promise.allSettled(
        [...plateSources].map((src) => {
          const img = new Image();
          img.src = src;
          return img.decode();
        }),
      ).then(() => ScrollTrigger.refresh());
    };

    let assetObserver: IntersectionObserver | undefined;
    if (deferAssets && 'IntersectionObserver' in window) {
      assetObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          assetsReady = true;
          assetObserver?.disconnect();
          void decodePlates();
        },
        { rootMargin: '100% 0px' },
      );
      assetObserver.observe(root);
    } else {
      assetsReady = true;
      void decodePlates();
    }

    const starts: number[] = [];
    let total = 0;
    for (const b of beats) {
      starts.push(total);
      total += b.length;
    }

    let observer: IntersectionObserver | undefined;
    let nav: SceneNav | undefined;
    let navTween: ReturnType<typeof gsap.to> | undefined;

    const ctx = gsap.context(() => {
      // The beat the playhead is in decides the caption's anchor, so a scene
      // whose art changes size mid-scene keeps its words attached to it.
      const artBottoms = beats.map((b) => b.artBottom);
      const syncBeat = () => {
        if (!artBottoms.some((v) => v !== undefined)) return placeCaptions();
        const t = tl.time();
        let i = 0;
        while (i + 1 < starts.length && starts[i + 1] <= t) i += 1;
        beatArtBottom = artBottoms[i];
        placeCaptions();
      };

      const tl = gsap.timeline({ paused: true, onUpdate: syncBeat });
      beats.forEach((b, i) => tl.addLabel(b.label, starts[i]));
      build!(tl);
      // Pad so every beat owns its full scroll span even if its tweens end early.
      tl.to({}, { duration: 0.001 }, total);

      if (reduced) {
        // Discrete fallback: no pin, no scrub. A timed scene settles straight
        // into its final pose; captions sit in the document flow.
        if (driver === 'time') {
          tl.progress(1, false);
          return;
        }
        // Scroll scenes: a caption crossing the read line seeks its beat's pose.
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const beat = Math.min(Number((entry.target as HTMLElement).dataset.beat) || 0, beats.length - 1);
              tl.seek(Math.min(starts[beat] + beats[beat].length * 0.95, total), false);
            }
          },
          { rootMargin: '-40% 0% -45% 0%' },
        );
        for (const c of captions) observer.observe(c.el);
        return;
      }

      // Caption opacity is tweened INSIDE the master timeline so reverse
      // scrub is exact (Svelte transitions would fight the scrub clock).
      for (const c of captions) {
        const i = Math.min(Math.max(c.beat, 0), beats.length - 1);
        const start = starts[i];
        const len = beats[i].length;
        const fadeIn = Math.min(0.3, len * 0.3);
        tl.fromTo(
          c.el,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: fadeIn, ease: 'none' },
          start + len * 0.04,
        );
        if (i + 1 < beats.length) {
          const fadeOut = Math.min(0.25, len * 0.25);
          tl.to(c.el, { autoAlpha: 0, y: -10, duration: fadeOut, ease: 'none' }, starts[i + 1] - fadeOut);
        }
      }

      if (driver === 'time') {
        // Wall-clock playback, started once when the scene first shows.
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              tl.play();
              observer?.disconnect();
            }
          },
          { threshold: 0.35 },
        );
        observer.observe(root);
        return;
      }

      // Free-scrub scenes retain a short smoothing tail; stepped scenes seek
      // exact resting positions without an additional scrub delay.
      const st = ScrollTrigger.create({
        trigger: root,
        animation: tl,
        pin: true,
        scrub: navigation === 'step' ? true : 0.3,
        start: 'top top',
        end: () => '+=' + Math.round(total * window.innerHeight * pace),
        anticipatePin: 1,
      });

      /**
       * Where each beat RESTS: after its caption is fully in and before it
       * starts leaving. Same arithmetic as the caption tweens above, so the
       * two cannot drift apart.
       */
      const restTimes = beats.map((b, i) => {
        const len = b.length;
        const fadeIn = Math.min(0.3, len * 0.3);
        // a scene that draws its own words says when they have all landed
        const inAt = starts[i] + (b.restAt ?? len * 0.04 + fadeIn);
        const nextStart = i + 1 < beats.length ? starts[i + 1] : total;
        const fadeOut = i + 1 < beats.length ? Math.min(0.25, len * 0.25) : 0;
        const outAt = nextStart - fadeOut;
        if (b.restAt !== undefined) return inAt;
        return outAt > inAt ? (inAt + outAt) / 2 : inAt;
      });

      let movingDirection: -1 | 0 | 1 = 0;
      const stopPositions = () =>
        restTimes.map((t) => st.start + (t / total) * (st.end - st.start));

      const go = (direction: -1 | 1) => {
        if (movingDirection === direction) return;

        const y = window.scrollY;
        const positions = stopPositions();
        let target: number;
        let targetTime: number;
        if (direction > 0) {
          const index = positions.findIndex((position) => position > y + 4);
          if (index < 0) {
            target = st.end + window.innerHeight;
            targetTime = total;
          } else {
            target = positions[index];
            targetTime = restTimes[index];
          }
        } else {
          let index = -1;
          for (let i = positions.length - 1; i >= 0; i--) {
            if (positions[i] < y - 4) {
              index = i;
              break;
            }
          }
          if (index < 0) {
            target = st.start - window.innerHeight;
            targetTime = 0;
          } else {
            target = positions[index];
            targetTime = restTimes[index];
          }
        }

        navTween?.kill();
        const currentTime = Math.max(0, Math.min(total, ((y - st.start) / (st.end - st.start)) * total));
        const duration = target < st.start || target > st.end
          ? 0.55
          : Math.max(0.18, Math.abs(targetTime - currentTime));
        const scroll = { y };
        movingDirection = direction;
        navTween = gsap.to(scroll, {
          y: target,
          duration,
          ease: 'power2.inOut',
          overwrite: true,
          onUpdate: () => window.scrollTo(0, scroll.y),
          onComplete: () => {
            window.scrollTo(0, target);
            navTween = undefined;
            movingDirection = 0;
          },
        });
      };

      nav = {
        from: () => st.start,
        to: () => st.end,
        strict: navigation === 'step',
        go,
      };
      navs.add(nav);
      attachNavHooks();
    }, root);

    return () => {
      observer?.disconnect();
      assetObserver?.disconnect();
      resize.disconnect();
      navTween?.kill();
      if (nav) navs.delete(nav);
      detachNavHooksIfIdle();
      ScrollTrigger.removeEventListener('refresh', placeCaptions);
      ctx.revert();
    };
  });
</script>

<section bind:this={root} class="pin-scene" class:reduced class:over-art={overArt}>
  {@render children()}
</section>

<style>
  .pin-scene {
    position: relative;
    block-size: 100svh;
    overflow: hidden;
  }

  .pin-scene.reduced {
    block-size: auto;
    min-block-size: 100svh;
    overflow: visible;
  }

  /* Fallback only: measured at mount from the scene's own art (see
     placeCaptions). The caption hangs off the same number, so the two cannot
     drift apart. */
  .pin-scene {
    --picture-bottom: 68svh;
  }

  /* The scene's art layer fills the pinned viewport; scenes mark their root. */
  .pin-scene :global(.scene-art) {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    margin: 0;
    padding-block-end: 16svh;
  }

  /* Never wider than the column it sits in: the pinned scene clips its own
     overflow, so a stage that asks for more than the essay's width simply
     loses its edges — which is exactly how the ring lost its outer shapes. */
  .pin-scene :global(.scene-art svg) {
    inline-size: min(100%, 54rem);
    max-block-size: 68svh;
  }

  .pin-scene.reduced :global(.scene-art) {
    position: sticky;
    inset-block-start: 0;
    block-size: 60svh;
    z-index: 2;
    background: linear-gradient(var(--paper) 88%, rgb(244 239 228 / 0%));
  }

  .pin-scene :global(.stage-caption) {
    position: absolute;
    inset-inline: 0;
    inset-block-end: clamp(2rem, 8svh, 5rem);
    margin-inline: auto;
    max-inline-size: 36rem;
    padding-inline: 1.2rem;
    text-align: center;
    text-wrap: balance;
    font-size: clamp(1.15rem, 2.6vw, 1.5rem);
    line-height: 1.55;
    color: var(--ink);
  }

  /* The illustrated scenes are wider than the line-art ones, and their captions
     read better on one or two lines across the picture rather than four down a
     narrow column. */
  .pin-scene :global(.cast-stage) ~ :global(.stage-caption),
  .pin-scene :global(.room-stage) ~ :global(.stage-caption) {
    max-inline-size: min(94vw, 62rem);
  }

  /* Anchor the caption's TOP under the picture rather than its bottom to the
     viewport. Pinned to the bottom, a short caption sits lower than a long one,
     so the gap changed from beat to beat; anchored here it is 34px everywhere.

     ONLY for the cast stage. Its plates fill their frame, so the frame's bottom
     edge IS the picture's bottom edge. The room stage carries sparse vector art
     centred in its viewBox — anchoring that frame would strand a small circle
     high above the words. */
  /* One empty line between the picture and the words. Not a gap made of
     leftover space — the picture's own bottom edge plus one line. */
  .pin-scene :global(.scene-art) ~ :global(.stage-caption) {
    inset-block-end: auto;
    inset-block-start: calc(var(--picture-bottom) + 1lh);
  }

  /* A caption carrying its own line breaks: each authored line must stay one
     line, so the type steps down enough to fit the measure. */
  .pin-scene :global(.stage-caption--broken) {
    text-wrap: initial;
  }

  /* More than one line, so it is ranged left rather than centred: centred rag
     on both sides is hard to read and, per the owner, plainly less pretty. The
     box still shrink-wraps and auto-margins, so the block sits where it did —
     only the lines' left edges line up now. */
  .pin-scene :global(.stage-caption--ranged) {
    inline-size: fit-content;
    text-align: start;
    text-wrap: pretty;
  }

  .pin-scene :global(.stage-caption--display.stage-caption--broken) {
    font-size: clamp(1.5rem, 3.6vw, 2.6rem);
    line-height: 1.3;
  }

  .pin-scene :global(.stage-caption--big.stage-caption--broken) {
    font-size: clamp(1.45rem, 3.2vw, 2.2rem);
  }

  /* Picture and words have to be readable as one thing. Centring the picture in
     the whole viewport while pinning the caption to the bottom left a gap made
     of whatever space was left over — 128px on a desktop, 221px on a phone,
     where it is worst. Anchoring the picture's BOTTOM instead makes the gap a
     fixed slice of the viewport, so it holds at every size. */
  .pin-scene :global(.cast-stage) {
    align-items: end;
    padding-block-end: 22svh;
  }

  /* A line that has to land like a verdict but still belongs to the picture
     above it: bigger and heavier, in the same slot under the art. */
  .pin-scene :global(.stage-caption--big) {
    max-inline-size: 44rem;
    font-size: clamp(1.7rem, 4vw, 2.8rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.25;
    color: var(--ink-strong);
  }

  /* Display captions: title-sized, mid-stage — for lines that ARE the beat. */
  .pin-scene :global(.stage-caption--display) {
    inset-block-end: auto;
    inset-block-start: 38%;
    max-inline-size: 52rem;
    font-size: clamp(1.9rem, 5vw, 3.4rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--ink-strong);
  }

  /* A display line on the cast stage is standing IN for the picture, so it sits
     where the picture sits — not under the rule above, which anchors captions to
     the bottom edge of a plate that is not there. That rule carries one more
     class than .stage-caption--display, so it has to be beaten by name. */
  .pin-scene :global(.cast-stage) ~ :global(.stage-caption--display) {
    inset-block-start: 34%;
  }

  /* Over a picture rather than over paper: the words carry their own paper
     with them, so a caption that has to sit on the art is still readable
     without a box drawn around it. */
  .pin-scene.over-art :global(.stage-caption) {
    text-shadow:
      0 0 0.5em var(--paper),
      0 0 0.5em var(--paper),
      0 0 1em var(--paper),
      0 0 1.6em var(--paper);
  }

  .pin-scene.reduced :global(.stage-caption) {
    position: static;
    margin-block: 55vh 0;
    padding-block-end: 4rem;
  }

  .pin-scene.reduced :global(.stage-caption:first-of-type) {
    margin-block-start: 8vh;
  }
</style>
