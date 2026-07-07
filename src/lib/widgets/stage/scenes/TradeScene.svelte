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
   * outcomes are authored, presets.ts honesty note): A starts at 0.55, B at
   * 0.45 of the pair's total. B wins the first pot, A the second; both end
   * within 0.5% of where they started — "win some, lose some" stays honest.
   *
   *   t1: stake 0.2·min(.55,.45) = .090 → B wins → A .46, B .54
   *   t2: stake 0.2·min(.46,.54) = .092 → A wins → A .552, B .448
   */
  const W_A = 0.55;
  const W_B = 0.45;
  const STAKE_1 = 0.09;
  const STAKE_2 = 0.092;

  /** radius = K·√wealth so area = wealth (the essay's honest encoding). */
  const K = 60;
  const R_A = K * Math.sqrt(W_A);
  const R_B = K * Math.sqrt(W_B);
  const POT_1 = K * Math.sqrt(2 * STAKE_1);
  const POT_2 = K * Math.sqrt(2 * STAKE_2);
  const COIN_R = K * Math.sqrt(STAKE_1);

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
  const CROWD_R = 26;

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

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  const styles = assignStyles(RING_N);
  const [styleA, styleB] = styles;

  // crowd agents 2..12 fill the ring slots the pair doesn't take
  const crowdSlots = RING.map((p, slot) => ({ p, slot })).filter(({ slot }) => slot !== A_SLOT && slot !== B_SLOT);

  let agentA: SVGPathElement;
  let agentB: SVGPathElement;
  let groupA: SVGGElement;
  let groupB: SVGGElement;
  let coinA: SVGCircleElement;
  let coinB: SVGCircleElement;
  let pot: SVGCircleElement;
  let flipG: SVGGElement;
  let flipFace: SVGCircleElement;
  let crowd: SVGGElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const sA = (w: number) => Math.sqrt(w / W_A);
      const sB = (w: number) => Math.sqrt(w / W_B);

      // meet — the second trader walks in from the side
      // (gsap reads the g's translate attr, so x/y are absolute coordinates)
      tl.fromTo(
        groupB,
        { x: B_POS.x + 240, autoAlpha: 0 },
        { x: B_POS.x, autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
        'meet+=0.2',
      );

      // ante — equal golden slices slide to the table and merge into one pot
      tl.fromTo(coinA, { autoAlpha: 0, attr: { cx: A_POS.x + 30, cy: A_POS.y + 14 } }, { autoAlpha: 1, attr: { cx: TABLE.x - 14, cy: TABLE.y }, duration: 0.3 }, 'ante+=0.05');
      tl.to(agentA, { scale: sA(W_A - STAKE_1), duration: 0.3 }, 'ante+=0.05');
      tl.fromTo(coinB, { autoAlpha: 0, attr: { cx: B_POS.x - 30, cy: B_POS.y + 14 } }, { autoAlpha: 1, attr: { cx: TABLE.x + 14, cy: TABLE.y }, duration: 0.3 }, 'ante+=0.25');
      tl.to(agentB, { scale: sB(W_B - STAKE_1), duration: 0.3 }, 'ante+=0.25');
      tl.to([coinA, coinB], { attr: { cx: TABLE.x }, duration: 0.2 }, 'ante+=0.6');
      tl.to([coinA, coinB], { autoAlpha: 0, duration: 0.12 }, 'ante+=0.75');
      tl.fromTo(
        pot,
        { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', attr: { r: POT_1 } },
        { autoAlpha: 1, scale: 1, duration: 0.2 },
        'ante+=0.75',
      );

      // flip 1 — the two-sided coin spins; B's color lands; the pot is B's
      // (y is absolute: gsap reads the g's translate attr as its y)
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
      tl.to(pot, { attr: { cx: B_POS.x, cy: B_POS.y }, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 'flip+=0.8');
      tl.to(agentB, { scale: sB(W_B + STAKE_1), duration: 0.25 }, 'flip+=1.0');

      // flip 2 — ante again; A's color lands; both are back where they began
      tl.set(pot, { attr: { cx: TABLE.x, cy: TABLE.y, r: POT_2 } }, 'flip+=1.15');
      tl.to(agentA, { scale: sA(W_A - STAKE_1 - STAKE_2), duration: 0.15 }, 'flip+=1.15');
      tl.to(agentB, { scale: sB(W_B + STAKE_1 - STAKE_2), duration: 0.15 }, 'flip+=1.15');
      tl.to(pot, { autoAlpha: 1, duration: 0.1 }, 'flip+=1.2');
      tl.to(flipFace, {
        keyframes: [
          { scaleX: 0.08, duration: 0.08 }, { scaleX: 1, duration: 0.08 },
          { scaleX: 0.08, duration: 0.08 }, { scaleX: 1, duration: 0.08 },
        ],
        ease: 'none',
      }, 'flip+=1.3');
      tl.set(flipFace, { fill: styleA.fill, stroke: styleA.stroke }, 'flip+=1.38');
      tl.to(pot, { attr: { cx: A_POS.x, cy: A_POS.y }, autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, 'flip+=1.5');
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

<figure class="scene-art" aria-label="Two agents ante equal slices, flip a two-colored coin, and end where they started; then the room fills">
  <svg viewBox="0 0 480 300" role="img">
    <g bind:this={groupA} transform={`translate(${A_POS.x} ${A_POS.y})`}>
      <path
        bind:this={agentA}
        class="agent"
        d={svgShapePath(styleA.shape, R_A)}
        style={`fill:${styleA.fill}; stroke:${styleA.stroke};`}
        vector-effect="non-scaling-stroke"
      />
    </g>
    <g bind:this={groupB} transform={`translate(${B_POS.x} ${B_POS.y})`}>
      <path
        bind:this={agentB}
        class="agent"
        d={svgShapePath(styleB.shape, R_B)}
        style={`fill:${styleB.fill}; stroke:${styleB.stroke};`}
        vector-effect="non-scaling-stroke"
      />
    </g>

    <circle bind:this={coinA} class="coin" r={COIN_R} cx={TABLE.x - 14} cy={TABLE.y} />
    <circle bind:this={coinB} class="coin" r={COIN_R} cx={TABLE.x + 14} cy={TABLE.y} />
    <circle bind:this={pot} class="pot" r={POT_1} cx={TABLE.x} cy={TABLE.y} />

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

  .coin,
  .pot {
    fill: var(--coin);
    stroke: var(--coin-ink);
    stroke-width: 1.6;
    opacity: 0;
  }

  .pot {
    stroke-dasharray: 4 3;
    transform-box: fill-box;
    transform-origin: center;
  }

  .flip {
    opacity: 0;
  }

  .flip-face {
    stroke-width: 2.4;
    fill-opacity: 0.9;
    transform-box: fill-box;
    transform-origin: center;
  }

  .crowd .agent {
    opacity: 0;
  }
</style>
