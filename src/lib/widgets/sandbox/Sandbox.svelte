<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import BracketEqualizer from './BracketEqualizer.svelte';
  import { createTicker } from '../shared/ticker';
  import { measureWealth, lorenzCurve, type ProgressiveBracket } from '$lib/research';
  import { logBins, toDollars } from '../distribution/binning';
  import { lorenzGapPath, lorenzLinePath } from '../shared/lorenzPath';
  import { assignStyles } from '../shared/agentStyle';
  import { countTrades, dollarsCompact, percent } from '../shared/format';
  import { SandboxWorld, type TaxMode } from './SandboxWorld';
  import { DUST_DOLLARS } from '../shared/presets';

  const START_DOLLARS = 100;
  const HIST_H = 130;
  const LORENZ = { x: 30, y: 122, size: 100 };

  let n = $state(100);
  let stake = $state(0.2);
  let taxMode = $state<TaxMode>('off');
  let flatRate = $state(0.04);
  let interest = $state(0);
  let speed = $state(4);
  let look = $state<'shapes' | 'circles'>('shapes');
  let brackets: ProgressiveBracket[] = [];

  let world = $state(makeWorld(100));
  let styles = $state(assignStyles(100));

  // display-only, as ever: the look never touches the simulation
  const displayStyles = $derived(
    look === 'circles' ? styles.map((s) => ({ ...s, shape: 'circle' as const })) : styles,
  );
  let revision = $state(0);
  let running = $state(false);
  let gini = $state(0);
  let topShare = $state(0);

  let histCanvas: HTMLCanvasElement | undefined = $state();
  let histWidth = $state(0);
  let histBox: HTMLDivElement | undefined = $state();

  function makeWorld(count: number): SandboxWorld {
    const w = new SandboxWorld({ n: count, seed: Math.floor(Math.random() * 0xffff_ffff), startDollars: START_DOLLARS });
    w.taxEvery = count;
    w.interestEvery = count;
    return w;
  }

  function pushDials(): void {
    world.beta = stake;
    world.taxMode = taxMode;
    world.flatRate = flatRate;
    world.brackets = brackets;
    world.interestRate = interest;
  }

  function measure(): void {
    const m = measureWealth(world.wealth);
    gini = m.gini;
    topShare = m.topShare;
  }

  function drawHistogram(): void {
    const ctx = histCanvas?.getContext('2d');
    if (!ctx || !histCanvas || histWidth === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (histCanvas.width !== Math.round(histWidth * dpr)) {
      histCanvas.width = Math.round(histWidth * dpr);
      histCanvas.height = Math.round(HIST_H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, histWidth, HIST_H);

    const amounts = toDollars(world.wealth, world.totalDollars / n);
    const bins = logBins(amounts, DUST_DOLLARS);
    const baseline = HIST_H - 18;
    const slots = 1 + bins.counts.length;
    const slotW = histWidth / slots;
    const yMax = baseline - 8;
    const yOf = (count: number) => (yMax * Math.log10(count + 1)) / Math.log10(n + 1);

    const bar = (slot: number, count: number, label: string, dust: boolean) => {
      const x = slot * slotW + 3;
      const h = Math.max(count > 0 ? 1.5 : 0, yOf(count));
      ctx.fillStyle = dust ? 'rgb(110 85 62 / 38%)' : 'rgb(189 98 69 / 55%)';
      ctx.fillRect(x, baseline - h, slotW - 6, h);
      ctx.fillStyle = '#756c5d';
      ctx.font = '9px Vazirmatn, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (slotW - 6) / 2, baseline + 12);
    };
    bar(0, bins.dustCount, '≈0', true);
    bins.counts.forEach((count, b) => bar(b + 1, count, dollarsCompact(bins.edges[b]), false));
    ctx.strokeStyle = '#a99980';
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    ctx.lineTo(histWidth, baseline);
    ctx.stroke();
  }

  const lorenzPoints = $derived.by(() => {
    void revision;
    return lorenzCurve(world.wealth);
  });

  const ticker = createTicker(() => {
    pushDials();
    world.step(Math.max(1, Math.round((n / 3) * speed)));
    revision++;
    measure();
    drawHistogram();
  });

  function toggle(): void {
    if (running) {
      running = false;
      ticker.stop();
    } else {
      running = true;
      ticker.start();
    }
  }

  function setPopulation(count: number): void {
    n = count;
    reset();
  }

  function reset(): void {
    running = false;
    ticker.stop();
    world = makeWorld(n);
    styles = assignStyles(n);
    pushDials();
    revision++;
    measure();
    drawHistogram();
  }

  measure();

  const trades = $derived.by(() => {
    void revision;
    return world.trades;
  });

  const totalDollars = $derived.by(() => {
    void revision;
    return world.totalDollars;
  });

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      histWidth = entries[0].contentRect.width;
      drawHistogram();
    });
    if (histBox) observer.observe(histBox);
    return () => {
      observer.disconnect();
      ticker.stop();
    };
  });
