<script lang="ts" module>
  /** Full sandbox axes — stake AND tax both 0–100%. Coarse physics: one seed,
   * fewer trades — a backdrop with cross-sections, not the measured artifact
   * the reader painted earlier. Computed once per session, lazily, when the
   * sandbox scrolls near. */
  const STEPS = Array.from({ length: 11 }, (_, i) => i * 0.1); // 0 … 100%
  const N = 100;
  const LEVY_EVERY = 100;
  const TRADES = 60_000;
  const BURN_IN = 40_000;
  const TAIL_SAMPLES = 6;

  let cachedGrid: number[][] | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { runPhaseCell } from '$lib/research';
  import { PHASE_RAMPS, rampColor } from '../shared/presets';
  import { percent } from '../shared/format';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Current dials, both in [0, 1] — the crosshair lives on the map. */
    stake: number;
    taxRate: number;
  }

  let { stake, taxRate }: Props = $props();

  // composite (owner review 2026-07-14): map top-right, gini-vs-tax marginal
  // on its left, gini-vs-stake below, colorbar on the RIGHT so it never reads
  // as x-axis labels. Dashed lines mark the cross-sections on the map.
  const W = 320;
  const H = 320;
  const MAP = { x: 104, y: 12, w: 168, h: 168 };
  const LEFT = { x: 26, y: 12, w: 68, h: 168 }; // gini →, tax ↑ (shared with map)
  const BOT = { x: 104, y: 190, w: 168, h: 68 }; // stake → (shared), gini ↑
  const BAR = { x: 286, y: 12, w: 11, h: 168 };
  const cell = { w: MAP.w / STEPS.length, h: MAP.h / STEPS.length };

  let grid = $state<number[][] | null>(cachedGrid);
  let rampIdx = $state(0);
  let host: SVGSVGElement | undefined = $state();

  const ramp = $derived(PHASE_RAMPS[rampIdx]);
  const cs = $derived(Math.min(1, Math.max(0, stake)));
  const ct = $derived(Math.min(1, Math.max(0, taxRate)));
  const mx = $derived(MAP.x + cs * MAP.w);
  const my = $derived(MAP.y + MAP.h - ct * MAP.h);

  // nearest computed row/column = the plotted cross-sections
  const ix = $derived(Math.round(cs * (STEPS.length - 1)));
  const iy = $derived(Math.round(ct * (STEPS.length - 1)));

  const giniVsTax = $derived.by(() => {
    if (!grid) return '';
    let d = '';
    for (let t = 0; t < STEPS.length; t++) {
      const g = grid[t][ix];
      if (Number.isNaN(g)) continue;
      const x = LEFT.x + g * LEFT.w;
      const y = LEFT.y + LEFT.h - STEPS[t] * LEFT.h;
      d += `${d === '' ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    return d;
  });

  const giniVsStake = $derived.by(() => {
    if (!grid) return '';
    let d = '';
    for (let s = 0; s < STEPS.length; s++) {
      const g = grid[iy][s];
      if (Number.isNaN(g)) continue;
      const x = BOT.x + STEPS[s] * BOT.w;
      const y = BOT.y + BOT.h - g * BOT.h;
      d += `${d === '' ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    return d;
  });

  const cycleRamp = gatedClick(() => (rampIdx = (rampIdx + 1) % PHASE_RAMPS.length));

  function computeGrid(): void {
    if (cachedGrid) return;
    const out: number[][] = STEPS.map(() => STEPS.map(() => NaN));
    const cells: { cx: number; cy: number }[] = [];
    for (let cy = 0; cy < STEPS.length; cy++) {
      for (let cx = 0; cx < STEPS.length; cx++) cells.push({ cx, cy });
    }
    let next = 0;
    const work = () => {
      const budget = performance.now() + 18; // never own a whole frame
      while (next < cells.length && performance.now() < budget) {
        const { cx, cy } = cells[next++];
        out[cy][cx] = runPhaseCell({
          n: N,
          beta: STEPS[cx],
          taxRate: STEPS[cy],
          levyEvery: LEVY_EVERY,
          trades: TRADES,
          burnIn: BURN_IN,
          tailSamples: TAIL_SAMPLES,
          seed: 17 + cx * 101 + cy * 13,
        });
      }
      grid = out.map((r) => r.slice()); // paint as it fills, once per frame
      if (next < cells.length) requestAnimationFrame(work);
      else cachedGrid = out;
    };
    requestAnimationFrame(work);
  }

  onMount(() => {
    if (cachedGrid || !host) return;
    // defer the physics until the sandbox is actually approaching the screen —
    // the essay's opening scene owns the load-time frame budget
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          computeGrid();
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  });
</script>

<svg
  bind:this={host}
  viewBox={`0 0 ${W} ${H}`}
  class="phase"
  role="img"
  aria-label={`Phase map, stake and tax both 0 to 100%, with Gini cross-sections at your dials: ${percent(stake)} stake, ${percent(taxRate)} tax`}
>
  <!-- the map -->
  {#each STEPS as _, ty}
    {#each STEPS as _b, sx}
      {@const g = grid?.[ty][sx] ?? NaN}
      <rect
        x={MAP.x + sx * cell.w}
        y={MAP.y + MAP.h - (ty + 1) * cell.h}
        width={cell.w - 0.6}
        height={cell.h - 0.6}
        fill={Number.isNaN(g) ? 'rgb(60 53 43 / 6%)' : rampColor(ramp, g)}
      />
    {/each}
  {/each}

  <!-- cross-section dashes + the dial marker -->
  <line class="section" x1={MAP.x} y1={my} x2={MAP.x + MAP.w} y2={my} />
  <line class="section" x1={mx} y1={MAP.y} x2={mx} y2={MAP.y + MAP.h} />
  <circle class="marker" cx={mx} cy={my} r="4" />
  <circle class="marker-core" cx={mx} cy={my} r="1.6" />

  <text class="tick" x={MAP.x} y={MAP.y + MAP.h + 11} text-anchor="start">0%</text>
  <text class="tick" x={MAP.x + MAP.w} y={MAP.y + MAP.h + 11} text-anchor="end">100%</text>

  <!-- left marginal: Gini as a function of tax, at the dialed stake -->
  <line class="axis" x1={LEFT.x} y1={LEFT.y} x2={LEFT.x} y2={LEFT.y + LEFT.h} />
  <line class="axis" x1={LEFT.x} y1={LEFT.y + LEFT.h} x2={LEFT.x + LEFT.w} y2={LEFT.y + LEFT.h} />
  {#if giniVsTax}
    <path class="curve" d={giniVsTax} />
  {/if}
  <line class="section" x1={LEFT.x} y1={my} x2={LEFT.x + LEFT.w} y2={my} />
  <text class="tick" x={LEFT.x - 3} y={LEFT.y + LEFT.h} text-anchor="end">0%</text>
  <text class="tick" x={LEFT.x - 3} y={LEFT.y + 6} text-anchor="end">100%</text>
  <text class="axis-label rotated" x={LEFT.x - 16} y={LEFT.y + LEFT.h / 2} text-anchor="middle">tax</text>
  <text class="axis-label" x={LEFT.x + LEFT.w / 2} y={LEFT.y + LEFT.h + 11} text-anchor="middle">Gini →</text>

  <!-- bottom marginal: Gini as a function of stake, at the dialed tax -->
  <line class="axis" x1={BOT.x} y1={BOT.y} x2={BOT.x} y2={BOT.y + BOT.h} />
  <line class="axis" x1={BOT.x} y1={BOT.y + BOT.h} x2={BOT.x + BOT.w} y2={BOT.y + BOT.h} />
  {#if giniVsStake}
    <path class="curve" d={giniVsStake} />
  {/if}
  <line class="section" x1={BOT.x + cs * BOT.w} y1={BOT.y} x2={BOT.x + cs * BOT.w} y2={BOT.y + BOT.h} />
  <text class="axis-label rotated" x={BOT.x - 10} y={BOT.y + BOT.h / 2} text-anchor="middle">Gini →</text>
  <text class="axis-label" x={BOT.x + BOT.w / 2} y={BOT.y + BOT.h + 11} text-anchor="middle">stake</text>

  <!-- colorbar on the RIGHT (never mistakable for x labels); click = colormap -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <g
    class="legend"
    role="button"
    tabindex="0"
    aria-label="Color scale, Gini 0 at the bottom to 1 at the top; activate for the next colormap"
    onclick={cycleRamp}
    onkeydown={(e) => e.key === 'Enter' && (rampIdx = (rampIdx + 1) % PHASE_RAMPS.length)}
  >
    <title>colormap</title>
    <rect class="legend-hit" x={BAR.x - 4} y={BAR.y - 4} width={BAR.w + 26} height={BAR.h + 8} />
    {#each ramp as color, k}
      <rect
        x={BAR.x}
        y={BAR.y + BAR.h - ((k + 1) * BAR.h) / ramp.length}
        width={BAR.w}
        height={BAR.h / ramp.length + 0.5}
        fill={color}
      />
    {/each}
    <text class="tick rotated-bar" x={BAR.x + BAR.w + 9} y={BAR.y + BAR.h / 2} text-anchor="middle">Gini 0 → 1</text>
  </g>
</svg>

<style>
  .phase {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1;
  }

  .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
  }

  .marker {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.4;
  }

  .marker-core {
    fill: var(--ink);
  }

  .tick {
    fill: var(--ink-soft);
    font-size: 8px;
    font-variant-numeric: tabular-nums;
  }

  .axis-label {
    fill: var(--ink-soft);
    font-size: 9px;
  }

  .rotated,
  .rotated-bar {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  .legend {
    cursor: pointer;
  }

  .legend:focus-visible {
    outline: 2px solid rgb(139 63 43 / 45%);
  }

  .legend-hit {
    fill: transparent;
  }
</style>
