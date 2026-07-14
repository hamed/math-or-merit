<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { StickyRange } from './histBins';
  import { compactNumber, logTicks, niceLinearTicks, percentNumber } from './ticks';
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
    ticks: xLog ? logTicks(bounds.lo, bounds.hi) : niceLinearTicks(0, bounds.hi),
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
  ariaLabel={`Survival curve, ${xLog ? 'log' : 'linear'}-${yLog ? 'log' : 'linear'}: the share of the room holding more than each amount, over the data's full range. Click an axis to toggle its scale.`}
>
  {#snippet children({ xOf, yOf })}
    {@const d = buildPath(xOf, yOf)}
    {#if d}
      <path class="line" d={d} />
    {/if}
  {/snippet}
</PlotFrame>

<style>
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
</style>
