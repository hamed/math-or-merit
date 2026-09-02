<script lang="ts" module>
  import { GUIDED_OUTCOME_PROTOCOL } from '$lib/research';
  import { GINI_RAMP as RAMP } from '../shared/presets';

  /** Grid axes: stake (x) × flat levy rate per round (y). Calibrated so the
   * Gini spans ~0.05–0.98 and the 0.5 contour crosses every column
   * (scripts/phase-calibrate.ts, 2026-07-06). */
  const BETAS = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.05);
  const TAXES = Array.from({ length: 13 }, (_, i) => i * 0.01);
  const N = GUIDED_OUTCOME_PROTOCOL.n;
  const TRADES = GUIDED_OUTCOME_PROTOCOL.trades;
  const SEEDS = [11, 271];

  // Session cache: plays and the completed map survive scrolling away.
  let cachedGrid: number[][] | null = null;
  let cachedPlays: { ix: number; iy: number }[] | null = null;
  let cachedDone = false;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { contourSegments, fitSquareRelationship, IncrementalOutcomeRun, measureWealth } from '$lib/research';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createFixedTicker } from '../shared/ticker';
  import { assignStyles } from '../shared/agentStyle';
  import { countTrades, percent } from '../shared/format';
  import StopSlider from '../sandbox/StopSlider.svelte';
  import { addOutcome, loadPhaseData } from '../sandbox/phaseGrid.svelte';

  // Owner review 2026-07-08: the reader plays rooms with the two dials; each
  // finished room paints ITS cell of the map. "Fill in the rest" completes
  // the picture with the same engine. Plain pastel circles (tax chapter).
  const styles = assignStyles(N).map((s) => ({ ...s, shape: 'circle' as const }));

  const MAP_W = 250;
  const MAP_H = 262;
  const PLOT = { x: 40, y: 8, w: 200, h: 200 };
  const cellW = PLOT.w / BETAS.length;
  const cellH = PLOT.h / TAXES.length;

  // The dials are the finale's dials, stopped on this map's own grid: the
  // reader meets the control here that they will hold in the sandbox.
  let beta = $state(BETAS[3]); // 20%
  let taxRate = $state(TAXES[2]); // 2%
  const stakeIdx = $derived(BETAS.indexOf(beta));
  const taxIdx = $derived(TAXES.indexOf(taxRate));

  let grid = $state<number[][]>(cachedGrid ?? TAXES.map(() => BETAS.map(() => NaN)));
  let plays = $state<{ ix: number; iy: number }[]>(cachedPlays ?? []);
  let done = $state(cachedDone);
  let filling = $state(false);
  let fillProgress = $state(0);

  const seedsFor = (ix: number, iy: number) => SEEDS.map((seed) => seed + ix * 101 + iy * 13);

  function newWorld(b: number, tax: number, seed: number): IncrementalOutcomeRun {
    return new IncrementalOutcomeRun({
      ...GUIDED_OUTCOME_PROTOCOL,
      beta: b,
      taxRate: tax,
      seed,
    });
  }

  let world = $state(newWorld(BETAS[3], TAXES[2], seedsFor(3, 2)[0]));
  let revision = $state(0);
  let playing = $state(false);
  let liveGini = $state(0);
  let liveTrades = $state(0);
  let runIndex = $state(0);
  let ensembleSum = 0;
  let activeSeeds = seedsFor(3, 2);

  const TRADES_PER_FRAME = 1500; // ≈ 2.3 s per 200k-trade room at 60 fps

  const ticker = createFixedTicker(() => {
    world.step(TRADES_PER_FRAME);
    liveTrades = runIndex * TRADES + world.trades;
    revision++;
    liveGini = measureWealth(world.wealth).gini;
    if (world.done) {
      const outcome = world.result();
      ensembleSum += outcome.gini;
      addOutcome(GUIDED_OUTCOME_PROTOCOL, beta, taxRate, outcome);
      if (runIndex + 1 < activeSeeds.length) {
        runIndex++;
        world = newWorld(beta, taxRate, activeSeeds[runIndex]);
        revision++;
        return;
      }

      ticker.stop();
      playing = false;
      const g = ensembleSum / activeSeeds.length;
      const ix = stakeIdx;
      const iy = taxIdx;
      grid[iy][ix] = g;
      grid = grid.slice();
      if (!plays.some((p) => p.ix === ix && p.iy === iy)) plays.push({ ix, iy });
      cachedGrid = grid.map((r) => r.slice());
      cachedPlays = plays.map((p) => ({ ...p }));
    }
  });

  function playRoom(): void {
    if (playing || filling) return;
    activeSeeds = seedsFor(stakeIdx, taxIdx);
    runIndex = 0;
    ensembleSum = 0;
    world = newWorld(beta, taxRate, activeSeeds[0]);
    liveTrades = 0;
    liveGini = 0;
    revision++;
    playing = true;
    ticker.start();
  }

  function fillRest(): void {
    if (filling || done) return;
    filling = true;
    const cells: { ix: number; iy: number }[] = [];
    for (let iy = 0; iy < TAXES.length; iy++) {
      for (let ix = 0; ix < BETAS.length; ix++) {
        if (Number.isNaN(grid[iy][ix])) cells.push({ ix, iy });
      }
    }
    let next = 0;
    let seedIndex = 0;
    let cellSum = 0;
    let run: IncrementalOutcomeRun | null = null;
    const work = () => {
      const budget = performance.now() + 12;
      while (next < cells.length && performance.now() < budget) {
        const { ix, iy } = cells[next];
        const seeds = seedsFor(ix, iy);
        run ??= newWorld(BETAS[ix], TAXES[iy], seeds[seedIndex]);
        run.step(2_000);
        if (run.done) {
          const outcome = run.result();
          cellSum += outcome.gini;
          addOutcome(GUIDED_OUTCOME_PROTOCOL, BETAS[ix], TAXES[iy], outcome);
          seedIndex++;
          run = null;
        }
        if (seedIndex === seeds.length) {
          grid[iy][ix] = cellSum / seeds.length;
          cellSum = 0;
          seedIndex = 0;
          next++;
        }
      }
      grid = grid.slice();
      fillProgress = cells.length === 0 ? 1 : (next + seedIndex / SEEDS.length) / cells.length;
      if (next < cells.length) {
        fillFrame = requestAnimationFrame(work);
      } else {
        filling = false;
        done = true;
        cachedGrid = grid.map((row) => row.slice());
        cachedDone = true;
      }
    };
    fillFrame = requestAnimationFrame(work);
  }

  const finished = $derived(done ? grid : null);
  const contour = $derived.by(() => (finished ? contourSegments(finished, BETAS, TAXES, 0.5) : []));
  const fitted = $derived.by(() =>
    finished ? fitSquareRelationship(finished, BETAS, TAXES, 0.5, 'decreases') : null,
  );

  const xOf = (b: number) =>
    PLOT.x + ((b - BETAS[0]) / (BETAS[BETAS.length - 1] - BETAS[0])) * (PLOT.w - cellW) + cellW / 2;
  const yOf = (t: number) =>
    PLOT.y + PLOT.h - (((t - TAXES[0]) / (TAXES[TAXES.length - 1] - TAXES[0])) * (PLOT.h - cellH) + cellH / 2);

  const fittedPath = $derived.by(() => {
    if (!fitted) return '';
    const pts: string[] = [];
    for (let b = BETAS[0]; b <= BETAS[BETAS.length - 1] + 1e-9; b += 0.01) {
      const t = fitted.c * b * b;
      if (t > TAXES[TAXES.length - 1]) break;
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${xOf(b).toFixed(1)} ${yOf(t).toFixed(1)}`);
    }
    return pts.join(' ');
  });

  function colorOf(gini: number): string {
    return RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(gini * RAMP.length)))];
  }

  let fillFrame = 0;
  onMount(() => {
    loadPhaseData();
    return () => {
      ticker.stop();
      cancelAnimationFrame(fillFrame);
    };
  });
</script>

<div class="widget" aria-label="Play rooms with a stake and a levy dial; each finite run paints its measured outcome on the map">
  <p class="kicker">Both rules, one map</p>

  <div class="duo">
    <div class="room-side">
      <RoomCanvas
        wealth={world.wealth}
        {revision}
        {styles}
        height={252}
        label={`A room trading at a ${percent(beta)} stake with a ${percent(taxRate, 1)} levy every round`}
      />
      <div class="meters">
        <output>{countTrades(liveTrades)} trades</output>
        <div class="meter" role="img" aria-label={`Gini ${liveGini.toFixed(2)}`}>
          <div class="meter-fill" style={`inline-size: ${Math.min(100, liveGini * 100)}%`}></div>
          <span class="meter-label">Gini: {liveGini.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <svg
      class="map"
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      role="img"
      aria-label="Outcome map: stake across, levy up; each played cell colored by its finite-run Gini"
    >
      {#each TAXES as tax, iy}
        {#each BETAS as b, ix}
          {@const g = grid[iy][ix]}
          <rect
            class="cell"
            x={PLOT.x + ix * cellW}
            y={PLOT.y + PLOT.h - (iy + 1) * cellH}
            width={cellW - 1}
            height={cellH - 1}
            fill={Number.isNaN(g) ? 'rgb(60 53 43 / 6%)' : colorOf(g)}
          >
            <title>stake {percent(b)} · tax {percent(tax, 1)} per round → Gini {Number.isNaN(g) ? 'not run yet' : g.toFixed(2)}</title>
          </rect>
        {/each}
      {/each}

      <!-- rooms the reader ran personally -->
      {#each plays as p (p.ix + '-' + p.iy)}
        <rect
          class="played"
          x={PLOT.x + p.ix * cellW + 1}
          y={PLOT.y + PLOT.h - (p.iy + 1) * cellH + 1}
          width={cellW - 3}
          height={cellH - 3}
        />
      {/each}

      <!-- where the dials point right now -->
      <rect
        class="cursor"
        x={PLOT.x + stakeIdx * cellW}
        y={PLOT.y + PLOT.h - (taxIdx + 1) * cellH}
        width={cellW - 1}
        height={cellH - 1}
      />

      {#if done}
        {#each contour as seg}
          <line class="contour" x1={xOf(seg.x1)} y1={yOf(seg.y1)} x2={xOf(seg.x2)} y2={yOf(seg.y2)} />
        {/each}
        {#if fittedPath}
          <path class="fitted" d={fittedPath} />
        {/if}
      {/if}

      <text class="axis-label" x={PLOT.x + PLOT.w / 2} y={PLOT.y + PLOT.h + 28} text-anchor="middle">stake per trade</text>
      <text class="axis-label rotated" x={PLOT.x - 28} y={PLOT.y + PLOT.h / 2} text-anchor="middle">tax per round</text>
      <text class="tick" x={PLOT.x + cellW / 2} y={PLOT.y + PLOT.h + 13} text-anchor="middle">{percent(BETAS[0])}</text>
      <text class="tick" x={PLOT.x + PLOT.w - cellW / 2} y={PLOT.y + PLOT.h + 13} text-anchor="middle">{percent(BETAS[BETAS.length - 1])}</text>
      <text class="tick" x={PLOT.x - 5} y={PLOT.y + PLOT.h - cellH / 2 + 3} text-anchor="end">0%</text>
      <text class="tick" x={PLOT.x - 5} y={PLOT.y + cellH / 2 + 3} text-anchor="end">{percent(TAXES[TAXES.length - 1])}</text>

      <g class="legend">
        {#each RAMP as color, k}
          <rect x={PLOT.x + k * 14} y={PLOT.y + PLOT.h + 36} width="13" height="8" fill={color} />
        {/each}
        <text class="tick" x={PLOT.x} y={PLOT.y + PLOT.h + 54} text-anchor="start">equal</text>
        <text class="tick" x={PLOT.x + RAMP.length * 14} y={PLOT.y + PLOT.h + 54} text-anchor="end">one owner</text>
      </g>
    </svg>
  </div>

  <div class="dials">
    <StopSlider label="stake" bind:value={beta} stops={BETAS} format={(v) => percent(v)} disabled={playing} />
    <StopSlider label="tax /round" bind:value={taxRate} stops={TAXES} format={(v) => percent(v, 1)} disabled={playing} />
  </div>

  <p class="caption" aria-live="polite">
    {#if filling}
      Running every remaining room, live — {Math.round(fillProgress * 100)}% of the map painted.
    {:else if done}
      Dark: higher finite-run Gini. Light: lower finite-run Gini. The pale line marks the chosen Gini 0.5 outcome — it is
      not a phase boundary. The dashed curve is <em>fitted</em>: levy ≈ {fitted ? fitted.c.toFixed(2) : '…'} × stake².
    {:else if playing}
      Run {runIndex + 1} of {SEEDS.length} is trading your dials — {percent(beta)} stake against a {percent(taxRate, 1)} levy.
    {:else if plays.length === 0}
      Every point is one fixed-length experiment: stake across, levy up. Pick your dials, run the room, and its measured
      outcome paints that square.
    {:else}
      {plays.length} {plays.length === 1 ? 'room' : 'rooms'} run and painted. Try dials on the other side of the map —
      or fill in the rest.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={playRoom} disabled={playing || filling}>
      {playing ? 'Trading…' : 'Run this room'}
    </button>
    {#if plays.length >= 3 && !done}
      <button type="button" onclick={fillRest} disabled={filling || playing}>Fill in the rest of the map</button>
    {/if}
  </div>
</div>

<style>
  .duo {
    display: grid;
    grid-template-columns: 1fr minmax(13rem, 17rem);
    gap: 1.2rem;
    align-items: start;
  }

  @media (max-width: 40rem) {
    .duo {
      grid-template-columns: 1fr;
    }
  }

  .map {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .cell {
    transition: fill 0.3s ease;
  }

  .played {
    fill: none;
    stroke: var(--paper-bright);
    stroke-width: 1.6;
  }

  .cursor {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.4;
    stroke-dasharray: 3 2.4;
  }

  .contour {
    stroke: var(--paper-bright);
    stroke-width: 2.2;
    stroke-linecap: round;
  }

  .fitted {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6;
    stroke-dasharray: 6 5;
  }

  .axis-label {
    fill: var(--ink-soft);
    font-size: 10.5px;
  }

  .axis-label.rotated {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  .tick {
    fill: var(--ink-soft);
    font-size: 9.5px;
    font-variant-numeric: tabular-nums;
  }

  .dials {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
    margin-block-start: 0.9rem;
    font-size: 0.85rem;
    color: #3c352b;
  }

  @media (max-width: 40rem) {
    .dials {
      grid-template-columns: 1fr;
      gap: 0.6rem;
    }
  }

  .meters {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-block-start: 0.6rem;
  }

  .meters output {
    min-inline-size: 8.5rem;
    font-variant-numeric: tabular-nums;
    font-size: 0.82rem;
    font-weight: 700;
    color: #3c352b;
  }

  /* the pill itself lives in app.css; the map's is a touch shorter */
  .meter {
    --meter-bg: var(--paper-bright);
    --meter-size: 1.4rem;
    --meter-label-size: 0.7rem;
  }

</style>
