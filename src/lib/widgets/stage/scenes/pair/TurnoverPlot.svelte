<script lang="ts">
  /**
   * Turnover as a proper plot, in the sandbox's frame: how much of all the
   * room's money changed hands in each round, round by round, against the
   * trades done — the stage's recording, not a live world (the sandbox's
   * `TimeSeries` reads a `SandboxWorld`).
   */
  import PlotFrame, { type AxisSpec } from '../../../sandbox/PlotFrame.svelte';
  import { compactNumber, niceLinearTicks } from '../../../sandbox/ticks';

  interface Props {
    /** Share of all the money that changed hands in each round, 0–1, smoothed. */
    rounds: readonly number[];
    /** Trades by the last round shown. */
    trades: number;
    title: string;
    xLabel: string;
    yLabel: string;
  }

  let { rounds, trades, title, xLabel, yLabel }: Props = $props();

  const top = $derived(Math.max(1e-6, ...rounds) * 1.1);
  const percent = (v: number) => `${Number((v * 100).toPrecision(2))}%`;

  const xAxis: AxisSpec = $derived({
    type: 'linear',
    lo: 0,
    hi: Math.max(1, trades),
    ticks: niceLinearTicks(0, Math.max(1, trades), 3),
    format: compactNumber,
    label: xLabel,
  });
  const yAxis: AxisSpec = $derived({
    type: 'linear',
    lo: 0,
    hi: top,
    ticks: niceLinearTicks(0, top, 3),
    format: percent,
    label: yLabel,
  });
</script>

<PlotFrame x={xAxis} y={yAxis} {title} ariaLabel={`${title}: ${yLabel}, ${xLabel}`}>
  {#snippet children({ xOf, yOf })}
    {#if rounds.length > 1}
      <polyline
        class="series"
        points={rounds.map((t, k) => `${xOf(((k + 1) / rounds.length) * trades).toFixed(1)},${yOf(t).toFixed(1)}`).join(' ')}
      />
    {/if}
  {/snippet}
</PlotFrame>

<style>
  .series {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
</style>
