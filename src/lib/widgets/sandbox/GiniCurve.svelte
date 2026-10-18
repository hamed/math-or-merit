<script lang="ts">
  // Legacy filename; this plot now renders either Gini or effective participation.
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { curveVsMetric, phaseData, type OutcomeMapMetric } from './phaseGrid.svelte';
  import { logTicks, niceLinearTicks, percentNumber } from './ticks';
  import { percent } from '../shared/format';
  import { gatedClick, type ActivationEvent } from './gatedClick';
  import { say } from '$lib/i18n';
  import { MAP_GINI, MAP_LEVIES, MAP_PARTICIPANTS, MAP_RUNS, MAP_STAKES } from '$lib/research/sandboxOutcomeMap';
  import { LEVY_TICKS, LINEAR_LEVY_TICKS, MAX_MAP_LEVY, plotLevy, sampledLevyPercent, type LevyScale } from './levyScale';
  import { SQUARED_STAKE_TICKS, plotStake, stakeAtFraction, type StakeScale } from './stakeScale';
  import { plottedOutcome, outcomeReading } from './plottedOutcome';

  interface Props {
    /** Which dial varies; the other dial fixes the cross-section. */
    axis: 'tax' | 'stake';
    stake: number;
    taxRate: number;
    metric: OutcomeMapMetric;
    taxScale: LevyScale;
    stakeScale: StakeScale;
    /** Room size for normalizing the reader's measured points. */
    n: number;
    /** Hovering the map previews another cut without moving the dials. */
    probeStake?: number | null;
    probeTax?: number | null;
    onTitle?: ((event: ActivationEvent) => void) | null;
    onTaxScaleToggle?: ((event: ActivationEvent) => void) | null;
    onStakeScaleToggle?: ((event: ActivationEvent) => void) | null;
  }

  let { axis, stake, taxRate, n, metric, taxScale, stakeScale, probeStake = null, probeTax = null, onTitle = null, onTaxScaleToggle = null, onStakeScaleToggle = null }: Props = $props();

  let xLog = $state(false);
  let yLog = $state(false);
  const taxCut = $derived(axis === 'tax');

  const dial = $derived(axis === 'tax' ? Math.min(1, Math.max(0, taxRate)) : Math.min(1, Math.max(0, stake)));
  const fixedRequested = $derived(
    axis === 'tax'
      ? (probeStake ?? Math.min(1, Math.max(0, stake)))
      : (probeTax ?? Math.min(1, Math.max(0, taxRate))),
  );
  const probing = $derived(axis === 'tax' ? probeStake !== null : probeTax !== null);

  // the cut through the reader's own measured points, at the nearest
  // measured value of the OTHER dial
  const localCut = $derived.by(() => {
    void phaseData.version;
    const raw = curveVsMetric(axis, fixedRequested, n, metric);
    return {
      ...raw,
      points: raw.points.map((point) => ({
        ...point,
        raw: point.value,
        value: plottedOutcome(metric, point.value, n),
      })),
    };
  });

  const referenceCut = $derived.by(() => {
    const grid = metric === 'gini' ? MAP_GINI : MAP_PARTICIPANTS;
    const fixedValues = axis === 'tax' ? MAP_STAKES : MAP_LEVIES;
    let nearest = 0;
    for (let i = 1; i < fixedValues.length; i++) {
      if (Math.abs(fixedValues[i] - fixedRequested) < Math.abs(fixedValues[nearest] - fixedRequested)) nearest = i;
    }
    const points = axis === 'tax'
      ? MAP_LEVIES.map((v, row) => ({ v, raw: grid[row][nearest], value: plottedOutcome(metric, grid[row][nearest], 100), count: fixedValues[nearest] === 0 || v === 0 ? 0 : MAP_RUNS }))
      : MAP_STAKES.map((v, col) => ({ v, raw: grid[nearest][col], value: plottedOutcome(metric, grid[nearest][col], 100), count: fixedValues[nearest] === 0 || v === 0 ? 0 : MAP_RUNS }));
    return { fixedUsed: fixedValues[nearest], metric, points };
  });
  const cut = $derived(referenceCut);

  const metricName = $derived(metric === 'gini' ? 'Gini' : 'participation');
  const yTax = (rate: number) => plotLevy(rate, taxScale);
  const xStake = (rate: number) => plotStake(rate, stakeScale);
  const metricCeiling = 1;
  const metricFormat = (value: number) => metric === 'gini'
    ? String(Number(value.toPrecision(3)))
    : percentNumber(value);
  const pointDetail = (value: number) => {
    if (metric === 'gini') return '';
    const count = Number(value.toFixed(2));
    return ` ${count === 1
      ? say('sandbox_point_participant_detail')
      : say('sandbox_point_participants_detail', { count: String(count) })}`;
  };

  const yFloor = $derived.by(() => {
    let lo = 1;
    for (const p of cut.points) if (p.value > 0 && p.value < lo) lo = p.value;
    return Math.min(Math.max(lo, 1e-3), 0.1);
  });

  const xAxis: AxisSpec = $derived(taxCut ? {
    type: xLog ? 'log' : 'linear',
    lo: xLog ? yFloor : 0,
    hi: metricCeiling,
    ticks: xLog ? logTicks(yFloor, metricCeiling) : niceLinearTicks(0, metricCeiling),
    format: metricFormat,
    label: say(metric === 'gini' ? 'sandbox_curve_axis_gini' : 'sandbox_curve_axis_participants'),
    onToggle: gatedClick(() => (xLog = !xLog)),
  } : {
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

  const yAxis: AxisSpec = $derived(taxCut ? {
    type: 'linear',
    lo: 0,
    hi: yTax(MAX_MAP_LEVY),
    ticks: (taxScale === 'sqrt' ? LEVY_TICKS : LINEAR_LEVY_TICKS).map(yTax),
    format: (position: number) => percentNumber(taxScale === 'sqrt' ? position * position : position),
    label: say(taxScale === 'sqrt' ? 'sandbox_map_levy_axis' : 'sandbox_map_levy_axis_linear'),
    onToggle: onTaxScaleToggle ?? undefined,
    toggleLabel: say('sandbox_map_tax_scale_toggle'),
    toggleTooltip: say('sandbox_map_tax_scale_tooltip'),
  } : {
    type: yLog ? 'log' : 'linear',
    lo: yLog ? yFloor : 0,
    hi: metricCeiling,
    ticks: yLog ? logTicks(yFloor, metricCeiling) : niceLinearTicks(0, metricCeiling),
    format: metricFormat,
    label: say(metric === 'gini' ? 'sandbox_curve_axis_gini' : 'sandbox_curve_axis_participants'),
    onToggle: gatedClick(() => (yLog = !yLog)),
  });

  function visiblePoint(p: { v: number; value: number }): boolean {
    return taxCut
      ? p.v >= 0 && p.v <= MAX_MAP_LEVY && (!xLog || p.value > 0)
      : !yLog || p.value > 0;
  }

  const pointX = (p: { v: number; value: number }, xOf: (v: number) => number): number =>
    xOf(taxCut ? p.value : xStake(p.v));
  const pointY = (p: { v: number; value: number }, yOf: (v: number) => number): number =>
    yOf(taxCut ? yTax(p.v) : p.value);

  function buildPath(xOf: (v: number) => number, yOf: (v: number) => number): string {
    let d = '';
    for (const p of cut.points) {
      if (!visiblePoint(p)) continue;
      d += `${d === '' ? 'M' : 'L'} ${pointX(p, xOf).toFixed(1)} ${pointY(p, yOf).toFixed(1)} `;
    }
    return d;
  }

  let hovered = $state(false);

  // hover insight: the Gini this cut predicts at the dial's exact position
  const atDial = $derived.by(() => {
    if (cut.points.length < 2) return null;
    if (taxCut && dial > MAX_MAP_LEVY) return null;
    if (dial < cut.points[0].v || dial > cut.points[cut.points.length - 1].v) return null;
    let lower = cut.points[0];
    let upper = cut.points[cut.points.length - 1];
    for (const p of cut.points) {
      if (p.v <= dial && p.v >= lower.v) lower = p;
      if (p.v >= dial && p.v <= upper.v) upper = p;
    }
    const span = upper.v - lower.v;
    const t = span > 0 ? (dial - lower.v) / span : 0;
    return lower.value + (upper.value - lower.value) * t;
  });
</script>

<div class="curve-box">
  <PlotFrame
    x={xAxis}
    y={yAxis}
    title={taxCut
      ? say(metric === 'gini' ? 'sandbox_curve_title_tax_gini' : 'sandbox_curve_title_tax_participants')
      : say(metric === 'gini' ? 'sandbox_curve_title_gini' : 'sandbox_curve_title_participants', { axis })}
    description={taxCut
      ? say('sandbox_curve_tax_description', { metric: metricName })
      : say('sandbox_curve_stake_description', { metric: metricName }) + (stakeScale === 'squared' ? ` ${say('sandbox_curve_stake_scale_note')}` : '')}
    {onTitle}
    titleActionLabel={say('sandbox_map_title_toggle')}
    sharedZero={taxCut ? !xLog : !yLog}
    onHoverChange={(inside) => (hovered = inside)}
    ariaLabel={taxCut
      ? say('sandbox_curve_tax_aria', { metric: metricName, stake: percent(cut.fixedUsed ?? fixedRequested) })
      : say('sandbox_curve_stake_aria', { metric: metricName, levy: sampledLevyPercent(cut.fixedUsed ?? fixedRequested) })}
  >
    {#snippet children({ xOf, yOf, frame })}
      {@const d = buildPath(xOf, yOf)}
      {#if d}
        <path class="curve" class:probing d={d} />
        {#each cut.points as p (p.v)}
          {#if visiblePoint(p)}
            <circle class="pt" cx={pointX(p, xOf)} cy={pointY(p, yOf)} r="2">
              <title>{say(p.count === 0 ? 'sandbox_curve_exact_point' : 'sandbox_curve_reference_point', { axis, setting: axis === 'tax' ? sampledLevyPercent(p.v) : percent(p.v, 2), metric: metricName, reading: outcomeReading(metric, p.raw, 100), detail: pointDetail(p.raw), runs: p.count })}</title>
            </circle>
          {/if}
        {/each}
        {#each localCut.points as p (p.v)}
          {#if visiblePoint(p)}
            <circle class="local-pt" cx={pointX(p, xOf)} cy={pointY(p, yOf)} r="3.1">
              <title>{say('sandbox_curve_local_point', { axis, setting: axis === 'tax' ? sampledLevyPercent(p.v) : percent(p.v, 2), metric: metricName, reading: outcomeReading(metric, p.raw, n), detail: pointDetail(p.raw), runs: p.count })}</title>
            </circle>
          {/if}
        {/each}
      {:else}
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 - 5} text-anchor="middle">no measurements on this cut yet —</text>
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 + 6} text-anchor="middle">hold the dials and complete a run</text>
      {/if}
      {#if taxCut}
        {#if dial <= MAX_MAP_LEVY}
          <line class="section" x1={frame.x} y1={yOf(yTax(dial))} x2={frame.x + frame.w} y2={yOf(yTax(dial))} />
        {/if}
      {:else}
        <line class="section" x1={xOf(xStake(dial))} y1={frame.y} x2={xOf(xStake(dial))} y2={frame.y + frame.h} />
      {/if}
      <g class="insight" class:on={hovered && atDial !== null} aria-hidden="true">
        {#if atDial !== null && !(taxCut ? xLog && atDial <= 0 : yLog && atDial <= 0)}
          {@const ix = taxCut ? xOf(Math.max(atDial, xLog ? yFloor : 0)) : xOf(xStake(dial))}
          {@const iy = taxCut ? yOf(yTax(dial)) : yOf(Math.max(atDial, yLog ? yFloor : 0))}
          <circle class="at-dot" cx={ix} cy={iy} r="2.6" />
          <text class="at-label" x={ix > frame.x + frame.w * 0.65 ? ix - 5 : ix + 5} y={iy - 4} text-anchor={ix > frame.x + frame.w * 0.65 ? 'end' : 'start'}>{say('sandbox_curve_at_dial', { value: metric === 'gini' ? String(Number(atDial.toFixed(3))) : `${Number((atDial * 100).toFixed(1))}%` })}</text>
        {/if}
      </g>
    {/snippet}
  </PlotFrame>
</div>

<style>
  .curve-box {
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
  }

  .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  .curve.probing {
    stroke-dasharray: 3 2;
    opacity: 0.85;
  }

  .pt {
    fill: var(--accent-deep);
  }

  .local-pt {
    fill: var(--paper-bright);
    stroke: var(--ink);
    stroke-width: 1.2;
  }

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
  }

  .empty {
    fill: var(--ink-soft);
    font-size: 8px;
    font-family: var(--font-sans);
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

  .at-dot {
    fill: var(--accent-deep);
  }

  .at-label {
    fill: var(--ink);
    font-size: 7.5px;
    font-weight: 650;
  }
</style>
