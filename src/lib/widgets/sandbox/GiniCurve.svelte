<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { PHASE_STEPS, phaseStore } from './phaseGrid.svelte';
  import { logTicks, niceLinearTicks, percentNumber } from './ticks';
  import { percent } from '../shared/format';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Which dial runs along x; the other dial fixes the cross-section. */
    axis: 'tax' | 'stake';
    stake: number;
    taxRate: number;
  }

  let { axis, stake, taxRate }: Props = $props();

  let xLog = $state(false);
  let yLog = $state(false);

  const dial = $derived(axis === 'tax' ? Math.min(1, Math.max(0, taxRate)) : Math.min(1, Math.max(0, stake)));
  const fixed = $derived(axis === 'tax' ? Math.min(1, Math.max(0, stake)) : Math.min(1, Math.max(0, taxRate)));
  const fixedIdx = $derived(Math.round(fixed * (PHASE_STEPS.length - 1)));

  // the cross-section of the measured grid at the OTHER dial's nearest step
  const curve = $derived.by(() => {
    const grid = phaseStore.grid;
    if (!grid) return [];
    const pts: { v: number; gini: number }[] = [];
    for (let i = 0; i < PHASE_STEPS.length; i++) {
      const g = axis === 'tax' ? grid[i][fixedIdx] : grid[fixedIdx][i];
      if (!Number.isNaN(g)) pts.push({ v: PHASE_STEPS[i], gini: g });
    }
    return pts;
  });

  const X_FLOOR = 0.1; // the first nonzero dial step
  const yFloor = $derived.by(() => {
    let lo = 1;
    for (const p of curve) if (p.gini > 0 && p.gini < lo) lo = p.gini;
    return Math.min(Math.max(lo, 1e-3), 0.1);
  });

  const xAxis: AxisSpec = $derived({
    type: xLog ? 'log' : 'linear',
    lo: xLog ? X_FLOOR : 0,
    hi: 1,
    ticks: xLog ? logTicks(X_FLOOR, 1) : niceLinearTicks(0, 1),
    format: percentNumber,
    label: `${axis} %`,
    onToggle: gatedClick(() => (xLog = !xLog)),
  });

  const yAxis: AxisSpec = $derived({
    type: yLog ? 'log' : 'linear',
    lo: yLog ? yFloor : 0,
    hi: 1,
    ticks: yLog ? logTicks(yFloor, 1) : niceLinearTicks(0, 1),
    format: (v) => String(Number(v.toPrecision(3))),
    label: 'Gini',
    onToggle: gatedClick(() => (yLog = !yLog)),
  });

  // Gini 0 (and dial 0 on a log x) has no log home — drop, start at the next
  function buildPath(xOf: (v: number) => number, yOf: (v: number) => number): string {
    let d = '';
    for (const p of curve) {
      if ((xLog && p.v <= 0) || (yLog && p.gini <= 0)) continue;
      d += `${d === '' ? 'M' : 'L'} ${xOf(p.v).toFixed(1)} ${yOf(p.gini).toFixed(1)} `;
    }
    return d;
  }

  const other = $derived(axis === 'tax' ? 'stake' : 'tax');

  let hovered = $state(false);

  // hover insight: the Gini this cut predicts at the dial's exact position
  const atDial = $derived.by(() => {
    if (curve.length < 2) return null;
    let lower = curve[0];
    let upper = curve[curve.length - 1];
    for (const p of curve) {
      if (p.v <= dial && p.v >= lower.v) lower = p;
      if (p.v >= dial && p.v <= upper.v) upper = p;
    }
    const span = upper.v - lower.v;
    const t = span > 0 ? (dial - lower.v) / span : 0;
    return lower.gini + (upper.gini - lower.gini) * t;
  });
</script>

<div class="curve-box">
  <PlotFrame
    x={xAxis}
    y={yAxis}
    title={`Gini vs ${axis} — at your ${other}`}
    sharedZero={!xLog && !yLog}
    onHoverChange={(inside) => (hovered = inside)}
    ariaLabel={`Gini as a function of the ${axis} dial, cut through the phase map at your ${other} (${percent(fixed)}). Click an axis to toggle its scale.`}
  >
    {#snippet children({ xOf, yOf, frame })}
      {@const d = buildPath(xOf, yOf)}
      {#if d}
        <path class="curve" d={d} />
      {:else}
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2} text-anchor="middle">runs draw this cut</text>
      {/if}
      {#if !(xLog && dial <= 0)}
        <line class="section" x1={xOf(Math.max(dial, xLog ? X_FLOOR : 0))} y1={frame.y} x2={xOf(Math.max(dial, xLog ? X_FLOOR : 0))} y2={frame.y + frame.h} />
      {/if}
      <g class="insight" class:on={hovered && atDial !== null} aria-hidden="true">
        {#if atDial !== null && !(yLog && atDial <= 0)}
          {@const ix = xOf(Math.max(dial, xLog ? X_FLOOR : 0))}
          {@const iy = yOf(Math.max(atDial, yLog ? yFloor : 0))}
          <circle class="at-dot" cx={ix} cy={iy} r="2.6" />
          <text class="at-label" x={ix + 5} y={iy - 4} text-anchor="start">settles near {atDial.toFixed(2)}</text>
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

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
  }

  .empty {
    fill: var(--ink-soft);
    font-size: 8.5px;
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
