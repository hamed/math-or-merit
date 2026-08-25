<script lang="ts" module>
  import type { BeatSpec } from '../contract';

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
   * The person's reduction and the first trade are ONE scene, deliberately.
   *
   * They used to be two pinned sections, and no amount of matching geometry
   * could hide the seam: the first section unpins and scrolls off the top while
   * the second scrolls up from the bottom, so the circle left the screen and an
   * identical one arrived. The reader sees a swap and learns nothing from it.
   *
   * Here there is one timeline and, more importantly, ONE circle element. The
   * person reduces onto it, it becomes money and back, then it slides aside to
   * open a seat and a second circle walks in from the right. It is the same
   * path node the whole way through — trader A is not a redraw of the person's
   * circle, it IS the person's circle.
   */
  export const BEATS: readonly BeatSpec[] = [
    { label: 'person', length: 1.1 },
    { label: 'face', length: 0.9 },
    { label: 'strip', length: 1.6 },
    { label: 'circle', length: 0.9 },
    { label: 'coins', length: 1.2 },
    { label: 'one', length: 1 },
    { label: 'slide', length: 0.9 },
    { label: 'meet', length: 1 },
    { label: 'ante', length: 1.1 },
    { label: 'flip', length: 1.8 },
    { label: 'fair', length: 0.8 },
    { label: 'crowd', length: 1.3 },
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
   * The stage is 480x300 — the trade layout's box. The person plates are cut to
   * 480:280, so they sit in a rect inset by PLATE_Y, which is what keeps them
   * centred here.
   */
  const VIEW_W = 480;
  const VIEW_H = 300;
  const PLATE_H = 280;
  const PLATE_Y = (VIEW_H - PLATE_H) / 2;

  /** Where the person's circle rests before it takes its seat. */
  const HOME = { x: 240, y: 150 + PLATE_Y, r: 62 };

  /**
   * Scripted two-flip sequence, numbers from the REAL trade rule (only the
   * outcomes are authored, presets.ts honesty note). The demo stake is HALF
   * of the poorer trader's wealth (owner review 2026-07-08: big enough that
   * the area change is meaningful; later rooms use gentler stakes).
   *
   *   start: A .62, B .38 — B meaningfully smaller
   *   t1: stake .5·min = .19  → B wins both coins → A .43,  B .57
   *   t2: stake .5·min = .215 → A wins both coins → A .645, B .355
   *
   * Ends within ~2% of the start — "win some, lose some" stays honest.
   */
  const W_A = 0.62;
  const W_B = 0.38;
  const STAKE_1 = 0.19;
  const STAKE_2 = 0.215;

  /** radius = K·√wealth so area = wealth (the essay's honest encoding). */
  const K = 60;
  const R_A = K * Math.sqrt(W_A);
  const R_B = K * Math.sqrt(W_B);

  /** The canonical coin: fixed size, a token of the ante — the agents' areas
   * carry the truth. Two coins sit side by side; no merged pot. */
  const COIN_R = 16.6;

  const A_POS = { x: 150, y: 158 };
  const B_POS = { x: 330, y: 158 };
  const TABLE = { x: 240, y: 176 };
  const FLIP = { x: 240, y: 64 };

  /** Ring layout shared with the crowd beat (13 agents incl. the pair). */
  const RING_N = 13;
  const RING = Array.from({ length: RING_N }, (_, i) => {
    const angle = (i / RING_N) * Math.PI * 2 - Math.PI / 2;
    return { x: 240 + Math.cos(angle) * 195, y: 158 + Math.sin(angle) * 118 };
  });
  const A_SLOT = 10;
  const B_SLOT = 3;
  const CROWD_R = 23;

  /**
   * Honeycomb lattice of 14 identical coins whose total area equals the r=62
   * circle (r = 62/√14). Wealth is coin COUNT at a fixed coin size — the
   * canonical coin never changes size (owner review 2026-07-08).
   */
  const LATTICE_R = HOME.r / Math.sqrt(14);
  const COIN_GRID: { cx: number; cy: number }[] = [];
  {
    const dx = LATTICE_R * 2;
    const dy = LATTICE_R * Math.sqrt(3);
    const rows = [3, 4, 4, 3];
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

  const styles = assignStyles(RING_N);
  const [styleA, styleB] = styles;

  // crowd agents 2..12 fill the ring slots the pair doesn't take
  const crowdSlots = RING.map((p, slot) => ({ p, slot })).filter(
    ({ slot }) => slot !== A_SLOT && slot !== B_SLOT,
  );

  /** Panel switch width. See CowCastScene for why this is a cut, not a fade. */
  const SWITCH = 0.05;

  /** The leftover circle's colour before it becomes an agent. */
  const NEUTRAL = { fill: '#f6ead2', stroke: '#3c352b' };

  /**
   * The last plate has to land exactly on the circle, because everything after
   * it — the coin lattice, the seat, the ring — is built around that circle.
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
  let agentB: SVGPathElement;
  let groupA: SVGGElement;
  let groupB: SVGGElement;
  let coinA: SVGGElement;
  let coinB: SVGGElement;
  let flipG: SVGGElement;
  let flipFace: SVGCircleElement;
  let crowd: SVGGElement;
  let lattice: SVGGElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const sA = (w: number) => Math.sqrt(w / W_A);
      const sB = (w: number) => Math.sqrt(w / W_B);
      const coins = [coinA, coinB];
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

      PLATES.forEach((plate, i) => {
        const el = plates[i];
        if (!el) return;

        if (i === 0) {
          tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, startOf.get('person'));
          return;
        }

        const at = startOf.get(plate.beat)! + offsetFor(plate.beat) - SWITCH * 0.5;
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: SWITCH, ease: 'steps(1)' }, at);
        tl.to(plates[i - 1], { autoAlpha: 0, duration: SWITCH, ease: 'steps(1)' }, at);
      });

      // gsap owns the transform origin for the two traders, set once here
      // rather than left to CSS. `transform-box: fill-box` is not reliably
      // honoured by gsap's matrix path (the lesson the stage notes already
      // record), and the symptom was specific: they scaled about their bounding
      // box corner, so they drifted up and left as they shrank through the ante
      // and the flips instead of staying put.
      //
      // Only these two. The crowd's shapes must NOT be given a percentage
      // origin: '50% 50%' is the bounding box centre, which for a triangle or a
      // pentagon is not the centroid the path is drawn around, so it displaces
      // them off their ring slots. They only ever scale on their entrance and
      // finish at 1, so the origin never shows.
      tl.set([agentA, agentB], { transformOrigin: '50% 50%' }, 0);

      // The circle spends the whole reduction parked at HOME, wearing the size
      // it will have as the leftover. It only takes its seat at 'slide'.
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

      // coins — the circle IS money: same area, fourteen golden pieces
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

      // ---- the first trade -----------------------------------------------

      // slide — the circle steps aside to open a seat, settling at the radius
      // its wealth earns. Nothing leaves the screen: it is the same node, and
      // the next beat simply adds a second circle beside it.
      tl.to(groupA, { x: A_POS.x, y: A_POS.y, duration: 0.55, ease: 'power1.inOut' }, 'slide+=0.1');
      tl.to(agentA, { scale: 1, duration: 0.55, ease: 'power1.inOut' }, 'slide+=0.1');

      // meet — the second trader walks in from the right, noticeably poorer
      // (gsap reads the g's translate attr, so x/y are absolute coordinates)
      tl.fromTo(
        groupB,
        { x: B_POS.x + 240, autoAlpha: 0 },
        { x: B_POS.x, autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
        'meet+=0.2',
      );

      // ante — one coin each slides out; the agents shrink by what they staked.
      // The coin wrappers carry no transform attr, so x/y tween relative.
      tl.fromTo(
        coinA,
        { autoAlpha: 0, x: A_POS.x - TABLE.x + 20, y: A_POS.y - TABLE.y },
        { autoAlpha: 1, x: -COIN_R - 2, y: 0, duration: 0.3 },
        'ante+=0.05',
      );
      tl.to(agentA, { scale: sA(W_A - STAKE_1), duration: 0.3 }, 'ante+=0.05');
      tl.fromTo(
        coinB,
        { autoAlpha: 0, x: B_POS.x - TABLE.x - 20, y: B_POS.y - TABLE.y },
        { autoAlpha: 1, x: COIN_R + 2, y: 0, duration: 0.3 },
        'ante+=0.25',
      );
      tl.to(agentB, { scale: sB(W_B - STAKE_1), duration: 0.3 }, 'ante+=0.25');

      // flip 1 — the coin spins about its central VERTICAL axis; B's color
      // lands; BOTH coins go to the winner, whose area grows by exactly both
      tl.fromTo(flipG, { autoAlpha: 0, y: FLIP.y - 14 }, { autoAlpha: 1, y: FLIP.y, duration: 0.2 }, 'flip');
      tl.set(flipFace, { transformOrigin: '50% 50%' }, 0);
      tl.to(flipFace, {
        keyframes: [
          { scaleX: 0.08, duration: 0.09 }, { scaleX: 1, duration: 0.09 },
          { scaleX: 0.08, duration: 0.09 }, { scaleX: 1, duration: 0.09 },
          { scaleX: 0.08, duration: 0.09 }, { scaleX: 1, duration: 0.09 },
        ],
        ease: 'none',
      }, 'flip+=0.2');
      // face color swaps at each squash midpoint; ends on B's fill
      tl.set(flipFace, { fill: styleB.fill, stroke: styleB.stroke }, 'flip+=0.29');
      tl.set(flipFace, { fill: styleA.fill, stroke: styleA.stroke }, 'flip+=0.47');
      tl.set(flipFace, { fill: styleB.fill, stroke: styleB.stroke }, 'flip+=0.65');
      tl.to(coins, {
        x: B_POS.x - TABLE.x,
        y: B_POS.y - TABLE.y,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        stagger: 0.05,
      }, 'flip+=0.8');
      tl.to(agentB, { scale: sB(W_B + STAKE_1), duration: 0.25 }, 'flip+=1.0');

      // flip 2 — ante again (the poorer one is now A's side of the rule);
      // A's color lands; both coins come back; both stand near the start
      tl.fromTo(
        coinA,
        { autoAlpha: 0, x: A_POS.x - TABLE.x + 20, y: A_POS.y - TABLE.y },
        { autoAlpha: 1, x: -COIN_R - 2, y: 0, duration: 0.15 },
        'flip+=1.15',
      );
      tl.fromTo(
        coinB,
        { autoAlpha: 0, x: B_POS.x - TABLE.x - 20, y: B_POS.y - TABLE.y },
        { autoAlpha: 1, x: COIN_R + 2, y: 0, duration: 0.15 },
        'flip+=1.15',
      );
      tl.to(agentA, { scale: sA(W_A - STAKE_1 - STAKE_2), duration: 0.15 }, 'flip+=1.15');
      tl.to(agentB, { scale: sB(W_B + STAKE_1 - STAKE_2), duration: 0.15 }, 'flip+=1.15');
      tl.to(flipFace, {
        keyframes: [
          { scaleX: 0.08, duration: 0.08 }, { scaleX: 1, duration: 0.08 },
          { scaleX: 0.08, duration: 0.08 }, { scaleX: 1, duration: 0.08 },
        ],
        ease: 'none',
      }, 'flip+=1.3');
      tl.set(flipFace, { fill: styleA.fill, stroke: styleA.stroke }, 'flip+=1.38');
      tl.to(coins, {
        x: A_POS.x - TABLE.x,
        y: A_POS.y - TABLE.y,
        autoAlpha: 0,
        duration: 0.25,
        ease: 'power2.in',
        stagger: 0.05,
      }, 'flip+=1.5');
      tl.to(agentA, { scale: sA(W_A + STAKE_2 - STAKE_1), duration: 0.2 }, 'flip+=1.65');

      // fair — the coin bows out; both stand where they started
      tl.to(flipG, { autoAlpha: 0, y: FLIP.y - 10, duration: 0.25 }, 'fair');
      tl.to([agentA, agentB], { scale: 1, duration: 0.35 }, 'fair+=0.1');

      // crowd — the pair joins the ring; the room fills with styled agents
      tl.to(agentA, { scale: CROWD_R / R_A, duration: 0.5, ease: 'power2.inOut' }, 'crowd');
      tl.to(agentB, { scale: CROWD_R / R_B, duration: 0.5, ease: 'power2.inOut' }, 'crowd');
      tl.to(groupA, { x: RING[A_SLOT].x, y: RING[A_SLOT].y, duration: 0.5, ease: 'power2.inOut' }, 'crowd');
      tl.to(groupB, { x: RING[B_SLOT].x, y: RING[B_SLOT].y, duration: 0.5, ease: 'power2.inOut' }, 'crowd');
      const crowdEls = crowd.querySelectorAll<SVGPathElement>('path');
      tl.fromTo(
        crowdEls,
        { autoAlpha: 0, scale: 0.4 },
        { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.04 },
        'crowd+=0.35',
      );
    });
  });
</script>

<figure
  class="scene-art room-stage"
  aria-label="A person simplified step by step to a circle, which becomes money, then takes a seat as a second circle joins it to trade; finally the room fills"
>
  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img">
    {#each PLATES as plate, i}
      <image
        bind:this={plates[i]}
        href={plate.src}
        x="0"
        y={PLATE_Y}
        width={VIEW_W}
        height={PLATE_H}
        preserveAspectRatio="xMidYMid meet"
      />
    {/each}

    <!-- ONE circle for the person and for trader A. Never two. -->
    <g bind:this={groupA} transform={`translate(${HOME.x} ${HOME.y})`}>
      <path
        bind:this={agentA}
        class="agent"
        d={svgShapePath('circle', R_A)}
        vector-effect="non-scaling-stroke"
      />
    </g>
    <g bind:this={groupB} transform={`translate(${B_POS.x} ${B_POS.y})`}>
      <path
        bind:this={agentB}
        class="agent"
        d={svgShapePath('circle', R_B)}
        style={`fill:${styleB.fill}; stroke:${styleB.stroke};`}
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

    <!-- the two antes: side by side on the table, never merged -->
    <g bind:this={coinA} class="ante">
      <Coin cx={TABLE.x} cy={TABLE.y} r={COIN_R} face="front" />
    </g>
    <g bind:this={coinB} class="ante">
      <Coin cx={TABLE.x} cy={TABLE.y} r={COIN_R} face="back" />
    </g>

    <g bind:this={flipG} class="flip" transform={`translate(${FLIP.x} ${FLIP.y})`}>
      <circle bind:this={flipFace} class="flip-face" r="24" style={`fill:${styleA.fill}; stroke:${styleA.stroke};`} />
    </g>

    <g bind:this={crowd} class="crowd">
      {#each crowdSlots as { p, slot }, k}
        {@const style = styles[k + 2]}
        <g transform={`translate(${p.x} ${p.y})`} data-slot={slot}>
          <path
            class="agent"
            d={svgShapePath(style.shape, CROWD_R)}
            style={`fill:${style.fill}; stroke:${style.stroke};`}
            vector-effect="non-scaling-stroke"
          />
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
    inline-size: min(94vw, 62rem);
    max-block-size: calc(68svh * 300 / 280);
  }

  /* No transform-box/transform-origin here: gsap sets the origin explicitly in
     the timeline, and leaving a CSS one in place is what made the agents scale
     about their corner. */
  .agent {
    stroke-width: 1.8;
    fill-opacity: 0.75;
  }

  .ante {
    opacity: 0;
  }

  .flip {
    opacity: 0;
  }

  /* No CSS transform-box here: gsap owns the origin, or the spin pivots off
     the coin's edge instead of its central vertical axis. */
  .flip-face {
    stroke-width: 2.4;
    fill-opacity: 0.9;
  }

  .crowd .agent {
    opacity: 0;
  }
</style>
