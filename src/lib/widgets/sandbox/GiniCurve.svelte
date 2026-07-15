<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { curveVs, phaseData } from './phaseGrid.svelte';
  import { logTicks, niceLinearTicks, percentNumber } from './ticks';
  import { percent } from '../shared/format';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Which dial runs along x; the other dial fixes the cross-section. */
    axis: 'tax' | 'stake';
    stake: number;
    taxRate: number;
    /** Room size — cuts only mix measurements of the same n. */
    n: number;
    /** Hovering the map previews another cut without moving the dials. */
    probeStake?: number | null;
    probeTax?: number | null;
  }

  let { axis, stake, taxRate, n, probeStake = null, probeTax = null }: Props = $props();

  let xLog = $state(false);
  let yLog = $state(false);

  const dial = $derived(axis === 'tax' ? Math.min(1, Math.max(0, taxRate)) : Math.min(1, Math.max(0, stake)));
  const fixedRequested = $derived(
    axis === 'tax'
      ? (probeStake ?? Math.min(1, Math.max(0, stake)))
      : (probeTax ?? Math.min(1, Math.max(0, taxRate))),
  );
  const probing = $derived(axis === 'tax' ? probeStake !== null : probeTax !== null);

  // the cut through the reader's own measured points, at the nearest
  // measured value of the OTHER dial
  const cut = $derived.by(() => {
    void phaseData.version;
    return curveVs(axis, fixedRequested, n);
  });

  const X_FLOOR = 0.001; // the smallest nonzero dial stop
  const yFloor = $derived.by(() => {
    let lo = 1;
    for (const p of cut.points) if (p.gini > 0 && p.gini < lo) lo = p.gini;
    return Math.min(Math.max(lo, 1e-3), 0.1);
  });

  const xAxis: AxisSpec = $derived({
    type: xLog ? 'log' : 'linear',
    lo: xLog ? X_FLOOR : 0,
    hi: 1,
    ticks: xLog ? logTicks(X_FLOOR, 1, 4) : niceLinearTicks(0, 1),
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
    for (const p of cut.points) {
      if ((xLog && p.v <= 0) || (yLog && p.gini <= 0)) continue;
      d += `${d === '' ? 'M' : 'L'} ${xOf(p.v).toFixed(1)} ${yOf(p.gini).toFixed(1)} `;
    }
    return d;
  }

  const other = $derived(axis === 'tax' ? 'stake' : 'tax');

  // closed-form limits (the only ones that exist): no tax → the yard sale
  // condenses to one owner (Gini → 1); no trades → the room stays equal.
  const theory = $derived.by(() => {
    if (axis === 'stake' && fixedRequested === 0) return { y: 1, label: 'theory: no tax → one owner' };
    if (axis === 'tax' && fixedRequested === 0) return { y: 0, label: 'theory: no trades → stays equal' };
    return null;
  });

  let hovered = $state(false);

  // hover insight: the Gini this cut predicts at the dial's exact position
  const atDial = $derived.by(() => {
    if (cut.points.length < 2) return null;
    let lower = cut.points[0];
    let upper = cut.points[cut.points.length - 1];
    for (const p of cut.points) {
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
    title={`Gini vs ${axis} — at ${cut.fixedUsed !== null ? percentNumber(cut.fixedUsed) + '% ' : 'your '}${other}`}
    description={`A cut through YOUR measured points: how the settled Gini responds to the ${axis} dial with the ${other} held fixed. Hover the map to preview other cuts.`}
    sharedZero={!xLog && !yLog}
    onHoverChange={(inside) => (hovered = inside)}
    ariaLabel={`Gini as a function of the ${axis} dial, cut through the measured phase points at ${other} ${percent(fixedRequested)}. Click an axis to toggle its scale.`}
  >
    {#snippet children({ xOf, yOf, frame })}
      {@const d = buildPath(xOf, yOf)}
      {#if theory}
        <line class="theory" x1={frame.x} y1={yOf(Math.max(theory.y, yLog ? yFloor : 0))} x2={frame.x + frame.w} y2={yOf(Math.max(theory.y, yLog ? yFloor : 0))} />
        <text class="theory-label" x={frame.x + frame.w - 3} y={yOf(Math.max(theory.y, yLog ? yFloor : 0)) + (theory.y > 0.5 ? 9 : -4)} text-anchor="end">{theory.label}</text>
      {/if}
      {#if d}
        <path class="curve" class:probing d={d} />
        {#each cut.points as p (p.v)}
          {#if !(xLog && p.v <= 0) && !(yLog && p.gini <= 0)}
            <circle class="pt" cx={xOf(p.v)} cy={yOf(p.gini)} r="2">
              <title>{axis} {percent(p.v)} → Gini {p.gini.toFixed(2)} ({p.count}×)</title>
            </circle>
          {/if}
        {/each}
      {:else}
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 - 5} text-anchor="middle">no measurements on this cut yet —</text>
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 + 6} text-anchor="middle">hold the dials and let a run settle</text>
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

  .curve.probing {
    stroke-dasharray: 3 2;
    opacity: 0.85;
  }

  .pt {
    fill: var(--accent-deep);
  }

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
  }

  .theory {
    stroke: var(--ink-mid);
    stroke-width: 1;
    stroke-dasharray: 6 4;
    opacity: 0.7;
  }

  .theory-label {
    fill: var(--ink-mid);
    font-size: 7.5px;
    font-style: italic;
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
