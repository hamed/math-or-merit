<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { logTicks, niceLinearTicks, percentNumber } from './ticks';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Wealth shares (sum ~1). Mutated in place by the owner. */
    wealth: ArrayLike<number>;
    gini: number;
    revision?: number;
  }

  let { wealth, gini, revision = 0 }: Props = $props();

  let xLog = $state(false);
  let yLog = $state(false);

  // built locally, chaos-tolerant: the research lorenzCurve validates its
  // input, but expert mode makes negative wealth on purpose — the curve
  // dipping below zero is exactly the picture the reader should see
  const points = $derived.by(() => {
    void revision;
    const n = wealth.length;
    const sorted: number[] = [];
    for (let i = 0; i < n; i++) sorted.push(Number.isFinite(wealth[i]) ? wealth[i] : 0);
    sorted.sort((a, b) => a - b);
    const total = sorted.reduce((a, b) => a + b, 0) || 1;
    const pts = [{ populationShare: 0, wealthShare: 0 }];
    let cumulative = 0;
    for (let i = 0; i < n; i++) {
      cumulative += sorted[i];
      pts.push({ populationShare: (i + 1) / n, wealthShare: cumulative / total });
    }
    return pts;
  });

  // log floors: the first agent's slot on x; the smallest positive share on y
  const xFloor = $derived(1 / Math.max(2, wealth.length));
  const yFloor = $derived.by(() => {
    let lo = 1;
    for (const p of points) if (p.wealthShare > 0 && p.wealthShare < lo) lo = p.wealthShare;
    return Math.min(lo, 0.1);
  });

  const xAxis: AxisSpec = $derived({
    type: xLog ? 'log' : 'linear',
    lo: xLog ? xFloor : 0,
    hi: 1,
    ticks: xLog ? logTicks(xFloor, 1) : niceLinearTicks(0, 1),
    format: percentNumber,
    label: '% of people',
    onToggle: gatedClick(() => (xLog = !xLog)),
  });

  const yAxis: AxisSpec = $derived({
    type: yLog ? 'log' : 'linear',
    lo: yLog ? yFloor : 0,
    hi: 1,
    ticks: yLog ? logTicks(yFloor, 1) : niceLinearTicks(0, 1),
    format: percentNumber,
    label: '% of wealth',
    onToggle: gatedClick(() => (yLog = !yLog)),
  });

  let hovered = $state(false);

  // hover insight: what the poorest half holds — the Lorenz curve's midpoint
  const bottomHalf = $derived.by(() => {
    let best = points[0];
    for (const p of points) {
      if (Math.abs(p.populationShare - 0.5) < Math.abs(best.populationShare - 0.5)) best = p;
    }
    return best;
  });

  // Gini 0 (and any zero point) has no log home — drop it, start at the next
  function buildPath(xOf: (v: number) => number, yOf: (v: number) => number): string {
    let d = '';
    for (const p of points) {
      if ((xLog && p.populationShare <= 0) || (yLog && p.wealthShare <= 0)) continue;
      d += `${d === '' ? 'M' : 'L'} ${xOf(p.populationShare).toFixed(1)} ${yOf(p.wealthShare).toFixed(1)} `;
    }
    return d;
  }
</script>

<PlotFrame
  x={xAxis}
  y={yAxis}
  title={`Lorenz — Gini ${Number.isFinite(gini) ? gini.toFixed(2) : '—'}`}
  sharedZero={!xLog && !yLog}
  onHoverChange={(inside) => (hovered = inside)}
  ariaLabel={`Lorenz curve, Gini ${Number.isFinite(gini) ? gini.toFixed(2) : '—'}. Click an axis to toggle its scale.`}
>
  {#snippet children({ xOf, yOf, frame })}
    {@const d = buildPath(xOf, yOf)}
    {@const equalStart = Math.max(xLog ? xFloor : 0, yLog ? yFloor : 0)}
    {@const halfY = Math.max(bottomHalf.wealthShare, yLog ? yFloor : 0)}
    {#if !xLog && !yLog}
      <path class="gap" d={`${d} L ${xOf(1)} ${yOf(1)} L ${xOf(0)} ${yOf(0)} Z`} />
    {/if}
    <line class="equal" x1={xOf(equalStart)} y1={yOf(equalStart)} x2={xOf(1)} y2={yOf(1)} />
    {#if d}
      <path class="curve" d={d} />
    {/if}
    <g class="insight" class:on={hovered} aria-hidden="true">
      <line class="half" x1={xOf(0.5)} y1={frame.y + frame.h} x2={xOf(0.5)} y2={yOf(halfY)} />
      <circle class="half-dot" cx={xOf(0.5)} cy={yOf(halfY)} r="2.4" />
      <text class="half-label" x={xOf(0.5) + 4} y={yOf(halfY) - 4} text-anchor="start">
        poorest half holds {percentNumber(Math.max(0, bottomHalf.wealthShare))}%
      </text>
    </g>
  {/snippet}
</PlotFrame>

<style>
  .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.8;
    stroke-linejoin: round;
  }

  .equal {
    stroke: var(--ink-mid);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .gap {
    fill: var(--accent);
    fill-opacity: 0.12;
    stroke: none;
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

  .half {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.65;
  }

  .half-dot {
    fill: var(--accent-deep);
  }

  .half-label {
    fill: var(--ink);
    font-size: 7.5px;
    font-weight: 650;
  }
</style>
