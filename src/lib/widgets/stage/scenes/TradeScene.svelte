<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'meet', length: 1 },
    { label: 'ante', length: 1.1 },
    { label: 'flip', length: 1.8 },
    { label: 'fair', length: 0.8 },
    { label: 'crowd', length: 1.3 },
  ];

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

  /** Equal-area SVG path for a shape centered at (0,0); area = π·r². */
  function svgShapePath(shape: string, r: number): string {
    const area = Math.PI * r * r;
    if (shape === 'triangle') {
      const side = Math.sqrt((4 * area) / Math.sqrt(3));
      const h = (side * Math.sqrt(3)) / 2;
      return `M 0 ${-(2 / 3) * h} L ${side / 2} ${h / 3} L ${-side / 2} ${h / 3} Z`;
    }
    if (shape === 'square') {
      const half = Math.sqrt(area) / 2;
      return `M ${-half} ${-half} H ${half} V ${half} H ${-half} Z`;
    }
    if (shape === 'pentagon' || shape === 'hexagon') {
      const sides = shape === 'pentagon' ? 5 : 6;
      const factor = shape === 'pentagon' ? 2.378 : 2.598;
      const rr = Math.sqrt(area / factor);
      const offset = shape === 'pentagon' ? -Math.PI / 2 : -Math.PI / 6;
      let d = '';
      for (let k = 0; k < sides; k++) {
        const a = ((Math.PI * 2) / sides) * k + offset;
        d += `${k === 0 ? 'M' : 'L'} ${(rr * Math.cos(a)).toFixed(2)} ${(rr * Math.sin(a)).toFixed(2)} `;
      }
      return d + 'Z';
    }
    // circle
    return `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r} Z`;
  }
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { assignStyles } from '../../shared/agentStyle';
  import Coin from './Coin.svelte';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  const styles = assignStyles(RING_N);
  const [styleA, styleB] = styles;

  // crowd agents 2..12 fill the ring slots the pair doesn't take
  const crowdSlots = RING.map((p, slot) => ({ p, slot })).filter(({ slot }) => slot !== A_SLOT && slot !== B_SLOT);

  let agentA: SVGPathElement;
  let agentB: SVGPathElement;
  let groupA: SVGGElement;
  let groupB: SVGGElement;
  let coinA: SVGGElement;
  let coinB: SVGGElement;
  let flipG: SVGGElement;
  let flipFace: SVGCircleElement;
  let crowd: SVGGElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const sA = (w: number) => Math.sqrt(w / W_A);
      const sB = (w: number) => Math.sqrt(w / W_B);
      const coins = [coinA, coinB];

      // meet — the second trader walks in from the side, noticeably poorer
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

<figure class="scene-art" aria-label="Two circles ante one coin each, flip a two-colored coin, the winner takes both; then the room fills">
  <svg viewBox="0 0 480 300" role="img">
    <g bind:this={groupA} transform={`translate(${A_POS.x} ${A_POS.y})`}>
      <path
        bind:this={agentA}
        class="agent"
        d={svgShapePath('circle', R_A)}
        style={`fill:${styleA.fill}; stroke:${styleA.stroke};`}
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

    <!-- the two antes: side by side on the table, never merged -->
    <g bind:this={coinA} class="ante">
      <Coin cx={TABLE.x} cy={TABLE.y} r={COIN_R} />
    </g>
    <g bind:this={coinB} class="ante">
      <Coin cx={TABLE.x} cy={TABLE.y} r={COIN_R} />
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
  .agent {
    stroke-width: 1.8;
    fill-opacity: 0.75;
    transform-box: fill-box;
    transform-origin: center;
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
