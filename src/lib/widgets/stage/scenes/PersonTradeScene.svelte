<script lang="ts" module>
  import type { BeatSpec } from '../contract';
  import { HOLDINGS, UNITS } from './pair/game';

  import figure from './person/00-figure.webp';
  import head01 from './person/01-head.webp';
  import head02 from './person/02-head.webp';
  import head03 from './person/03-head.webp';
  import head04 from './person/04-head.webp';
  import head05 from './person/05-head.webp';
  import head06 from './person/06-head.webp';
  import head07 from './person/07-head.webp';
  import head08 from './person/08-head.webp';
  import head09 from './person/09-head.webp';
  import head10 from './person/10-head.webp';

  /**
   * Branch B2 (2026-09-24, D19): a person reduced, plate by plate, to one
   * circle, which becomes money and back — and no further. The two-person
   * game that used to follow moved into the pair stage, where Blue and Red
   * play it (`pair/game.ts`); its half of this scene was deleted 2026-09-27.
   * The circle is ONE element the whole way: the last plate shrinks onto it
   * and hands over.
   */
  export const BEATS: readonly BeatSpec[] = [
    // artBottom: where the ink ends in this beat, so the caption sits one line
    // under it. The plates fill the frame; the circle and the coins live in
    // the middle of it.
    { label: 'person', length: 1.1, artBottom: 0.97 },
    { label: 'face', length: 0.9, artBottom: 0.97 },
    { label: 'strip', length: 1.6, restAt: 1.4, artBottom: 0.97 },
    { label: 'circle', length: 0.9, restAt: 0.86, artBottom: 0.78 },
    { label: 'coins', length: 1.2, restAt: 0.93, artBottom: 0.75 },
    { label: 'one', length: 1, restAt: 0.65, artBottom: 0.75 },
  ];

  export const PLATES: readonly { src: string; beat: string }[] = [
    { src: figure, beat: 'person' },
    { src: head01, beat: 'face' },
    { src: head02, beat: 'strip' },
    { src: head03, beat: 'strip' },
    { src: head04, beat: 'strip' },
    { src: head05, beat: 'strip' },
    { src: head06, beat: 'strip' },
    { src: head07, beat: 'strip' },
    { src: head08, beat: 'strip' },
    { src: head09, beat: 'strip' },
    { src: head10, beat: 'circle' },
  ];

  /**
   * The stage is 480x300 — the box the trade used to need. The person plates are cut to
   * 480:280, so they sit in a rect inset by PLATE_Y, which is what keeps them
   * centred here.
   */
  const VIEW_W = 480;
  const VIEW_H = 300;
  const PLATE_H = 280;
  const PLATE_Y = (VIEW_H - PLATE_H) / 2;

  /** Where the person's circle rests before it takes its seat. */
  const HOME = { x: 240, y: 150 + PLATE_Y, r: 62 };

  /** The circle's fortune: half the coins, as the game's first seat had it. */
  const W_A = HOLDINGS[0].a / UNITS;

  /** radius = K·√wealth so area = wealth (the essay's honest encoding). */
  const K = 60;
  const R_A = K * Math.sqrt(W_A);

  /** The palette the scene has always drawn its circle's colours from. */
  const PALETTE_N = 13;

  /**
   * Honeycomb lattice of UNITS identical coins whose total area equals the r=62
   * circle (r = 62/√UNITS). Wealth is coin COUNT at a fixed coin size — the
   * canonical coin never changes size (owner review 2026-07-08) — and the same
   * count is what the antes are cut from, so half a fortune is eight of these.
   */
  const LATTICE_R = HOME.r / Math.sqrt(UNITS);

  const COIN_GRID: { cx: number; cy: number }[] = [];
  {
    const dx = LATTICE_R * 2;
    const dy = LATTICE_R * Math.sqrt(3);
    const rows = [3, 4, 5, 4];
    rows.forEach((count, ri) => {
      const y = HOME.y + (ri - 1.5) * dy;
      for (let ci = 0; ci < count; ci++) {
        COIN_GRID.push({ cx: HOME.x + (ci - (count - 1) / 2) * dx, cy: y });
      }
    });
  }
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { assignStyles } from '../../shared/agentStyle';
  import { svgShapePath } from '../../shared/shapePath';
  import Coin from './Coin.svelte';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  const [styleA] = assignStyles(PALETTE_N);

  /** The leftover circle's colour before it becomes an agent. */
  const NEUTRAL = { fill: '#f6ead2', stroke: '#3c352b' };

  /**
   * The last plate has to land exactly on the circle, because everything after
   * it — the coin lattice and back — is built around that circle.
   *
   * A plate is 1543x900 drawn into a 480x280 rect inset by PLATE_Y, so one
   * plate pixel is 480/1543 units. Measured there the drawn circle sits at
   * (240.2, 134.2 + PLATE_Y) with radius 105.2, against HOME's radius 62. So
   * the plate shrinks by 62/105.2 about an origin solved from where the circle
   * must END: scaling about P maps B to P + s(B - P), so P = (s·B - C)/(s - 1).
   *
   * That shrink is not just plumbing — 'circle' is the beat whose caption calls
   * the leftover offensively small, so the reduction is the picture.
   */
  const CIRCLE_FIT = (() => {
    const k = VIEW_W / 1543;
    const b = { x: 772 * k, y: PLATE_Y + 431.5 * k };
    const s = HOME.r / (338.25 * k);
    const p = (bv: number, cv: number) => (s * bv - cv) / (s - 1);
    return { scale: s, origin: `${p(b.x, HOME.x).toFixed(1)} ${p(b.y, HOME.y).toFixed(1)}` };
  })();

  let plates: SVGImageElement[] = [];
  let agentA: SVGPathElement;
  let groupA: SVGGElement;
  let lattice: SVGGElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const coinEls = lattice.querySelectorAll<SVGGElement>('.lattice-coin');

      // Absolute timeline positions, not label arithmetic: 'label+=-0.025' is
      // not something gsap parses as a negative offset, and it silently lands
      // elsewhere. These are the same cumulative sums PinScene labels with.
      const startOf = new Map<string, number>();
      {
        let t = 0;
        for (const beat of BEATS) {
          startOf.set(beat.label, t);
          t += beat.length;
        }
      }

      // ---- the reduction -------------------------------------------------

      const stripCount = PLATES.filter((p) => p.beat === 'strip').length;
      const stripSpan = BEATS.find((b) => b.label === 'strip')!.length;
      let stripSeen = -1;
      const offsetFor = (beat: string) => {
        if (beat !== 'strip') return 0;
        stripSeen += 1;
        return (stripSeen * stripSpan) / stripCount;
      };

      // One plate visible at a time, forward or backward, at any scrub speed:
      // a SHOW and a HIDE at absolute positions rather than a pair of
      // overlapping fades. The last plate is left alone — it does not cut out,
      // it shrinks onto the circle below and hands over.
      const showAt: number[] = [];
      PLATES.forEach((plate, i) => {
        showAt[i] = startOf.get(plate.beat)! + offsetFor(plate.beat);
      });

      PLATES.forEach((plate, i) => {
        const el = plates[i];
        if (!el) return;
        tl.set(el, { autoAlpha: 0 }, 0);
        tl.set(el, { autoAlpha: 1 }, showAt[i]);
        if (i + 1 < PLATES.length) tl.set(el, { autoAlpha: 0 }, showAt[i + 1]);
      });

      // gsap owns the circle's transform origin, set once here rather than left
      // to CSS: `transform-box: fill-box` is not reliably honoured by gsap's
      // matrix path, and a circle scaled about its bounding box corner drifts.
      tl.set(agentA, { transformOrigin: '50% 50%' }, 0);

      // The circle spends the whole reduction parked at HOME, wearing the size
      // it has as the leftover.
      tl.set(groupA, { x: HOME.x, y: HOME.y }, 0);
      tl.set(agentA, { scale: HOME.r / R_A, ...NEUTRAL }, 0);

      // circle — the plate shrinks onto the circle, then hands over to it. The
      // two coincide exactly at that moment, so the swap is invisible; from
      // here on it is a vector again and can take the agent's colors.
      const circleAt = startOf.get('circle')!;
      const last = plates[PLATES.length - 1];
      tl.fromTo(
        last,
        { scale: 1, svgOrigin: CIRCLE_FIT.origin },
        { scale: CIRCLE_FIT.scale, svgOrigin: CIRCLE_FIT.origin, duration: 0.55, ease: 'power2.inOut' },
        circleAt,
      );
      tl.to(last, { autoAlpha: 0, duration: 0.01, ease: 'steps(1)' }, circleAt + 0.55);
      tl.fromTo(agentA, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'steps(1)' }, circleAt + 0.55);
      tl.to(agentA, { fill: styleA.fill, stroke: styleA.stroke, duration: 0.3 }, circleAt + 0.56);

      // coins — the circle IS money: same area, sixteen golden pieces
      tl.to(agentA, { autoAlpha: 0, duration: 0.25 }, 'coins');
      tl.fromTo(
        coinEls,
        { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' },
        { scale: 1, autoAlpha: 1, duration: 0.3, stagger: { each: 0.035, from: 'center' } },
        'coins+=0.1',
      );

      // one — the coins pour back into a single person-sized circle
      tl.to(
        coinEls,
        {
          x: (_, el) => Number((el as SVGGElement).dataset.dx),
          y: (_, el) => Number((el as SVGGElement).dataset.dy),
          scale: 0.35,
          autoAlpha: 0,
          duration: 0.35,
          stagger: { each: 0.02, from: 'edges' },
        },
        'one',
      );
      tl.to(agentA, { autoAlpha: 1, duration: 0.3 }, 'one+=0.3');
    });
  });