</script>

<div class="widget sandbox" aria-label="The full sandbox: every dial of the toy economy in one room">
  <p class="kicker">The whole machine, yours</p>

  <div class="lab">
    <div class="stage-col">
      <RoomCanvas
        wealth={world.wealth}
        {revision}
        styles={displayStyles}
        height={300}
        label={`A sandbox room of ${n} agents trading under your rules`}
      />
    </div>
    <div class="charts-col">
      <div bind:this={histBox} class="hist">
        <canvas bind:this={histCanvas} style={`block-size: ${HIST_H}px`}></canvas>
      </div>
      <svg viewBox="0 0 160 140" class="lorenz" role="img" aria-label={`Lorenz curve, Gini ${gini.toFixed(2)}`}>
        <path class="gap" d={lorenzGapPath(lorenzPoints, LORENZ)} />
        <line class="equal" x1={LORENZ.x} y1={LORENZ.y} x2={LORENZ.x + LORENZ.size} y2={LORENZ.y - LORENZ.size} />
        <path class="curve" d={lorenzLinePath(lorenzPoints, LORENZ)} />
        <!-- top-left of the plot is always empty (the curve lives below the
             diagonal) — the number never collides with the curve there -->
        <text class="readout" x={LORENZ.x + 4} y={LORENZ.y - LORENZ.size + 12} text-anchor="start">Gini {gini.toFixed(2)}</text>
      </svg>
    </div>
  </div>

  <div class="stats">
    <output>{countTrades(trades)} trades</output>
    <output>room holds {dollarsCompact(totalDollars)}</output>
    <div class="meter" role="img" aria-label={`Biggest holder has ${percent(topShare)}`}>
      <div class="meter-fill" style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest: {percent(topShare)}</span>
    </div>
  </div>

  <!-- choices on top, all sliders together below (owner review 2026-07-08) -->
  <div class="choices">
    <fieldset>
      <legend>people</legend>
      {#each [25, 100, 400] as count}
        <button type="button" class:primary={n === count} aria-pressed={n === count} onclick={() => setPopulation(count)}>{count}</button>
      {/each}
    </fieldset>

    <fieldset>
      <legend>levy</legend>
      {#each [['off', 'none'], ['flat', 'flat'], ['progressive', 'progressive']] as [mode, label]}
        <button type="button" class:primary={taxMode === mode} aria-pressed={taxMode === mode} onclick={() => (taxMode = mode as TaxMode)}>{label}</button>
      {/each}
    </fieldset>

    <fieldset>
      <legend>speed</legend>
      {#each [1, 4, 16] as s}
        <button type="button" class:primary={speed === s} aria-pressed={speed === s} onclick={() => (speed = s)}>{s}×</button>
      {/each}
    </fieldset>

    <fieldset>
      <legend>look</legend>
      {#each ['shapes', 'circles'] as l}
        <button type="button" class:primary={look === l} aria-pressed={look === l} onclick={() => (look = l as typeof look)}>{l}</button>
      {/each}
    </fieldset>
  </div>

  <div class="sliders">
    <label class="dial">
      <span>stake <strong>{percent(stake)}</strong></span>
      <input type="range" min="0.01" max="0.5" step="0.01" bind:value={stake} />
    </label>

    <label class="dial">
      <span>interest <strong>{percent(interest, 1)}</strong>/round</span>
      <input type="range" min="0" max="0.05" step="0.005" bind:value={interest} />
    </label>

    {#if taxMode === 'flat'}
      <label class="dial">
        <span>flat rate <strong>{percent(flatRate)}</strong>/round</span>
        <input type="range" min="0" max="0.2" step="0.01" bind:value={flatRate} />
      </label>
    {/if}
  </div>

  {#if taxMode === 'progressive'}
    <BracketEqualizer avgDollars={totalDollars / n} onChange={(b) => (brackets = b)} />
  {/if}

  <div class="toolbar">
    <button class="primary" type="button" onclick={toggle}>{running ? 'Pause' : trades === 0 ? 'Run your room' : 'Keep going'}</button>
    <button type="button" onclick={reset} disabled={trades === 0}>New room</button>
  </div>

  <p class="caption">
    Every earlier beat is a preset of this machine. Turn the dials, watch the frontier from the map come alive — and
    remember: nothing in here cheats. It never had to.
  </p>
</div>

<style>
  .sandbox {
    max-inline-size: 60rem;
  }

  .lab {
    display: grid;
    grid-template-columns: 1fr minmax(11rem, 16rem);
    gap: 1rem;
    align-items: stretch;
  }

  @media (max-width: 44rem) {
    .lab {
      grid-template-columns: 1fr;
    }
  }

  .charts-col {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .hist canvas {
    display: block;
    inline-size: 100%;
  }

  .lorenz {
    inline-size: 100%;
    block-size: auto;
  }

  .lorenz .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
  }

  .lorenz .equal {
    stroke: var(--ink-mid);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .lorenz .gap {
    fill: var(--accent);
    fill-opacity: 0.12;
  }

  .lorenz .readout {
    fill: var(--accent-deep);
    font-size: 12px;
    font-weight: 700;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.2rem;
    margin-block-start: 0.7rem;
  }

  .stats output {
    font-variant-numeric: tabular-nums;
    font-size: 0.82rem;
    font-weight: 700;
    color: #3c352b;
  }

  .meter {
    position: relative;
    flex: 1;
    min-inline-size: 9rem;
    block-size: 1.4rem;
    border: 1px solid #cbbfa8;
    border-radius: 999px;
    background: var(--paper-bright);
    overflow: hidden;
  }

  .meter-fill {
    block-size: 100%;
    background: linear-gradient(90deg, rgb(189 98 69 / 35%), rgb(139 63 43 / 75%));
    transition: inline-size 0.2s linear;
  }

  .meter-label {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 0.8rem;
    transform: translateY(-50%);
    font-size: 0.7rem;
    font-weight: 700;
    color: #3c352b;
    white-space: nowrap;
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.8rem 1.4rem;
    margin-block-start: 0.9rem;
  }

  .sliders {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.5rem 1.4rem;
    max-inline-size: 42rem;
    margin-block-start: 0.7rem;
  }

  fieldset {
    display: flex;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    border: none;
  }

  legend {
    padding: 0;
    margin-block-end: 0.3rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  fieldset button {
    min-block-size: 2.1rem;
    padding-block: 0.3rem;
    padding-inline: 0.7rem;
    border: 1px solid #a99980;
    border-radius: 999px;
    background: var(--paper-bright);
    color: #3c352b;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 650;
  }

  fieldset button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper-bright);
  }

  .dial {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.7rem;
    color: var(--ink-mid);
    font-variant-numeric: tabular-nums;
  }

  .dial strong {
    font-weight: 700;
  }

  .dial input[type='range'] {
    inline-size: 100%;
    accent-color: var(--accent);
  }
</style>
