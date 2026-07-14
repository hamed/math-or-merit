<script lang="ts">
  import { onMount } from 'svelte';
  import { dollarsCompact, dollarsPow10 } from '../shared/format';
  import { geometricBins, rangedLinearBins, StickyRange } from './histBins';
  import { gatedClick } from './gatedClick';

  interface Props {
    wealth: Float64Array;
    totalDollars: number;
    n: number;
    revision?: number;
    /** Dollars per head at the start — pins the initial axis range. */
    startDollars: number;
  }

  let { wealth, totalDollars, n, revision = 0, startDollars }: Props = $props();

  // canonical form first (owner review 2026-07-14): log-log
  let xLog = $state(true);
  let yLog = $state(true);
  // bin-count cycles, exactly as reviewed
  const LOG_BIN_CYCLE = [10, 4, 2, 32, 16];
  const LIN_BIN_CYCLE = [16, 32, 64, 8];
  let logBinIdx = $state(0);
  let linBinIdx = $state(0);

  let box: HTMLDivElement | undefined = $state();
  let canvas: HTMLCanvasElement | undefined = $state();
  let side = $state(0);

  // log x: $1 … one order above the starting money, so the initial spike sits
  // among visibly empty neighbors; linear x: 0 … double the starting money.
  const logRange = $derived.by(() => new StickyRange(1, 10 * startDollars));
  const linRange = $derived.by(() => new StickyRange(0, 2 * startDollars));

  // gutters (device-independent px inside the square)
  const GUTTER = 30;
  const BOTTOM = 26;

  function draw(): void {
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || side === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(side * dpr)) {
      canvas.width = Math.round(side * dpr);
      canvas.height = Math.round(side * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, side, side);

    const amounts = new Float64Array(n);
    let minPos = Infinity;
    let maxV = 0;
    for (let i = 0; i < n; i++) {
      const d = wealth[i] * totalDollars;
      amounts[i] = d;
      if (d > 0 && d < minPos) minPos = d;
      if (d > maxV) maxV = d;
    }
    if (!Number.isFinite(minPos)) minPos = 1;

    const now = performance.now();
    let bins;
    if (xLog) {
      const { lo, hi } = logRange.update(Math.max(1e-9, minPos), Math.max(maxV, 2), now);
      bins = geometricBins(amounts, lo, hi, LOG_BIN_CYCLE[logBinIdx]);
    } else {
      const { hi } = linRange.update(0, maxV, now);
      bins = rangedLinearBins(amounts, hi, LIN_BIN_CYCLE[linBinIdx]);
    }

    const baseline = side - BOTTOM;
    const plotW = side - GUTTER - 2;
    const yMax = baseline - Math.max(14, side * 0.1); // headroom for the axis title
    const slotW = plotW / bins.counts.length;
    const yOf = (count: number) =>
      yLog ? (yMax * Math.log10(count + 1)) / Math.log10(n + 1) : (yMax * count) / n;

    // y ticks + faint grid
    ctx.font = '8.5px Vazirmatn, system-ui, sans-serif';
    const ticks = yLog ? [1, 10, 100, 1000].filter((t) => t <= n) : [Math.round(n / 2), n];
    for (const tick of ticks) {
      const y = baseline - yOf(tick);
      ctx.strokeStyle = 'rgb(169 153 128 / 40%)';
      ctx.beginPath();
      ctx.moveTo(GUTTER, y);
      ctx.lineTo(side, y);
      ctx.stroke();
      ctx.fillStyle = '#756c5d';
      ctx.textAlign = 'end';
      ctx.fillText(String(tick), GUTTER - 3, y + 3);
    }

    for (let b = 0; b < bins.counts.length; b++) {
      const x = GUTTER + b * slotW + 1;
      const h = Math.max(bins.counts[b] > 0 ? 1.5 : 0, yOf(bins.counts[b]));
      ctx.fillStyle = 'rgb(189 98 69 / 55%)';
      ctx.fillRect(x, baseline - h, Math.max(1, slotW - 2), h);
    }

    // x ticks at round values, independent of bin edges — range and scale
    ctx.fillStyle = '#756c5d';
    const lo = bins.edges[0];
    const hi = bins.edges[bins.edges.length - 1];
    if (xLog) {
      const eLo = Math.ceil(Math.log10(lo) - 1e-9);
      const eHi = Math.floor(Math.log10(hi) + 1e-9);
      const step = Math.max(1, Math.ceil((eHi - eLo) / 3));
      for (let e = eLo; e <= eHi; e += step) {
        const x = GUTTER + ((e - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * plotW;
        // labels near the edges anchor inward so nothing clips
        ctx.textAlign = x < GUTTER + 12 ? 'start' : x > side - 14 ? 'end' : 'center';
        ctx.fillText(dollarsPow10(10 ** e), x, baseline + 11);
      }
    } else {
      for (const [k, v] of [0, hi / 2, hi].entries()) {
        ctx.textAlign = k === 0 ? 'start' : k === 2 ? 'end' : 'center';
        ctx.fillText(dollarsCompact(v), GUTTER + (v / hi) * plotW, baseline + 11);
      }
    }

    // axes
    ctx.strokeStyle = '#a99980';
    ctx.beginPath();
    ctx.moveTo(GUTTER, baseline);
    ctx.lineTo(side, baseline);
    ctx.moveTo(GUTTER, baseline);
    ctx.lineTo(GUTTER, baseline - yMax);
    ctx.stroke();

    ctx.fillStyle = '#756c5d';
    ctx.textAlign = 'start';
    ctx.fillText(`people${yLog ? ' (log)' : ''}`, GUTTER + 3, 9);
    ctx.textAlign = 'end';
    ctx.fillText(`wealth ($${xLog ? ', log' : ''})`, side - 2, side - 3);
    if (bins.underCount > 0) {
      ctx.textAlign = 'start';
      ctx.fillText(`${bins.underCount} at ≈0, off scale`, GUTTER + 3, baseline - yMax + 11);
    }
  }

  // convention (owner review 2026-07-14): a click on an axis toggles that
  // axis log ↔ linear; a click on the plot body cycles the bin count.
  const handleClick = gatedClick((event: MouseEvent) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < GUTTER) {
      yLog = !yLog;
    } else if (y > side - BOTTOM) {
      xLog = !xLog;
    } else if (xLog) {
      logBinIdx = (logBinIdx + 1) % LOG_BIN_CYCLE.length;
    } else {
      linBinIdx = (linBinIdx + 1) % LIN_BIN_CYCLE.length;
    }
    draw();
  });

  $effect(() => {
    void revision;
    void xLog;
    void yLog;
    void logBinIdx;
    void linBinIdx;
    void side;
    draw();
  });

  onMount(() => {
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      side = Math.max(0, Math.floor(Math.min(r.width, r.height)));
    });
    if (box) observer.observe(box);
    return () => observer.disconnect();
  });
</script>

<div bind:this={box} class="box">
  <canvas
    bind:this={canvas}
    style={`inline-size: ${side}px; block-size: ${side}px`}
    onclick={handleClick}
    aria-label={`Wealth histogram, ${xLog ? 'log' : 'linear'} wealth axis, ${yLog ? 'log' : 'linear'} people axis. Click an axis to toggle its scale; click the bars to change the bin count.`}
    title="axes: log ↔ linear · body: bin count"
  ></canvas>
</div>

<style>
  .box {
    display: grid;
    place-items: center;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
  }

  canvas {
    display: block;
    cursor: pointer;
  }
</style>
