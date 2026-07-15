<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { StickyRange } from './histBins';
  import { compactNumber, logTicks, niceLinearTicks, percentNumber } from './ticks';
  import { exponentialFit, logLinearFit, powerTailFit } from './fits';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Wealth shares (sum ~1). Mutated in place by the owner. */
    wealth: ArrayLike<number>;
    totalDollars: number;
    revision?: number;
    /** Dollars per head at the start — pins the initial axis range. */
    startDollars: number;
  }

  let { wealth, totalDollars, revision = 0, startDollars }: Props = $props();

  // canonical: log-log, the Pareto-tail view (owner review 2026-07-14)
  let xLog = $state(true);
  let yLog = $state(true);

  // starts at $1 … two orders above the starting money, then follows the data
  // EVERYWHERE it goes — never clipped, every order of magnitude shown
  const range = $derived.by(() => new StickyRange(1, 100 * startDollars));

  const sorted = $derived.by(() => {
    void revision;
    const n = wealth.length;
    const dollars: number[] = [];
    for (let i = 0; i < n; i++) {
      const d = wealth[i] * totalDollars;
      if (d > 0) dollars.push(d);
    }
    dollars.sort((a, b) => a - b);
    return { dollars, n };
  });

  const bounds = $derived.by(() => {
    const { dollars } = sorted;
    const lo = dollars.length > 0 ? dollars[0] : 1;
    const hi = dollars.length > 0 ? dollars[dollars.length - 1] : 1;
    return range.update(lo, hi, performance.now());
  });

  const yFloor = $derived(1 / Math.max(2, sorted.n)); // one agent's worth

  const xAxis: AxisSpec = $derived({
    type: xLog ? 'log' : 'linear',
    lo: xLog ? bounds.lo : 0,
    hi: bounds.hi,
    ticks: xLog ? logTicks(bounds.lo, bounds.hi, 5) : niceLinearTicks(0, bounds.hi),
    format: compactNumber,
    label: 'wealth $',
    onToggle: gatedClick(() => (xLog = !xLog)),
  });

  const yAxis: AxisSpec = $derived({
    type: yLog ? 'log' : 'linear',
    lo: yLog ? yFloor : 0,
    hi: 1,
    ticks: yLog ? logTicks(yFloor, 1) : niceLinearTicks(0, 1),
    format: percentNumber,
    label: '% holding more',
    onToggle: gatedClick(() => (yLog = !yLog)),
  });

  let hovered = $state(false);

  // hover insights: the straight line each scale pair is FOR — a power-law
  // TAIL (top 20% only — the bulk is not Pareto) on log-log, an exponential
  // bulk on x-linear/y-log, a lognormal-ish line on x-log/y-linear
  const tail = $derived.by(() => (xLog && yLog && hovered ? powerTailFit(sorted.dollars, sorted.n, 0.2) : null));
  const decay = $derived.by(() => (!xLog && yLog && hovered ? exponentialFit(sorted.dollars, sorted.n) : null));
  const slide = $derived.by(() => (xLog && !yLog && hovered ? logLinearFit(sorted.dollars, sorted.n) : null));

  // who's-in-the-news quantiles: where the top 1% starts, where the middle sits
  const quantiles = $derived.by(() => {
    void revision;
    const { dollars, n } = sorted;
    if (dollars.length < 4) return null;
    const at = (q: number) => dollars[Math.max(0, Math.min(dollars.length - 1, Math.ceil((1 - q) * dollars.length) - 1))];
    return { top1: at(Math.max(0.01, 1 / n)), median: at(0.5) };
  });

  function buildPath(xOf: (v: number) => number, yOf: (v: number) => number): string {
    const { dollars, n } = sorted;
    if (dollars.length === 0) return '';
    let d = `M ${xOf(xLog ? bounds.lo : 0).toFixed(1)} ${yOf(dollars.length / n).toFixed(1)}`;
    for (let i = 0; i < dollars.length; i++) {
      const above = (dollars.length - (i + 1)) / n;
      d += ` H ${xOf(dollars[i]).toFixed(1)}`;
      if (above > 0 || !yLog) d += ` V ${yOf(Math.max(above, yLog ? yFloor : 0)).toFixed(1)}`;
    }
    return d;
  }
