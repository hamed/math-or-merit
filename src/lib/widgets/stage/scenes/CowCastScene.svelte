<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  import introduction from './cast/00-introduction.webp';
  import darwin from './cast/01-darwin.webp';
  import chemist from './cast/02-chemist.webp';
  import physicist from './cast/03-physicist.webp';
  import spherical from './cast/04-spherical.webp';
  import vacuum from './cast/05-vacuum.webp';
  import football from './cast/06-football.webp';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'once', length: 1.0 },
    { label: 'darwin', length: 1.1 },
    { label: 'chemist', length: 1.1 },
    { label: 'physicist', length: 1.2 },
    { label: 'sphere', length: 1.2 },
    { label: 'vacuum', length: 1.0 },
    { label: 'football', length: 1.4 },
    { label: 'moral', length: 1.2 },
  ];

  export interface CastFrame {
    readonly src: string;
    /** Beat label this plate cuts in on; must exist in BEATS. */
    readonly beat: string;
  }

  /**
   * One plate per beat, in scene order. The scene is a panel sequence, so this
   * table is the whole choreography — the build below walks it and never names
   * an individual frame. Adding a plate means adding a row here and a row in
   * BEATS, nothing else.
   *
   * 00-05 share a single crop and 06 is cut to the same aspect (see
   * art/cast-scene/process.sh), so the cast holds its size across every switch.
   *
   * The final beat ('moral') deliberately has no plate of its own: it holds the
   * pitch and pushes in, so the picture keeps arguing while the words land.
   */
  export const FRAMES: readonly CastFrame[] = [
    { src: introduction, beat: 'once' },
    { src: darwin, beat: 'darwin' },
    { src: chemist, beat: 'chemist' },
    { src: physicist, beat: 'physicist' },
    { src: spherical, beat: 'sphere' },
    { src: vacuum, beat: 'vacuum' },
    { src: football, beat: 'football' },
  ];
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  /**
   * Panel switch width, in beat-length units.
   *
   * These plates are keyed to transparent ink, so a real cross-dissolve cannot
   * work: with no opaque backdrop to hide behind, both casts show at once and
   * the overlap reads as a double exposure — two Darwins, two cows — while the
   * ink washes out to half strength. The cast also rearranges between panels,
   * so there is no continuous motion for a dissolve to smooth. They are comic
   * panels, and the native grammar for those is a cut. This is kept just wide
   * enough that a scrub does not flicker.
   */
  const SWITCH = 0.05;

  /** How far the closing push drives into the pitch. */
  const PUSH = 2.1;

  /**
   * Origin for the closing push, in viewBox user units.
   *
   * Derived rather than hardcoded, because the plate pipeline adds a margin
   * around every finished plate (art/cast-scene/process.sh MARGIN) and that
   * moves the ball's position within the plate. BALL_FRAC is measured against
   * the PICTURE, not the plate, so it survives a margin change; the plate
   * dimensions below come from the pipeline's output and are the only numbers
   * to update if it is re-run with different settings.
   *
   * Scaling about the ball itself is not what we want: the ball would hold its
   * position high in the frame and its top would leave. Scaling about P maps a
   * point B to P + s(B - P), so to land the ball on the frame centre C at full
   * scale we solve P = (s·B - C)/(s - 1). It then pans to the middle as it
   * grows, which is the camera move we want.
   */
  const PITCH = { w: 1792, h: 973, pictureW: 1600, pictureH: 869 };
  const BALL_FRAC = { x: 0.656, y: 0.253 };

  const BALL_ORIGIN = (() => {
    // the picture sits centred inside the margined plate
    const ox = (PITCH.w - PITCH.pictureW) / 2;
    const oy = (PITCH.h - PITCH.pictureH) / 2;
    const fx = (ox + BALL_FRAC.x * PITCH.pictureW) / PITCH.w;
    const fy = (oy + BALL_FRAC.y * PITCH.pictureH) / PITCH.h;
    // the plate is wider than the 480x280 stage, so it fits by width
    const drawnH = 480 / (PITCH.w / PITCH.h);
    const b = { x: fx * 480, y: (280 - drawnH) / 2 + fy * drawnH };
    // Not the frame centre: the cow-sphere's HORNS and ears stand well above
    // the ball's circle, so landing the circle dead centre clips them off the
    // top. Sitting it lower leaves room for what is drawn above it.
    const c = { x: 240, y: 162 };
    const p = (bv: number, cv: number) => (PUSH * bv - cv) / (PUSH - 1);
    return `${p(b.x, c.x).toFixed(1)} ${p(b.y, c.y).toFixed(1)}`;
  })();

  let plates: SVGImageElement[] = [];

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      FRAMES.forEach((frame, i) => {
        const el = plates[i];
        if (!el) return;

        if (i === 0) {
          // The opening plate is already on screen; fading it up from zero
          // would leave a blank first frame for no-JS and reduced motion.
          tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 'once');
          return;
        }

        // steps(1) is doing real work here: it holds each plate's alpha at 0 or
        // 1 and flips it at the end of the window, so no scroll position can
        // land mid-blend. A linear fade this short still ghosts if the reader
        // parks inside it, which is exactly what a scrubbed timeline lets them
        // do. Both tweens share a position, so the panels swap on one frame.
        const at = `${frame.beat}-=${SWITCH * 0.5}`;
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: SWITCH, ease: 'steps(1)' }, at);

        const previous = plates[i - 1];
        if (previous) {
          tl.to(previous, { autoAlpha: 0, duration: SWITCH, ease: 'steps(1)' }, at);
        }
      });

      // The moral pushes hard into the ball rather than cutting to new art: the
      // frame keeps arguing while the words land, and by the end the cow-sphere
      // is most of the stage — which is also the circle the next scene opens on.
      // The svg viewport clips, so the cast simply leaves the frame.
      //
      // The origin is the ball's place in the letterboxed plate, not the plate's
      // centre, and it is given in viewBox user units via svgOrigin. Percentage
      // transformOrigin drifts here — the ball crawled out of frame as it grew —
      // because the percentages resolve against the <image> rect rather than the
      // letterboxed picture inside it. svgOrigin is the same escape hatch
      // CowScene uses for the flask arm. Safe to combine with scale alone; do
      // not add a translation to this tween (gsap recomputes x/y when svgOrigin
      // scaling and translation share an element, and the plate teleports).
      const pitch = plates[FRAMES.length - 1];
      if (pitch) {
        tl.fromTo(
          pitch,
          { scale: 1, svgOrigin: BALL_ORIGIN },
          { scale: PUSH, svgOrigin: BALL_ORIGIN, duration: 1.2, ease: 'power1.in' },
          'moral',
        );
      }
    });
  });
</script>

<figure
  class="scene-art cast-stage"
  aria-label="Four scientists and a farmer try to fix a cow: the physicist turns it into a sphere, and the sphere ends up on a football pitch"
>
  <svg viewBox="0 0 480 280" role="img">
    {#each FRAMES as frame, i}
      <image
        bind:this={plates[i]}
        href={frame.src}
        x="0"
        y="0"
        width="480"
        height="280"
        preserveAspectRatio="xMidYMid meet"
      />
    {/each}
  </svg>
</figure>

<style>
  /* The plates carry their own alpha and sit straight on the paper — no card,
     no frame, per the frameless mandate.

     These are wide illustrations rather than the sparse line art the other
     scenes hold, so the stage default (54rem) leaves them stranded in margin.
     Widening only this scene; the vertical cap still comes from PinScene.

     The selector is doubled up on purpose. Svelte scopes `.cast-stage svg` as
     `.cast-stage svg.svelte-xxx`, which only TIES PinScene's
     `.pin-scene :global(.scene-art svg)` on specificity — and source order then
     decides, so the override silently did nothing. Naming both classes wins. */
  .scene-art.cast-stage svg {
    inline-size: min(94vw, 62rem);
  }
</style>
