<script lang="ts" module>
  let fontsRefreshHooked = false;

  /**
   * Keyboard paging over BEATS, not over viewports.
   *
   * The reader had no beat-aware key at all — space was the browser's own
   * page-down, ~0.9 of a viewport, against beats that are 0.6–1.2 viewports
   * long. It could not help but land mid-fade, and it drifted further out of
   * phase with every press.
   *
   * Every scroll-driven scene registers its stops here: one scroll position
   * per beat, at the point where that beat's caption is FULLY in and has not
   * started leaving. Space goes to the next stop, Shift+Space to the previous,
   * and past the last stop the key is handed back to the browser so the reader
   * pages out of the scene normally.
   */
  interface SceneNav {
    /** Pixel span the scene owns (the ScrollTrigger's start and end). */
    from(): number;
    to(): number;
    /** One resting scroll position per beat, ascending. */
    stops(): number[];
  }

  const navs = new Set<SceneNav>();
  let keyNavHooked = false;

  /** Space belongs to the focused control, not to the page. */
  function keyIsClaimed(el: Element | null): boolean {
    if (!el || el === document.body) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return true;
    return (el as HTMLElement).isContentEditable === true;
  }

  function onBeatKey(e: KeyboardEvent): void {
    if (e.key !== ' ' && e.key !== 'Spacebar') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (keyIsClaimed(document.activeElement)) return;

    const y = window.scrollY;
    for (const nav of navs) {
      const from = nav.from();
      const to = nav.to();
      if (y < from - 4 || y > to + 4) continue;

      const stops = nav.stops();
      let target: number | undefined;
      if (e.shiftKey) {
        for (let i = stops.length - 1; i >= 0; i--) {
          if (stops[i] < y - 4) {
            target = stops[i];
            break;
          }
        }
        target ??= from;
      } else {
        target = stops.find((stop) => stop > y + 4);
        // past the last beat: leave the scene rather than sit on its end
        target ??= to + 4;
      }
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.round(target), behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    // no scene owns this position — let the browser page as usual
  }
</script>

<script lang="ts">
  import { onMount, setContext, type Snippet } from 'svelte';
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
    children: Snippet;
  }

  let { pace = 0.85, driver = 'scroll', children }: Props = $props();

  let root: HTMLElement;

  /** How much of the scene's height is kept below the caption, always. */
  const CAPTION_FLOOR = 0.18;
  let beats: readonly BeatSpec[] = [];
  let build: ((tl: StageTimeline) => void) | null = null;
  const captions: { el: HTMLElement; beat: number }[] = [];

  let reduced = $state(false);

  setContext<StageContext>(STAGE_CONTEXT, {
    attach(sceneBeats, sceneBuild) {
      beats = sceneBeats;
      build = sceneBuild;
    },
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
   * It used to be a fixed 76svh guess, and the caption hung off that. Two
   * things push the real ink well above it: the plates carry a transparent
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
    root.classList.toggle('over-art', ink > bottom);

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

    /**
     * Images were not waited for; only fonts were.
     *
     * An SVG `<image>` paints nothing until its bitmap has decoded, so a plate
     * could be told to show while it was still in flight and the stage looked
     * empty — the scenes carry ~2.8 MB of plates and they all start fetching
     * at once. Decode them off to the side, then refresh, so the pin's
     * measurements and the plate's first paint agree.
     */
    const plateSources = new Set<string>();
    for (const image of root.querySelectorAll('image')) {
      const href = image.getAttribute('href') ?? image.getAttribute('xlink:href');
      if (href) plateSources.add(href);
    }
    if (plateSources.size > 0) {
      Promise.allSettled(
        [...plateSources].map((src) => {
          const img = new Image();
          img.src = src;
          return img.decode();
        }),
      ).then(() => ScrollTrigger.refresh());
    }

    const starts: number[] = [];
    let total = 0;
    for (const b of beats) {
      starts.push(total);
      total += b.length;
    }

    let observer: IntersectionObserver | undefined;
    let nav: SceneNav | undefined;

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

      // 0.3, not 0.6: the tween used to trail the scroll by six tenths of a
      // second, so the reader stopped at the end of a beat with the words
      // still arriving and it read as "one more scroll finishes the text".
      const st = ScrollTrigger.create({
        trigger: root,
        animation: tl,
        pin: true,
        scrub: 0.3,
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
        return outAt > inAt ? (inAt + outAt) / 2 : inAt;
      });

      nav = {
        from: () => st.start,
        to: () => st.end,
        stops: () =>
          restTimes.map((t) => st.start + (t / total) * (st.end - st.start)),
      };
      navs.add(nav);
      if (!keyNavHooked) {
        keyNavHooked = true;
        window.addEventListener('keydown', onBeatKey);
      }
    }, root);

    return () => {
      observer?.disconnect();
      resize.disconnect();
      if (nav) navs.delete(nav);
      ScrollTrigger.removeEventListener('refresh', placeCaptions);
      ctx.revert();
    };
  });
</script>

<section bind:this={root} class="pin-scene" class:reduced>
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
