<script lang="ts" module>
  import { GUIDED_OUTCOME_PROTOCOL } from '$lib/research';
  import { GINI_RAMP as RAMP } from '../shared/presets';

  /** Grid axes: stake (x) × flat levy rate per round (y). Calibrated so the
   * chosen 50-effective-participant line crosses every column. This is a
   * reader challenge target, not a natural boundary. */
  const BETAS = Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.05);
  const TAXES = Array.from({ length: 15 }, (_, i) => i * 0.01);
  const N = GUIDED_OUTCOME_PROTOCOL.n;
  const TRADES = GUIDED_OUTCOME_PROTOCOL.trades;
  const PARTICIPATION_TARGET = N / 2;
  const FILL_RUNS_PER_CELL = 4;
  const EXAMPLE_STAKE = 0.2;

  // Session cache: measured cells survive scrolling away.
  let cachedGrid: number[][] | null = null;
  let cachedCounts: number[][] | null = null;
  let cachedReaderRuns = 0;
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
  import { addOutcome, loadPhaseData, metricPointsFor } from '../sandbox/phaseGrid.svelte';
  import { hasMinimumRuns, runsToMinimum } from './outcomeMap';

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

  const cacheFitsGrid = cachedGrid?.length === TAXES.length
    && cachedGrid.every((row) => row.length === BETAS.length)
    && cachedCounts?.length === TAXES.length
    && cachedCounts.every((row) => row.length === BETAS.length);
  let grid = $state<number[][]>(cacheFitsGrid && cachedGrid ? cachedGrid : TAXES.map(() => BETAS.map(() => NaN)));
  let counts = $state<number[][]>(cacheFitsGrid && cachedCounts ? cachedCounts : TAXES.map(() => BETAS.map(() => 0)));
  let readerRuns = $state(cachedReaderRuns);
  let lastPlayed = $state<{ ix: number; iy: number; nonce: number } | null>(null);
  let done = $state(cachedDone);
  let filling = $state(false);
  let fillProgress = $state(0);

  const freshSeed = () => Math.floor(Math.random() * 0x1_0000_0000);

  function newWorld(b: number, tax: number, seed: number): IncrementalOutcomeRun {
    return new IncrementalOutcomeRun({
      ...GUIDED_OUTCOME_PROTOCOL,
      beta: b,
      taxRate: tax,
      seed,
    });
  }

  let world = $state(newWorld(BETAS[3], TAXES[2], freshSeed()));
  let revision = $state(0);
  let playing = $state(false);
  let liveEffective = $state(N);
  let liveTrades = $state(0);

  const TRADES_PER_FRAME = 1500; // ≈ 2.3 s per 200k-trade room at 60 fps

  function recordOutcome(ix: number, iy: number, value: number): void {
    const count = counts[iy][ix];
    grid[iy][ix] = count === 0 ? value : (grid[iy][ix] * count + value) / (count + 1);
    counts[iy][ix] = count + 1;
  }

  function cacheGrid(): void {
    cachedGrid = grid.map((row) => row.slice());
    cachedCounts = counts.map((row) => row.slice());
  }

  function restoreStoredOutcomes(): void {
    for (const point of metricPointsFor(N, 'effectiveParticipants', GUIDED_OUTCOME_PROTOCOL)) {
      const ix = BETAS.findIndex((value) => Math.abs(value - point.stake) < 1e-9);
      const iy = TAXES.findIndex((value) => Math.abs(value - point.tax) < 1e-9);
      if (ix < 0 || iy < 0 || counts[iy][ix] > 0) continue;
      grid[iy][ix] = point.value;
      counts[iy][ix] = point.count;
    }
    done = hasMinimumRuns(counts, FILL_RUNS_PER_CELL);
    cachedDone = done;
    grid = grid.slice();
    counts = counts.slice();
    cacheGrid();
  }

  const ticker = createFixedTicker(() => {
    world.step(TRADES_PER_FRAME);
    liveTrades = world.trades;
    revision++;
    liveEffective = measureWealth(world.wealth).effectiveParticipants;
    if (world.done) {
      const outcome = world.result();
      addOutcome(GUIDED_OUTCOME_PROTOCOL, beta, taxRate, outcome);
      ticker.stop();
      playing = false;
      const ix = stakeIdx;
      const iy = taxIdx;
      recordOutcome(ix, iy, outcome.effectiveParticipants);
      grid = grid.slice();
      counts = counts.slice();
      readerRuns++;
      cachedReaderRuns = readerRuns;
      lastPlayed = { ix, iy, nonce: (lastPlayed?.nonce ?? 0) + 1 };
      cacheGrid();
    }
  });

  function playRoom(): void {
    if (playing || filling) return;
    world = newWorld(beta, taxRate, freshSeed());
    liveTrades = 0;
    liveEffective = N;
    revision++;
    playing = true;
    ticker.start();
  }

  function fillRest(): void {
    if (filling || done) return;
    filling = true;
    const runs = runsToMinimum(counts, FILL_RUNS_PER_CELL);
    let next = 0;
    let run: IncrementalOutcomeRun | null = null;
    const work = () => {
      const budget = performance.now() + 12;
      while (next < runs.length && performance.now() < budget) {
        const { ix, iy } = runs[next];
        run ??= newWorld(BETAS[ix], TAXES[iy], freshSeed());
        run.step(2_000);
        if (run.done) {
          const outcome = run.result();
          recordOutcome(ix, iy, outcome.effectiveParticipants);
          addOutcome(GUIDED_OUTCOME_PROTOCOL, BETAS[ix], TAXES[iy], outcome);
          run = null;
          next++;
        }
      }
      grid = grid.slice();
      counts = counts.slice();
      fillProgress = runs.length === 0 ? 1 : next / runs.length;
      if (next < runs.length) {
        fillFrame = requestAnimationFrame(work);
      } else {
        filling = false;
        done = true;
        cachedDone = true;
        cacheGrid();
      }
    };
    fillFrame = requestAnimationFrame(work);
  }

  const finished = $derived(done ? grid : null);
  const contour = $derived.by(() => (
    finished ? contourSegments(finished, BETAS, TAXES, PARTICIPATION_TARGET) : []
  ));
  const fitted = $derived.by(() =>
    finished
      ? fitSquareRelationship(finished, BETAS, TAXES, PARTICIPATION_TARGET, 'increases')
      : null,
  );
  const exampleTax = $derived(fitted ? fitted.c * EXAMPLE_STAKE * EXAMPLE_STAKE : null);

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

  function colorOf(effectiveParticipants: number): string {
    const concentration = 1 - (effectiveParticipants - 1) / (N - 1);
    return RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(concentration * RAMP.length)))];
  }

  let fillFrame = 0;
  onMount(() => {
    loadPhaseData();
    restoreStoredOutcomes();
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
        <div class="meter" role="img" aria-label={`${liveEffective.toFixed(1)} effective participants out of ${N}`}>
          <div class="meter-fill participation" style={`inline-size: ${Math.min(100, liveEffective)}%`}></div>
          <span class="meter-label">effective participants: {liveEffective.toFixed(1)}</span>
        </div>
      </div>
    </div>

    <svg
      class="map"
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      role="img"
      aria-label="Outcome map: stake across, levy up; each cell colored by its finite-run effective participants"
    >
      {#each TAXES as tax, iy}
        {#each BETAS as b, ix}
          {@const effective = grid[iy][ix]}
          <rect
            class="cell"
            x={PLOT.x + ix * cellW}
            y={PLOT.y + PLOT.h - (iy + 1) * cellH}
            width={cellW - 1}
            height={cellH - 1}
            fill={Number.isNaN(effective) ? 'rgb(60 53 43 / 6%)' : colorOf(effective)}
          >
            <title>stake {percent(b)} · levy {percent(tax, 1)} per round → effective participants {Number.isNaN(effective) ? 'not run yet' : `${effective.toFixed(1)} (${counts[iy][ix]} independent ${counts[iy][ix] === 1 ? 'run' : 'runs'})`}</title>
          </rect>
        {/each}
      {/each}

      <!-- A reader run pulses once into the aggregate; it is not a permanent second layer. -->
      {#if lastPlayed}
        {#key lastPlayed.nonce}
          <rect
            class="played"
            x={PLOT.x + lastPlayed.ix * cellW + 1}
            y={PLOT.y + PLOT.h - (lastPlayed.iy + 1) * cellH + 1}
            width={cellW - 3}
            height={cellH - 3}
          />
        {/key}
      {/if}

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
      <text class="axis-label rotated" x={PLOT.x - 28} y={PLOT.y + PLOT.h / 2} text-anchor="middle">levy per round</text>
      <text class="tick" x={PLOT.x + cellW / 2} y={PLOT.y + PLOT.h + 13} text-anchor="middle">{percent(BETAS[0])}</text>
      <text class="tick" x={PLOT.x + PLOT.w - cellW / 2} y={PLOT.y + PLOT.h + 13} text-anchor="middle">{percent(BETAS[BETAS.length - 1])}</text>
      <text class="tick" x={PLOT.x - 5} y={PLOT.y + PLOT.h - cellH / 2 + 3} text-anchor="end">0%</text>
      <text class="tick" x={PLOT.x - 5} y={PLOT.y + cellH / 2 + 3} text-anchor="end">{percent(TAXES[TAXES.length - 1])}</text>

      <g class="legend">
        {#each RAMP as color, k}
          <rect x={PLOT.x + k * 14} y={PLOT.y + PLOT.h + 36} width="13" height="8" fill={color} />
        {/each}
        <text class="tick" x={PLOT.x} y={PLOT.y + PLOT.h + 54} text-anchor="start">100 equal</text>
        <text class="tick" x={PLOT.x + RAMP.length * 14} y={PLOT.y + PLOT.h + 54} text-anchor="end">one owner</text>
      </g>
    </svg>
  </div>

  <div class="dials">
    <StopSlider label="stake" bind:value={beta} stops={BETAS} format={(v) => percent(v)} disabled={playing} />
    <StopSlider label="levy / round" bind:value={taxRate} stops={TAXES} format={(v) => percent(v, 1)} disabled={playing} />
  </div>

  <p class="caption" aria-live="polite">
    {#if filling}
      Bringing every square to at least {FILL_RUNS_PER_CELL} independent rooms — {Math.round(fillProgress * 100)}% complete.
    {:else if done}
      Light: broader participation. Dark: fewer effective participants. The pale line is my chosen challenge — 50 of
      100 — not a phase boundary. The dashed curve is <em>fitted</em>: levy ≈ {fitted ? fitted.c.toFixed(2) : '…'} × stake².
    {:else if playing}
      One fresh room is trading your dials — {percent(beta)} stake against a {percent(taxRate, 1)} levy per round.
    {:else if readerRuns === 0}
      Every square is a fixed-length finite experiment: stake across, levy up. Pick your dials, run one fresh room, and
      its effective-participant result enters that square.
    {:else}
      {readerRuns} independent {readerRuns === 1 ? 'run' : 'runs'} added. Try another part of the map — or fill in the rest.
    {/if}
  </p>

  {#if done && fitted && exampleTax !== null}
    <p class="finding">
      Read the 20% stake column. On the fitted 50-participant line, the levy lands near
      <strong>{percent(exampleTax, 1)} per round</strong>. The levy number is much smaller than the stake.
      Different clocks, one measured balance: levy against stake².
    </p>
  {/if}

  <div class="toolbar">
    <button class="primary" type="button" onclick={playRoom} disabled={playing || filling}>
      {playing ? 'Trading…' : 'Run this room'}
    </button>
    {#if readerRuns >= 3 && !done}
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
    pointer-events: none;
    animation: absorb-run 1.4s ease-out forwards;
  }

  @keyframes absorb-run {
    0% {
      opacity: 1;
      stroke-width: 3.5;
    }

    100% {
      opacity: 0;
      stroke-width: 0.5;
    }
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

  .meter-fill.participation {
    background: linear-gradient(90deg, rgb(233 201 106 / 65%), rgb(89 152 91 / 75%));
  }

  .finding {
    max-inline-size: 38rem;
    margin-block: 0.9rem 0;
    padding-block: 0.8rem;
    padding-inline: 1rem;
    border-inline-start: 3px solid var(--accent);
    color: var(--ink-soft);
    background: rgb(255 252 245 / 58%);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .finding strong {
    color: var(--accent-deep);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .played {
      opacity: 0;
      animation: none;
    }
  }

</style>
