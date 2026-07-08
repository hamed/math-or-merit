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

  onMount(() => {
    if (!build || beats.length === 0) return;
    reduced = !motionOk();

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
      const tl = gsap.timeline({ paused: true });
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
    font-size: clamp(1.15rem, 2.6vw, 1.5rem);
    line-height: 1.55;
    color: var(--ink);
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

  .pin-scene.reduced :global(.stage-caption) {
    position: static;
    margin-block: 55vh 0;
    padding-block-end: 4rem;
  }

  .pin-scene.reduced :global(.stage-caption:first-of-type) {
    margin-block-start: 8vh;
  }
</style>
