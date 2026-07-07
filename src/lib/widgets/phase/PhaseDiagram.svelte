<script lang="ts" module>
  /** Grid axes: stake (x) × flat levy rate per round (y). Calibrated so the
   * Gini spans ~0.05–0.98 and the 0.5 contour crosses every column
   * (scripts/phase-calibrate.ts, 2026-07-06). */
  const BETAS = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.05);
  const TAXES = Array.from({ length: 13 }, (_, i) => i * 0.01);
  const N = 100;
  const LEVY_EVERY = 100; // one levy per "round" of the room
  const TRADES = 200_000;
  const BURN_IN = 120_000;
  const TAIL_SAMPLES = 8;
  const SEEDS = [11, 271];

  /** Validated sequential terracotta ramp (dataviz ordinal checks, light). */
  const RAMP = ['#d59b87', '#c78168', '#b7684c', '#a45032', '#8c3d20', '#702e16', '#54220f'];

  // Session cache: the map is deterministic, compute it once per page life.
  let cachedGrid: number[][] | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { contourSegments, fitCriticalCurve, runPhaseCell } from '$lib/research';
  import { percent } from '../shared/format';

  const VIEW_W = 480;
  const VIEW_H = 380;
  const PLOT = { x: 64, y: 20, w: 384, h: 300 };

  const cellW = PLOT.w / BETAS.length;
  const cellH = PLOT.h / TAXES.length;

  // grid[iy][ix]; NaN = not yet computed
  let grid = $state<number[][]>(cachedGrid ?? TAXES.map(() => BETAS.map(() => NaN)));
  let done = $state(cachedGrid !== null);
  let progress = $state(cachedGrid !== null ? 1 : 0);

  const finished = $derived(done ? grid : null);

  const contour = $derived.by(() => {
    if (!finished) return [];
    return contourSegments(finished, BETAS, TAXES, 0.5);
  });

  const fitted = $derived.by(() => {
    if (!finished) return null;
    return fitCriticalCurve(finished, BETAS, TAXES, 0.5);
  });

  const xOf = (beta: number) =>
    PLOT.x + ((beta - BETAS[0]) / (BETAS[BETAS.length - 1] - BETAS[0])) * (PLOT.w - cellW) + cellW / 2;
  const yOf = (tax: number) =>
    PLOT.y + PLOT.h - (((tax - TAXES[0]) / (TAXES[TAXES.length - 1] - TAXES[0])) * (PLOT.h - cellH) + cellH / 2);

  const fittedPath = $derived.by(() => {
    if (!fitted) return '';
    const pts: string[] = [];
    for (let beta = BETAS[0]; beta <= BETAS[BETAS.length - 1] + 1e-9; beta += 0.01) {
      const tax = fitted.c * beta * beta;
      if (tax > TAXES[TAXES.length - 1]) break;
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${xOf(beta).toFixed(1)} ${yOf(tax).toFixed(1)}`);
    }
    return pts.join(' ');
  });

  function colorOf(gini: number): string {
    return RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(gini * RAMP.length)))];
  }

  onMount(() => {
    if (cachedGrid) return;
    let cancelled = false;
    const cells: { ix: number; iy: number }[] = [];
    for (let iy = 0; iy < TAXES.length; iy++) {
      for (let ix = 0; ix < BETAS.length; ix++) cells.push({ ix, iy });
    }
    let next = 0;
    const work = () => {
      if (cancelled) return;
      const budget = performance.now() + 24; // stay under ~30 ms per frame
      while (next < cells.length && performance.now() < budget) {
        const { ix, iy } = cells[next++];
        let sum = 0;
        for (const seed of SEEDS) {
          sum += runPhaseCell({
            n: N,
            beta: BETAS[ix],
            taxRate: TAXES[iy],
            levyEvery: LEVY_EVERY,
            trades: TRADES,
            burnIn: BURN_IN,
            tailSamples: TAIL_SAMPLES,
            seed: seed + ix * 101 + iy * 13,
          });
        }
        grid[iy][ix] = sum / SEEDS.length;
      }
      grid = grid.slice(); // repaint the rows finished so far
      progress = next / cells.length;
      if (next < cells.length) {
        requestAnimationFrame(work);
      } else {
        done = true;
        cachedGrid = grid.map((row) => row.slice());
      }
    };
    const frame = requestAnimationFrame(work);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  });
</script>

<div class="widget" aria-label="Map of equilibrium inequality across stake and tax rate">
  <p class="kicker">Every room at once</p>

  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Heat map of equilibrium Gini by stake and tax rate, with the Gini one-half frontier">
    {#each TAXES as tax, iy}
      {#each BETAS as beta, ix}
        {@const g = grid[iy][ix]}
        <rect
          class="cell"
          x={PLOT.x + ix * cellW}
          y={PLOT.y + PLOT.h - (iy + 1) * cellH}
          width={cellW - 1}
          height={cellH - 1}
          fill={Number.isNaN(g) ? 'rgb(60 53 43 / 6%)' : colorOf(g)}
        >
          <title>stake {percent(beta)} · tax {percent(tax, 1)} per round → Gini {Number.isNaN(g) ? '…' : g.toFixed(2)}</title>
        </rect>
      {/each}
    {/each}

    {#if done}
      {#each contour as seg}
        <line class="contour" x1={xOf(seg.x1)} y1={yOf(seg.y1)} x2={xOf(seg.x2)} y2={yOf(seg.y2)} />
      {/each}
      {#if fittedPath}
        <path class="fitted" d={fittedPath} />
      {/if}
    {/if}

    <!-- axes -->
    <text class="axis-label" x={PLOT.x + PLOT.w / 2} y={PLOT.y + PLOT.h + 36} text-anchor="middle">stake per trade</text>
    <text class="axis-label rotated" x={PLOT.x - 44} y={PLOT.y + PLOT.h / 2} text-anchor="middle">tax per round</text>
    <text class="tick" x={PLOT.x + cellW / 2} y={PLOT.y + PLOT.h + 16} text-anchor="middle">{percent(BETAS[0])}</text>
    <text class="tick" x={PLOT.x + PLOT.w - cellW / 2} y={PLOT.y + PLOT.h + 16} text-anchor="middle">{percent(BETAS[BETAS.length - 1])}</text>
    <text class="tick" x={PLOT.x - 8} y={PLOT.y + PLOT.h - cellH / 2 + 4} text-anchor="end">0%</text>
    <text class="tick" x={PLOT.x - 8} y={PLOT.y + cellH / 2 + 4} text-anchor="end">{percent(TAXES[TAXES.length - 1])}</text>

    <!-- legend -->
    <g class="legend" transform="translate(-60 0)">
      {#each RAMP as color, k}
        <rect x={PLOT.x + PLOT.w - RAMP.length * 16 + k * 16} y={PLOT.y + PLOT.h + 44} width="15" height="10" fill={color} />
      {/each}
      <text class="tick" x={PLOT.x + PLOT.w - RAMP.length * 16 - 8} y={PLOT.y + PLOT.h + 53} text-anchor="end">equal</text>
      <text class="tick" x={PLOT.x + PLOT.w + 4} y={PLOT.y + PLOT.h + 53} text-anchor="start">one owner</text>
    </g>
  </svg>

  <p class="caption" aria-live="polite">
    {#if !done}
      Running every room, live — same engine, {Math.round(progress * 100)}% of the map painted.
    {:else}
      Dark: the stake wins, the room condenses. Light: the levy wins. The pale line is measured — rooms that settle at
      Gini 0.5. The dashed one is a <em>fitted</em> curve, tax ≈ {fitted ? fitted.c.toFixed(2) : '…'} × stake² — steeper
      trading needs disproportionately more tax.
    {/if}
  </p>
</div>

<style>
  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .cell {
    transition: fill 0.3s ease;
  }

  .contour {
    stroke: var(--paper-bright);
    stroke-width: 2.4;
    stroke-linecap: round;
  }

  .fitted {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.8;
    stroke-dasharray: 6 5;
  }

  .axis-label {
    fill: var(--ink-soft);
    font-size: 12px;
  }

  .axis-label.rotated {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  .tick {
    fill: var(--ink-soft);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
  }
</style>
