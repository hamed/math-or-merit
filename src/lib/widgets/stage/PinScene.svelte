<script lang="ts" module>
  let fontsRefreshHooked = false;
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
    const box = art.getBoundingClientRect();
    const top = box.top - root.getBoundingClientRect().top;
    const bottom = Math.round(top + box.height * fraction);
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

    const starts: number[] = [];
    let total = 0;
    for (const b of beats) {
      starts.push(total);
      total += b.length;
    }

    let observer: IntersectionObserver | undefined;

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

      ScrollTrigger.create({
        trigger: root,
        animation: tl,
        pin: true,
        scrub: 0.6,
        start: 'top top',
        end: () => '+=' + Math.round(total * window.innerHeight * pace),
        anticipatePin: 1,
      });
    }, root);

    return () => {
      observer?.disconnect();
      resize.disconnect();
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

  .pin-scene :global(.scene-art svg) {
    inline-size: min(92vw, 54rem);
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

  /* Picture and words have to be readable as one thing. Centring the picture in
     the whole viewport while pinning the caption to the bottom left a gap made
     of whatever space was left over — 128px on a desktop, 221px on a phone,
     where it is worst. Anchoring the picture's BOTTOM instead makes the gap a
     fixed slice of the viewport, so it holds at every size. */
  .pin-scene :global(.cast-stage) {
    align-items: end;
    padding-block-end: 22svh;
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

  .pin-scene.reduced :global(.stage-caption) {
    position: static;
    margin-block: 55vh 0;
    padding-block-end: 4rem;
  }

  .pin-scene.reduced :global(.stage-caption:first-of-type) {
    margin-block-start: 8vh;
  }
</style>
