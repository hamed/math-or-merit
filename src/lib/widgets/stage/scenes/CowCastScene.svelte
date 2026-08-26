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
    // The bridge from the title, then the fable opens on words alone — no
    // picture yet. The cast arrives after.
    { label: 'bridge', length: 1.1 },
    { label: 'once-upon', length: 1.1 },
    { label: 'once', length: 1.0 },
    { label: 'call', length: 1.0 },
    { label: 'darwin', length: 1.1 },
    { label: 'chemist', length: 1.1 },
    // Then the picture LEAVES and three lines take its place, one per scroll.
    // Three experts have answered and the farmer still has no milk; the empty
    // stage is the joke, so nothing is drawn here on purpose.
    { label: 'silence-1', length: 0.7 },
    { label: 'silence-2', length: 0.7 },
    { label: 'silence-3', length: 0.9 },
    { label: 'physicist', length: 1.2 },
    { label: 'sphere', length: 1.2 },
    { label: 'vacuum', length: 1.0 },
    // The picture leaves again for the lesson itself — the sentence about
    // models is not about anything you can draw.
    { label: 'model', length: 1.4 },
    // The pitch is full-bleed and then pushed into, so its ink runs to the
    // edge of the frame — the studio plates' transparent margin is not there.
    { label: 'football', length: 1.4, artBottom: 1 },
    { label: 'moral', length: 1.4, artBottom: 1 },
  ];

  export interface CastFrame {
    readonly src: string;
    /** Beat label this plate cuts in on; must exist in BEATS. */
    readonly beat: string;
    /**
     * Beat label this plate cuts OUT on, when it must leave before the next
     * plate arrives. Normally a plate simply holds until the next one cuts in;
     * this is for the gap where the stage goes empty.
     */
    readonly until?: string;
  }

  /**
   * Lines that stand in for the picture.
   *
   * Each arrives on its own beat and leaves on `until`. Lines that share an
   * `until` are one card: they stack in reading order, pile up as the reader
   * scrolls, and go together. This is the scene's own art on beats where the
   * words ARE the picture — the pause after three useless answers, and the
   * sentence about models, which is not about anything that can be drawn.
   */
  export const STAGE_TEXT: readonly {
    text: string;
    beat: string;
    until: string;
    /** Set the line at title scale — for a line that IS the answer, not prose. */
    big?: boolean;
  }[] = [
    // The bridge from the title (owner's pick, 2026-08-26). The reel has just
    // stopped on "Math" and the reader is holding a question with no reason yet
    // to believe it. So the answer lands a second time, alone, and then the
    // essay says plainly that it is about to explain itself — which buys the
    // next ninety seconds, which are a joke about a cow.
    { text: 'Math.', beat: 'bridge', until: 'once-upon', big: true },
    { text: 'Let me show you what I mean by that.', beat: 'bridge', until: 'once-upon' },
    { text: 'Then silence,', beat: 'silence-1', until: 'physicist' },
    { text: 'More silence,', beat: 'silence-2', until: 'physicist' },
    { text: 'Even more silence.', beat: 'silence-3', until: 'physicist' },
    // Three lines, one card: they arrive in order inside the one beat rather
    // than costing three scroll steps, because it is one sentence of thought.
    { text: 'The spherical cow is a model.', beat: 'model', until: 'football' },
    { text: 'All models are wrong,', beat: 'model', until: 'football' },
    { text: 'but some of them are useful.', beat: 'model', until: 'football' },
  ];

  /** One card per `until`, in first-appearance order. */
  export const TEXT_CARDS: readonly { until: string; lines: readonly string[] }[] = (() => {
    const order: string[] = [];
    const byUntil = new Map<string, string[]>();
    for (const t of STAGE_TEXT) {
      if (!byUntil.has(t.until)) {
        byUntil.set(t.until, []);
        order.push(t.until);
      }
      byUntil.get(t.until)!.push(t.text);
    }
    return order.map((until) => ({ until, lines: byUntil.get(until)! }));
  })();

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
    { src: chemist, beat: 'chemist', until: 'silence-1' },
    { src: physicist, beat: 'physicist' },
    { src: spherical, beat: 'sphere' },
    { src: vacuum, beat: 'vacuum', until: 'model' },
    { src: football, beat: 'football' },
  ];
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

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
  let lines: HTMLElement[] = [];

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      // Exactly one plate is visible at any moment, forward or backward, at any
      // scrub speed. Each plate gets a SHOW and a HIDE at absolute positions —
      // zero-duration sets, not a pair of overlapping fades — because a cut is
      // the native grammar for comic panels and because anything with a window
      // can be parked inside, which is what a scrubbed timeline invites. (These
      // plates are keyed to transparent ink, so a cross-dissolve would show two
      // casts at once and wash both to half strength; that is not a style
      // choice we are giving up, it is one that never worked.)
      const startOf = new Map<string, number>();
      {
        let t = 0;
        for (const beat of BEATS) {
          startOf.set(beat.label, t);
          t += beat.length;
        }
      }

      FRAMES.forEach((frame, i) => {
        const el = plates[i];
        if (!el) return;

        const show = startOf.get(frame.beat)!;
        // it leaves when it says so, else when the next plate arrives, else at
        // the end of the scene
        const next = FRAMES[i + 1];
        const hide = frame.until
          ? startOf.get(frame.until)!
          : next
            ? startOf.get(next.beat)!
            : Number.POSITIVE_INFINITY;

        tl.set(el, { autoAlpha: 0 }, 0);
        tl.set(el, { autoAlpha: 1 }, show);
        if (Number.isFinite(hide)) tl.set(el, { autoAlpha: 0 }, hide);
      });

      // Each line arrives on its own beat and STAYS, so lines sharing a card
      // pile up on the empty stage; the whole card leaves on its `until`.
      // Handled here rather than as captions because on these beats the words
      // ARE the picture, and the scene owns its own art.
      STAGE_TEXT.forEach((line, i) => {
        const el = lines[i];
        if (!el) return;
        // Lines sharing a beat come in one after another, a breath apart.
        const nth = STAGE_TEXT.slice(0, i).filter((t) => t.beat === line.beat).length;
        // a beat that opens on one big word gives it room before the next line
        tl.fromTo(
          el,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.3, ease: 'none' },
          `${line.beat}+=${(0.05 + nth * (line.big ? 0.35 : 0.5)).toFixed(2)}`,
        );
        tl.to(el, { autoAlpha: 0, duration: 0.25, ease: 'none' }, `${line.until}-=0.25`);
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

  {#each TEXT_CARDS as card}
    <div class="stage-text" aria-hidden="true">
      {#each card.lines as text}
        {@const i = STAGE_TEXT.findIndex((t) => t.text === text)}
        {@const line = STAGE_TEXT[i]}
        <p
          bind:this={lines[i]}
          class:long={text.length > 48}
          class:big={line.big}
          class:sub={!line.big && card.lines.some((t) => STAGE_TEXT.find((x) => x.text === t)?.big)}
        >
          {text}
        </p>
      {/each}
    </div>
  {/each}
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
    inline-size: min(100%, 62rem);

    /* The plates carry a transparent margin (art/cast-scene/process.sh MARGIN),
       so the ink stops short of the box. The caption hangs off the INK. */
    --art-bottom: 0.81;
  }

  /* The lines sit exactly where the picture was, stacked in reading order and
     set like the display captions — this is the stage's own voice, not a
     caption under a picture that is not there. */
  .stage-text {
    position: absolute;
    inset-block-start: 34%;
    inset-inline: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15em;
    text-align: center;
    pointer-events: none;
  }

  .stage-text p {
    margin: 0;
    font-size: clamp(1.9rem, 5vw, 3.4rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--ink-strong);
  }

  /* The title's own scale, for a line that is an answer rather than a
     sentence. It should read as the same voice the reel landed in. */
  .stage-text p.big {
    font-size: clamp(3rem, 9vw, 6.5rem);
    letter-spacing: -0.045em;
    margin-block-end: 0.25em;
  }

  /* The line that follows a big one is the aside, not the answer: it steps
     down, lightens, and stays on one line. */
  .stage-text p.sub {
    max-inline-size: 30ch;
    font-size: clamp(1.15rem, 2.6vw, 1.6rem);
    font-weight: 500;
    letter-spacing: 0;
    line-height: 1.5;
    color: var(--ink-mid);
  }

  /* A whole sentence cannot be set at title size and still be read in one
     glance; it steps down and takes a measure. */
  .stage-text p.long {
    max-inline-size: 22ch;
    font-size: clamp(1.5rem, 3.4vw, 2.4rem);
    line-height: 1.3;
  }
</style>
