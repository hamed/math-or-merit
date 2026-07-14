<script lang="ts">
  import { dollarsCompact, dollarsPow10, percent } from '../shared/format';
  import { StickyRange } from './histBins';
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

  const W = 170;
  const H = 170;
  const PLOT = { x: 34, y: 18, w: W - 42, h: H - 48 };

  // canonical: log-log, the Pareto-tail view (owner review 2026-07-14)
  let xLog = $state(true);
  let yLog = $state(true);

  // $1 … two orders above the starting money, sticky to the data after that
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
    return range.update(Math.max(1e-9, lo), hi, performance.now());
  });

  const yFloor = $derived(1 / Math.max(2, sorted.n)); // one agent's worth

  function xOf(d: number): number {
    const { lo, hi } = bounds;
    if (xLog) {
      const t = (Math.log10(Math.max(d, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo) || 1);
      return PLOT.x + Math.max(0, Math.min(1, t)) * PLOT.w;
    }
    return PLOT.x + Math.max(0, Math.min(1, d / hi)) * PLOT.w;
  }

  function yOf(fraction: number): number {
    if (yLog) {
      if (fraction <= 0) return PLOT.y + PLOT.h; // zero has no log home
      const t = (Math.log10(fraction) - Math.log10(yFloor)) / (0 - Math.log10(yFloor) || 1);
      return PLOT.y + PLOT.h - Math.max(0, Math.min(1, t)) * PLOT.h;
    }
    return PLOT.y + PLOT.h - fraction * PLOT.h;
  }

  // survival staircase: everyone included, so the curve starts at 1
  const path = $derived.by(() => {
    const { dollars, n } = sorted;
    if (dollars.length === 0) return '';
    let d = `M ${PLOT.x.toFixed(1)} ${yOf(dollars.length / n).toFixed(1)}`;
    for (let i = 0; i < dollars.length; i++) {
      const above = (dollars.length - (i + 1)) / n;
      d += ` H ${xOf(dollars[i]).toFixed(1)}`;
      if (above > 0 || !yLog) d += ` V ${yOf(above).toFixed(1)}`;
    }
    return d;
  });

  // a few x ticks, enough for range and scale
  const xTicks = $derived.by(() => {
    const { lo, hi } = bounds;
    if (!xLog) return [0, hi / 2, hi].map((v) => ({ v, label: dollarsCompact(v) }));
    const eLo = Math.ceil(Math.log10(lo) - 1e-9);
    const eHi = Math.floor(Math.log10(hi) + 1e-9);
    const step = Math.max(1, Math.ceil((eHi - eLo) / 3));
    const out: { v: number; label: string }[] = [];
    for (let e = eLo; e <= eHi; e += step) out.push({ v: 10 ** e, label: dollarsPow10(10 ** e) });
    return out;
  });

  const yTicks = $derived.by(() => {
    if (!yLog) return [0, 0.5, 1];
    const out: number[] = [];
    for (let f = 1; f >= yFloor - 1e-12; f /= 10) out.push(f);
    return out.slice(0, 4);
  });

  const toggleY = gatedClick(() => (yLog = !yLog));
  const toggleX = gatedClick(() => (xLog = !xLog));
</script>

<svg
  viewBox={`0 0 ${W} ${H}`}
  class="ccdf"
  role="img"
  aria-label={`Survival curve, ${xLog ? 'log' : 'linear'}-${yLog ? 'log' : 'linear'}: the share of the room holding more than each amount. Click an axis to toggle its scale.`}
>
  <line class="axis" x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x + PLOT.w} y2={PLOT.y + PLOT.h} />
  <line class="axis" x1={PLOT.x} y1={PLOT.y} x2={PLOT.x} y2={PLOT.y + PLOT.h} />
  {#each yTicks as f}
    <line class="grid" x1={PLOT.x} y1={yOf(f)} x2={PLOT.x + PLOT.w} y2={yOf(f)} />
    <text class="tick" x={PLOT.x - 3} y={yOf(f) + 3} text-anchor="end">{percent(f)}</text>
  {/each}
  {#each xTicks as t}
    <text class="tick" x={xOf(t.v)} y={PLOT.y + PLOT.h + 11} text-anchor="middle">{t.label}</text>
  {/each}
  {#if path}
    <path class="line" d={path} />
  {/if}
  <text class="label" x={PLOT.x + 4} y={PLOT.y - 6} text-anchor="start">holding more than x</text>
  <text class="label" x={PLOT.x + PLOT.w} y={H - 5} text-anchor="end">wealth (${xLog ? ', log' : ''})</text>

  <!-- axis hit zones: click toggles that axis (site convention) -->
  <rect class="hit" x="0" y="0" width={PLOT.x} height={PLOT.y + PLOT.h} onclick={toggleY} role="button" tabindex="-1" aria-label="Toggle the people axis between log and linear"><title>log ↔ linear</title></rect>
  <rect class="hit" x={PLOT.x} y={PLOT.y + PLOT.h} width={PLOT.w} height={H - PLOT.y - PLOT.h} onclick={toggleX} role="button" tabindex="-1" aria-label="Toggle the wealth axis between log and linear"><title>log ↔ linear</title></rect>
</svg>

<style>
  .ccdf {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1;
  }

  .grid {
    stroke: rgb(169 153 128 / 30%);
    stroke-width: 0.7;
  }

  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  .tick {
    fill: var(--ink-soft);
    font-size: 8px;
    font-variant-numeric: tabular-nums;
  }

  .label {
    fill: var(--ink-soft);
    font-size: 9px;
    letter-spacing: 0.04em;
  }

  .hit {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }
</style>
