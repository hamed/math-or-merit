<script lang="ts">
  import { onMount } from 'svelte';
  import { createEngine } from '$lib/sim';
  import { measureWealth } from '$lib/research';
  import LorenzMini from '../shared/LorenzMini.svelte';
  import { createTicker } from '../shared/ticker';
  import { countTrades, dollars, dollarsCompact, percent } from '../shared/format';
  import { logBins, toDollars } from '../distribution/binning';
  import { CROWD_BETA, CROWD_N, CROWD_SEED, CROWD_START_DOLLARS, CROWD_TRADES, DUST_DOLLARS } from '../shared/presets';

  const DURATION_MS = 7000;
  const HEIGHT = 300;

  const engine = createEngine({ n: CROWD_N, beta: CROWD_BETA, seed: CROWD_SEED });

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let width = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let trades = $state(0);
  let revision = $state(0);
  let dustCount = $state(0);
  let topDollars = $state(CROWD_START_DOLLARS);
  let topShare = $state(1 / CROWD_N);
  let gini = $state(0);
  let elapsed = 0;

  function measureAndDraw(): void {
    const amounts = toDollars(engine.state.wealth, CROWD_START_DOLLARS);
    const bins = logBins(amounts, DUST_DOLLARS);
    dustCount = bins.dustCount;
    let max = 0;
    for (let i = 0; i < amounts.length; i++) max = Math.max(max, amounts[i]);
    topDollars = max;
    const metrics = measureWealth(engine.state.wealth);
    topShare = metrics.topShare;
    gini = metrics.gini;

    const ctx = canvas?.getContext('2d');
    if (!ctx || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);

    const baseline = HEIGHT - 44;
    const plotX = 14;
    const plotW = width - 2 * plotX;
    const slots = 1 + bins.counts.length; // dust pile + decades
    const slotW = plotW / slots;
    // log-y (storyboard p8): the 800-strong dust wall must not crush the tail
    const yMax = baseline - 26;
    const yOf = (count: number) => (yMax * Math.log10(count + 1)) / Math.log10(CROWD_N + 1);

    const drawBar = (slot: number, count: number, label: string, dust: boolean) => {
      const x = plotX + slot * slotW + 5;
      const h = Math.max(count > 0 ? 2 : 0, yOf(count));
      ctx.fillStyle = dust ? 'rgb(110 85 62 / 38%)' : 'rgb(189 98 69 / 55%)';
      ctx.strokeStyle = dust ? '#8a7a64' : '#96543c';
      if (dust) ctx.setLineDash([5, 4]);
      ctx.fillRect(x, baseline - h, slotW - 10, h);
      if (h > 0) ctx.strokeRect(x, baseline - h, slotW - 10, h);
      ctx.setLineDash([]);
      ctx.fillStyle = '#756c5d';
      ctx.font = '11px Vazirmatn, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (slotW - 10) / 2, baseline + 16);
      if (count > 0) {
        ctx.fillStyle = '#5c5344';
        ctx.fillText(String(count), x + (slotW - 10) / 2, baseline - h - 6);
      }
    };

    drawBar(0, bins.dustCount, '≈ 0', true);
    for (let b = 0; b < bins.counts.length; b++) {
      drawBar(b + 1, bins.counts[b], dollarsCompact(bins.edges[b]), false);
    }

    ctx.strokeStyle = '#a99980';
    ctx.beginPath();
    ctx.moveTo(plotX, baseline);
    ctx.lineTo(plotX + plotW, baseline);
    ctx.stroke();
    ctx.fillStyle = '#8b3f2b';
    ctx.font = 'italic 11px Vazirmatn, system-ui, sans-serif';
    ctx.fillText('ten times the money per step — and bar height is stepped too, so the tail stays visible', plotX + plotW / 2, baseline + 34);
  }

  const ticker = createTicker((dt) => {
    elapsed += dt;
    const progress = Math.min(1, elapsed / DURATION_MS);
    const target = Math.round(progress * CROWD_TRADES);
    const step = target - engine.state.step;
    if (step > 0) engine.step(step);
    trades = engine.state.step;
    revision++;
    measureAndDraw();
    if (progress >= 1) {
      ticker.stop();
      running = false;
      finished = true;
    }
  });

  function run(): void {
    if (running) return;
    if (finished) engine.reset();
    elapsed = 0;
    finished = false;
    running = true;
    ticker.start();
  }

  function reset(): void {
    ticker.stop();
    running = false;
    finished = false;
    elapsed = 0;
    engine.reset();
    trades = 0;
    revision++;
    measureAndDraw();
  }

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      width = entries[0].contentRect.width;
      measureAndDraw();
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      ticker.stop();
    };
  });
</script>

<div class="widget" aria-label="A thousand traders, two million trades, on the multiplying ruler">
  <p class="kicker">A thousand of them this time</p>

  <div class="duo">
    <div bind:this={container} class="plot" role="img" aria-label={`Log-scale histogram of a thousand traders: ${dustCount} below one cent, richest at ${dollars(topDollars)}`}>
      <canvas bind:this={canvas} style={`block-size: ${HEIGHT}px`}></canvas>
    </div>
    <aside class="sidebar" aria-label="The same crowd as a Lorenz curve">
      <LorenzMini wealth={engine.state.wealth} {revision} label="Lorenz curve of the crowd" />
    </aside>
  </div>

  <div class="meters" aria-live="off">
    <div class="meter" role="img" aria-label={`Richest person holds ${percent(topShare)} of everything; Gini ${gini.toFixed(2)}`}>
      <div class="meter-fill" style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">richest holds {percent(topShare)}</span>
    </div>
  </div>

  <p class="caption" aria-live="polite">
    {#if trades === 0}
      One thousand people, $10,000 each, $10 million in the room. Same rule, same fair coin.
    {:else}
      {countTrades(trades)} trades · {dustCount} of 1,000 below one cent · the richest holds {dollars(topDollars)}.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={run} disabled={running}>
      {running ? 'Trading…' : finished ? 'Run it again' : 'Trade two million times'}
    </button>
    <button type="button" onclick={reset} disabled={trades === 0}>Back to the start</button>
  </div>
</div>

<style>
  .duo {
    display: grid;
    grid-template-columns: 1fr 10rem;
    gap: 1rem;
    align-items: end;
  }

  .sidebar {
    padding-block-end: 2.2rem;
  }

  @media (max-width: 40rem) {
    .duo {
      grid-template-columns: 1fr;
    }

    .sidebar {
      max-inline-size: 11rem;
      padding-block-end: 0;
    }
  }

  .plot {
    inline-size: 100%;
  }

  canvas {
    display: block;
    inline-size: 100%;
  }

  .meters {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-block-start: 0.6rem;
  }

  /* the pill itself lives in app.css; this one sits on brighter paper */
  .meter {
    --meter-bg: var(--paper-bright);
  }

</style>