</script>

<PlotFrame
  x={xAxis}
  y={yAxis}
  title="who holds more than x"
  description="The survival curve: what share of the room holds more than each amount. Straight on log-log = power-law tail."
  onHoverChange={(inside) => (hovered = inside)}
  ariaLabel={`Survival curve, ${xLog ? 'log' : 'linear'}-${yLog ? 'log' : 'linear'}: the share of the room holding more than each amount, over the data's full range. Click an axis to toggle its scale.`}
>
  {#snippet children({ xOf, yOf, frame })}
    {@const d = buildPath(xOf, yOf)}
    {#if d}
      <path class="line" d={d} />
    {/if}
    <g class="insight" class:on={hovered} aria-hidden="true">
      {#if quantiles}
        <line class="quant" x1={xOf(quantiles.top1)} y1={frame.y + 12} x2={xOf(quantiles.top1)} y2={frame.y + frame.h} />
        <text class="quant-label" x={xOf(quantiles.top1)} y={frame.y + 10} text-anchor={xOf(quantiles.top1) > frame.x + frame.w - 40 ? 'end' : 'middle'}>top 1% ≥ {compactNumber(Number(quantiles.top1.toPrecision(2)))}</text>
        <line class="quant median" x1={xOf(quantiles.median)} y1={frame.y + 24} x2={xOf(quantiles.median)} y2={frame.y + frame.h} />
        <text class="quant-label median-label" x={xOf(quantiles.median)} y={frame.y + 22} text-anchor="middle">median {compactNumber(Number(quantiles.median.toPrecision(2)))}</text>
      {/if}
      {#if tail}
        <line
          class="fit"
          x1={xOf(tail.lo)}
          y1={yOf(tail.yAtLo)}
          x2={xOf(tail.hi)}
          y2={yOf(tail.yAtLo * (tail.hi / tail.lo) ** -tail.alpha)}
        />
        <text class="fit-label" x={frame.x + 4} y={frame.y + frame.h - 5} text-anchor="start">
          tail ≈ x^−{tail.alpha.toFixed(1)}
        </text>
      {:else if decay}
        <line
          class="fit"
          x1={xOf(decay.lo)}
          y1={yOf(decay.yAtLo)}
          x2={xOf(decay.hi)}
          y2={yOf(decay.yAtLo * Math.exp(-(decay.hi - decay.lo) / decay.scale))}
        />
        <text class="fit-label" x={frame.x + 4} y={frame.y + frame.h - 5} text-anchor="start">
          ≈ e^(−x/{compactNumber(Number(decay.scale.toPrecision(2)))})
        </text>
      {:else if slide}
        <line
          class="fit"
          x1={xOf(slide.lo)}
          y1={yOf(Math.min(1, slide.yAtLo))}
          x2={xOf(slide.hi)}
          y2={yOf(Math.max(0, slide.yAtLo + slide.slopePerDecade * Math.log10(slide.hi / slide.lo)))}
        />
        <text class="fit-label" x={frame.x + 4} y={frame.y + frame.h - 5} text-anchor="start">
          −{Math.round(-slide.slopePerDecade * 100)}%/decade — lognormal-ish
        </text>
      {/if}
    </g>
  {/snippet}
</PlotFrame>

<style>
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linejoin: round;
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

  .fit {
    stroke: var(--ink);
    stroke-width: 1.1;
    stroke-dasharray: 5 3;
    opacity: 0.75;
  }

  .fit-label {
    fill: var(--ink);
    font-size: 7.5px;
    font-weight: 650;
  }

  .quant {
    stroke: var(--accent-deep);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.8;
  }

  .quant.median {
    stroke: var(--ink-mid);
    stroke-dasharray: 1.5 2.5;
  }

  .quant-label {
    fill: var(--accent-deep);
    font-size: 7.5px;
    font-weight: 650;
  }

  .median-label {
    fill: var(--ink-mid);
  }
</style>
