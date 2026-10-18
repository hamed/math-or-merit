<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import type { OutcomeMapMetric } from './phaseGrid.svelte';
  import { PHASE_RAMP, rampColor } from '../shared/presets';
  import { niceLinearTicks, percentNumber } from './ticks';
  import { percent } from '../shared/format';
  import { gatedClick, type ActivationEvent } from './gatedClick';
  import { say } from '$lib/i18n';
  import { MAP_GINI, MAP_LEVIES, MAP_PARTICIPANTS, MAP_RUNS, MAP_STAKES } from '$lib/research/sandboxOutcomeMap';
  import { LEVY_TICKS, LINEAR_LEVY_TICKS, MAX_MAP_LEVY, levyAtFraction, plotLevy, sampledLevyPercent, type LevyScale } from './levyScale';
  import { SQUARED_STAKE_TICKS, plotStake, stakeAtFraction, type StakeScale } from './stakeScale';
  import { plottedOutcome, outcomeReading } from './plottedOutcome';

  interface Props {
    /** Current dials, both in [0, 1] — the crosshair lives on the map. */
    stake: number;
    taxRate: number;
    /** Current room size, used to normalize its live measurement. */
    n: number;
    /** Which stored outcome colors the map. */
    metric: OutcomeMapMetric;
    /** The live room's matching instantaneous outcome. */
    liveMetric: number;
    taxScale: LevyScale;
    stakeScale: StakeScale;
    /** Hover probe: dial values for previewing cross-sections. */
    onProbe?: ((stake: number | null, tax: number | null) => void) | null;
    /** Choosing a setting moves both sandbox dials. */
    onSelect?: ((stake: number, tax: number) => void) | null;
    onTitle?: ((event: ActivationEvent) => void) | null;
    onTaxScaleToggle?: ((event: ActivationEvent) => void) | null;
    onStakeScaleToggle?: ((event: ActivationEvent) => void) | null;
  }

  let { stake, taxRate, n, metric, liveMetric, taxScale, stakeScale, onProbe = null, onSelect = null, onTitle = null, onTaxScaleToggle = null, onStakeScaleToggle = null }: Props = $props();

  const cs = $derived(Math.min(1, Math.max(0, stake)));
  const ct = $derived(Math.min(1, Math.max(0, taxRate)));

  let probe = $state<{ s: number; t: number } | null>(null);
  let pendingSelection: { stake: number; tax: number } | null = null;

  const commitSelection = gatedClick(() => {
    if (pendingSelection) onSelect?.(pendingSelection.stake, pendingSelection.tax);
  });

  // A fixed 100-person reference stays visible for every room size. Its
  // participation colors are illustrative, not predictions for this room.
  const referenceGrid = $derived(metric === 'gini' ? MAP_GINI : MAP_PARTICIPANTS);

  const metricName = $derived(metric === 'gini' ? 'Gini' : 'participation');
  const yTax = (rate: number) => plotLevy(rate, taxScale);
  const xStake = (rate: number) => plotStake(rate, stakeScale);
  const colorValue = (value: number, size: number) => {
    const plotted = plottedOutcome(metric, value, size);
    return metric === 'gini' ? 1 - plotted : plotted;
  };
  const pointDetail = (value: number) => {
    if (metric === 'gini') return '';
    const count = Number(value.toFixed(2));
    return ` ${count === 1
      ? say('sandbox_point_participant_detail')
      : say('sandbox_point_participants_detail', { count: String(count) })}`;
  };
  const edge = (stops: readonly number[], index: number, upper: boolean): number =>
    upper
      ? (index === stops.length - 1 ? 1 : (stops[index] + stops[index + 1]) / 2)
      : (index === 0 ? 0 : (stops[index - 1] + stops[index]) / 2);

  const shownLevies = MAP_LEVIES.filter((levy) => levy <= MAX_MAP_LEVY);
  const plottedStakes = $derived(MAP_STAKES.map(xStake));
  const stakeEdge = (col: number, upper: boolean): number => edge(plottedStakes, col, upper);
  // Midpoints must be taken after transforming levy; raw-levy midpoints make
  // the colored cells look uneven on the square-root axis.
  const plottedLevies = $derived(shownLevies.map(yTax));
  const levyEdge = (row: number, upper: boolean): number =>
    upper && row === shownLevies.length - 1
      ? yTax(MAX_MAP_LEVY)
      : edge(plottedLevies, row, upper);

  const xAxis: AxisSpec = $derived({
    type: 'linear',
    lo: 0,
    hi: 1,
    ticks: stakeScale === 'squared' ? SQUARED_STAKE_TICKS : niceLinearTicks(0, 1),
    format: (position: number) => percentNumber(stakeAtFraction(position, stakeScale)),
    label: say(stakeScale === 'squared' ? 'sandbox_curve_axis_stake_squared' : 'sandbox_curve_axis_stake'),
    onToggle: onStakeScaleToggle ?? undefined,
    toggleLabel: say('sandbox_map_stake_scale_toggle'),
    toggleTooltip: say('sandbox_map_stake_scale_tooltip'),
  });
  const yAxis: AxisSpec = $derived({
    type: 'linear',
    lo: 0,
    hi: yTax(MAX_MAP_LEVY),
    ticks: (taxScale === 'sqrt' ? LEVY_TICKS : LINEAR_LEVY_TICKS).map(yTax),
    format: (position: number) => percentNumber(taxScale === 'sqrt' ? position * position : position),
    label: say(taxScale === 'sqrt' ? 'sandbox_map_levy_axis' : 'sandbox_map_levy_axis_linear'),
    onToggle: onTaxScaleToggle ?? undefined,
    toggleLabel: say('sandbox_map_tax_scale_toggle'),
    toggleTooltip: say('sandbox_map_tax_scale_tooltip'),
  });

  function handleMove(fx: number | null, fy: number | null): void {
    const s = fx === null ? null : stakeAtFraction(fx, stakeScale);
    const t = fy === null ? null : levyAtFraction(fy, taxScale);
    probe = s === null || t === null ? null : { s, t };
    onProbe?.(s, t);
  }

  function choose(fx: number, fy: number, event: MouseEvent | KeyboardEvent): void {
    pendingSelection = { stake: event instanceof KeyboardEvent ? 0.5 : stakeAtFraction(fx, stakeScale), tax: event instanceof KeyboardEvent ? MAX_MAP_LEVY : levyAtFraction(fy, taxScale) };
    commitSelection(event);
  }