</script>

<figure
  class="scene-art room-stage"
  aria-label="A person simplified step by step to a circle, which becomes money and back"
>
  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img">
    {#each PLATES as plate, i}
      <image
        bind:this={plates[i]}
        href={stage?.assetsReady() === false ? undefined : plate.src}
        x="0"
        y={PLATE_Y}
        width={VIEW_W}
        height={PLATE_H}
        preserveAspectRatio="xMidYMid meet"
      />
    {/each}

    <!-- ONE circle for the person, the plates shrinking onto it. Never two. -->
    <g bind:this={groupA} transform={`translate(${HOME.x} ${HOME.y})`}>
      <path
        bind:this={agentA}
        class="agent"
        d={svgShapePath('circle', R_A)}
        vector-effect="non-scaling-stroke"
      />
    </g>
    <g bind:this={lattice} class="coins">
      {#each COIN_GRID as c, i}
        <g class="lattice-coin" data-dx={HOME.x - c.cx} data-dy={HOME.y - c.cy}>
          <!-- faces alternate so the pile reads as loose change, not a decal -->
          <Coin cx={c.cx} cy={c.cy} r={LATTICE_R} face={i % 2 === 0 ? 'front' : 'back'} />
        </g>
      {/each}
    </g>
  </svg>
</figure>

<style>
  /* Matches the cow cast's stage width. The height cap has to scale with the
     viewBox: PinScene caps stages at 68svh, which assumes the 280-unit box the
     other scenes use, and this one is 300 units tall — without this it clamps
     sooner and renders at a smaller px-per-unit than its neighbours.

     Doubled-up selector for the specificity reason documented in CowCastScene. */
  .scene-art.room-stage svg {
    /* Sparse vector art inside a 480x300 box: nothing is drawn in the bottom
       tenth, so the caption would sit a whole empty band away. */
    /* Where the drawing actually ends, as a fraction of this box. */
    --art-bottom: 0.72;
    inline-size: min(100%, 62rem);
    max-block-size: calc(68svh * 300 / 280);
  }

  /* No transform-box/transform-origin here: gsap sets the origin explicitly in
     the timeline, and leaving a CSS one in place is what made the agents scale
     about their corner. */
  .agent {
    stroke-width: 1.8;
    fill-opacity: 0.75;
  }
</style>
