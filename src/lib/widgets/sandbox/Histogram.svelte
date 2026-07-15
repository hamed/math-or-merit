<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { geometricBins, rangedLinearBins, StickyRange } from './histBins';
  import { compactNumber, logBinTicks, logTicks, niceLinearTicks } from './ticks';
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

  // log x: $1 … one order above the starting money, so the initial spike sits
  // among visibly empty neighbors; linear x: 0 … double the starting money.
  const logRange = $derived.by(() => new StickyRange(1, 10 * startDollars));
  const linRange = $derived.by(() => new StickyRange(0, 2 * startDollars));

  let hovered = $state(false);

  const view = $derived.by(() => {
    void revision;
    const amounts = new Float64Array(n);
    let minPos = Infinity;
    let maxV = 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const d = wealth[i] * totalDollars;
      amounts[i] = d;
      sum += Number.isFinite(d) ? d : 0;
      if (d > 0 && d < minPos) minPos = d;
      if (d > maxV) maxV = d;
    }
    if (!Number.isFinite(minPos)) minPos = 1;
    const sorted = Float64Array.from(amounts).sort();
    const median = sorted[Math.floor(n / 2)];
    const mean = sum / n;
    const now = performance.now();
    if (xLog) {
      const binCount = LOG_BIN_CYCLE[logBinIdx];
      const { lo, hi } = logRange.update(Math.max(1e-9, minPos), Math.max(maxV, 2), now);
      return { bins: geometricBins(amounts, lo, hi, binCount), lo, hi, binCount, median, mean };
    }
    const binCount = LIN_BIN_CYCLE[linBinIdx];
    const { hi } = linRange.update(0, maxV, now);
    return { bins: rangedLinearBins(amounts, hi, binCount), lo: 0, hi, binCount, median, mean };
  });

  const xAxis: AxisSpec = $derived({
    type: xLog ? 'log' : 'linear',
    lo: view.lo,
    hi: view.hi,
    ticks: xLog ? logBinTicks(view.lo, view.hi, view.binCount, 5) : niceLinearTicks(0, view.hi),
    format: compactNumber,
    label: 'wealth $',
    onToggle: gatedClick(() => (xLog = !xLog)),
  });

  const yAxis: AxisSpec = $derived({
    type: yLog ? 'log' : 'linear',
    // log floor sits below 1 so a single-agent bin still has height
    lo: yLog ? 0.7 : 0,
    hi: n,
    ticks: yLog ? logTicks(1, n) : niceLinearTicks(0, n),
    format: compactNumber,
    label: 'people',
    onToggle: gatedClick(() => (yLog = !yLog)),
  });

  const cycleBins = gatedClick(() => {
    if (xLog) logBinIdx = (logBinIdx + 1) % LOG_BIN_CYCLE.length;
    else linBinIdx = (linBinIdx + 1) % LIN_BIN_CYCLE.length;
  });
</script>

<PlotFrame
  x={xAxis}
  y={yAxis}
  title="how many hold how much"
  description="The wealth distribution: each bar counts the people whose holdings fall in that range. Hover for median and mean."
  onBody={cycleBins}
  bodyTooltip={`${view.binCount} bins — click for the next count`}
  onHoverChange={(inside) => (hovered = inside)}
  ariaLabel={`Wealth histogram, ${view.binCount} ${xLog ? 'log' : 'linear'} bins, ${yLog ? 'log' : 'linear'} people axis. Click an axis to toggle its scale; click the bars to change the bin count.`}
>
  {#snippet children({ xOf, yOf, frame })}
    {@const baseline = frame.y + frame.h}
    {#each view.bins.counts as count, k}
      {#if count > 0}
        {@const x0 = xOf(view.bins.edges[k])}
        {@const x1 = xOf(view.bins.edges[k + 1])}
        <rect class="bar" x={x0 + 0.5} y={yOf(count)} width={Math.max(1, x1 - x0 - 1)} height={Math.max(1.2, baseline - yOf(count))} />
      {/if}
    {/each}
    {#if view.bins.underCount > 0}
      <text class="note" x={frame.x + frame.w - 3} y={frame.y + 9} text-anchor="end">
        {view.bins.underCount} at ≈0, off scale
      </text>
    {/if}
    <!-- hover insight: where the middle and the average sit (they drift apart
         as the room condenses — that gap IS the story) -->
    <g class="insight" class:on={hovered} aria-hidden="true">
      {#if !xLog || view.median > 0}
        {@const mx = xOf(view.median)}
        <line class="median" x1={mx} y1={frame.y + 8} x2={mx} y2={baseline} />
        <text class="insight-label" x={mx} y={frame.y + 6} text-anchor={mx > frame.x + frame.w - 34 ? 'end' : 'middle'}>median {compactNumber(Number(view.median.toPrecision(2)))}</text>
      {/if}
      {#if !xLog || view.mean > 0}
        {@const ax = xOf(view.mean)}
        <line class="mean" x1={ax} y1={frame.y + 18} x2={ax} y2={baseline} />
        <text class="insight-label mean-label" x={ax} y={frame.y + 16} text-anchor={ax > frame.x + frame.w - 30 ? 'end' : 'middle'}>mean {compactNumber(Number(view.mean.toPrecision(2)))}</text>
      {/if}
    </g>
  {/snippet}
</PlotFrame>

<style>
  .bar {
    fill: rgb(189 98 69 / 55%);
  }

  .note {
    fill: var(--ink-soft);
    font-size: 8px;
    font-style: italic;
  }

  .insight {
    opacity: 0;
    transform: translateY(3px);
    transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    pointer-events: none;
  }

  .insight.on {
    opacity: 1;
    transform: none;
  }

  .median {
    stroke: var(--accent-deep);
    stroke-width: 1.1;
    stroke-dasharray: 4 3;
  }

  .mean {
    stroke: var(--ink-mid);
    stroke-width: 1.1;
    stroke-dasharray: 1.5 2.5;
  }

  .insight-label {
    fill: var(--accent-deep);
    font-size: 7.5px;
    font-weight: 650;
  }

  .mean-label {
    fill: var(--ink-mid);
  }
</style>