</script>

<div class="map-box">
  <PlotFrame
    x={xAxis}
    y={yAxis}
    title={say(metric === 'gini' ? 'sandbox_map_title_gini' : 'sandbox_map_title_participants')}
    description={say('sandbox_map_reference', { runs: MAP_RUNS })}
    {onTitle}
    titleActionLabel={say('sandbox_map_title_toggle')}
    sharedZero
    onBodyPoint={choose}
    bodyTooltip={say('sandbox_map_choose')}
    onBodyMove={handleMove}
    ariaLabel={say('sandbox_map_aria_reference', { reference: MAP_STAKES.length * shownLevies.length, metric: metricName, people: n, stake: percent(stake), levy: sampledLevyPercent(taxRate) })}
  >
    {#snippet children({ xOf, yOf, frame })}
      {#each shownLevies as levy, row}
        {#each MAP_STAKES as measuredStake, col}
          <rect
            class="reference-cell"
            x={xOf(stakeEdge(col, false))}
            y={yOf(levyEdge(row, true))}
            width={xOf(stakeEdge(col, true)) - xOf(stakeEdge(col, false))}
            height={yOf(levyEdge(row, false)) - yOf(levyEdge(row, true))}
            fill={rampColor(PHASE_RAMP, colorValue(referenceGrid[row][col], 100))}
          >
            <title>{say(measuredStake === 0 || levy === 0 ? 'sandbox_map_exact_point' : 'sandbox_map_reference_point', { stake: percent(measuredStake, 2), levy: sampledLevyPercent(levy), metric: metricName, reading: outcomeReading(metric, referenceGrid[row][col], 100), detail: pointDetail(referenceGrid[row][col]), runs: MAP_RUNS })}</title>
          </rect>
        {/each}
      {/each}

      <!-- the dial cross-sections the two Gini plots are cut along -->
      <line class="section" x1={frame.x} y1={yOf(yTax(ct))} x2={frame.x + frame.w} y2={yOf(yTax(ct))} />
      <line class="section" x1={xOf(xStake(cs))} y1={frame.y} x2={xOf(xStake(cs))} y2={frame.y + frame.h} />

      <!-- hover probe: a second, lighter cross — previews the cuts -->
      {#if probe}
        <line class="probe" x1={frame.x} y1={yOf(yTax(probe.t))} x2={frame.x + frame.w} y2={yOf(yTax(probe.t))} />
        <line class="probe" x1={xOf(xStake(probe.s))} y1={frame.y} x2={xOf(xStake(probe.s))} y2={frame.y + frame.h} />
      {/if}

      <!-- the live room: an unsolidified, wandering reading at your dials -->
      {#if Number.isFinite(liveMetric)}
        <circle class="live" cx={xOf(xStake(cs))} cy={yOf(yTax(ct))} r="4.4" fill={rampColor(PHASE_RAMP, colorValue(liveMetric, n))} />
      {/if}
      <circle class="marker" cx={xOf(xStake(cs))} cy={yOf(yTax(ct))} r="4.4" />
    {/snippet}
  </PlotFrame>

  <div
    class="colorbar"
    role="img"
    aria-label={say(metric === 'gini' ? 'sandbox_map_colorbar_gini' : 'sandbox_map_colorbar_participants')}
  >
    <span class="bar" style={`background: linear-gradient(to top, ${PHASE_RAMP.join(', ')})`}></span>
    <span class="bar-ticks" aria-hidden="true">
      <span>{metric === 'gini' ? '0' : '100%'}</span>
      <span>{metric === 'gini' ? '0.5' : '50%'}</span>
      <span>{metric === 'gini' ? '1' : '0%'}</span>
    </span>
  </div>
</div>

<style>
  /* The colorbar is positioned OUT of flow on purpose. As a flex sibling it ate
     horizontal space, so this plot rendered narrower than the other five and
     its axes, fonts and title no longer lined up with them. Now the svg fills
     the cell exactly like every sibling and the bar sits in the gutter beside
     it. */
  .map-box {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
  }

  .map-box > :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }

  .reference-cell {
    stroke: rgb(60 53 43 / 12%);
    stroke-width: 0.35;
  }

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
    pointer-events: none;
  }

  .probe {
    stroke: var(--accent-deep);
    stroke-width: 0.9;
    stroke-dasharray: 1.5 2.5;
    opacity: 0.8;
    pointer-events: none;
  }

  .live {
    opacity: 0.75;
    animation: breathe 1.6s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes breathe {
    0%,
    100% {
      opacity: 0.45;
    }

    50% {
      opacity: 0.85;
    }
  }

  .marker {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.4;
    pointer-events: none;
  }

  .colorbar {
    position: absolute;
    /* Sits in the plot's own right margin by default. Only where there is room
       does it move out into the grid gutter — a negative offset at phone widths
       pushed the page into horizontal overflow. */
    inset-inline-end: 0;
    inset-block-start: 50%;
    translate: 0 -50%;
    display: flex;
    justify-content: end;
    align-items: stretch;
    gap: 0.1rem;
    min-inline-size: 2.75rem;
    block-size: 52%;
    padding: 0;
    border: none;
    background: none;
  }

  @media (min-width: 60rem) {
    .colorbar {
      inset-inline-end: -1.15rem;
    }
  }

  /* No room for the numbers beside the bar on a phone; the aria-label
     still describes the scale. */
  @media (max-width: 60rem) {
    .bar-ticks {
      display: none;
    }
  }

  .bar {
    inline-size: 0.38rem;
    border-radius: 2px;
    border: 1px solid rgb(60 53 43 / 25%);
  }

  .bar-ticks {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-family: var(--font-sans);
    font-size: 0.45rem;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .live {
      animation: none;
    }
  }
</style>
