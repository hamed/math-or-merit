<script lang="ts">
  import { dollarsCompact, percent } from '../shared/format';
  import { STROKES } from '../shared/agentStyle';
  import { gatedClick } from './gatedClick';
  import type { RoundSeries, SandboxWorld } from './SandboxWorld';

  interface Props {
    world: SandboxWorld;
    revision?: number;
  }

  let { world, revision = 0 }: Props = $props();

  const W = 170;
  const H = 170;
  const PLOT = { x: 34, y: 18, w: W - 42, h: H - 48 };

  // one panel, three academic time views — a click on the body cycles them.
  // All anchored at round 1, never a moving window (owner review 2026-07-14).
  const MODES = ['inequality', 'agents', 'volume'] as const;
  type Mode = (typeof MODES)[number];
  let mode = $state<Mode>('inequality');
  let xLog = $state(false);
  const yLogByMode = $state<Record<Mode, boolean>>({ inequality: false, agents: true, volume: false });

  const agentColors = Object.values(STROKES);

  const rounds = $derived.by(() => {
    void revision;
    return world.rounds;
  });

  function seriesFor(m: Mode): { s: RoundSeries; color: string; dash?: string }[] {
    if (m === 'inequality') {
      return [
        { s: world.giniSeries, color: 'var(--accent)' },
        { s: world.topShareSeries, color: 'var(--ink-mid)', dash: '4 3' },
      ];
    }
    if (m === 'agents') {
      return world.agentSeries.map((s, k) => ({ s, color: agentColors[k % agentColors.length] }));
    }
    return [{ s: world.volumeSeries, color: 'var(--accent)' }];
  }

  const view = $derived.by(() => {
    void revision;
    const list = seriesFor(mode);
    let yMax = 0;
    let yMinPos = Infinity;
    for (const { s } of list) {
      for (const v of s.values) {
        if (v > yMax) yMax = v;
        if (v > 0 && v < yMinPos) yMinPos = v;
      }
    }
    if (mode === 'inequality') yMax = 1;
    if (!(yMax > 0)) yMax = 1;
    if (!Number.isFinite(yMinPos)) yMinPos = yMax / 10;
    return { list, yMax, yMinPos: Math.min(yMinPos, yMax / 10) };
  });

  function xOf(round: number): number {
    const total = Math.max(2, rounds);
    if (xLog) {
      const t = Math.log10(Math.max(1, round)) / (Math.log10(total) || 1);
      return PLOT.x + Math.max(0, Math.min(1, t)) * PLOT.w;
    }
    return PLOT.x + (round / total) * PLOT.w;
  }

  function yOf(v: number): number {
    const { yMax, yMinPos } = view;
    if (yLogByMode[mode]) {
      if (v <= 0) return PLOT.y + PLOT.h; // zeros excluded from a log axis
      const t = (Math.log10(v) - Math.log10(yMinPos)) / (Math.log10(yMax) - Math.log10(yMinPos) || 1);
      return PLOT.y + PLOT.h - Math.max(0, Math.min(1, t)) * PLOT.h;
    }
    return PLOT.y + PLOT.h - Math.max(0, Math.min(1, v / yMax)) * PLOT.h;
  }

  function pathOf(s: RoundSeries): string {
    const vals = s.values;
    if (vals.length === 0) return '';
    let d = '';
    for (let i = 0; i < vals.length; i++) {
      if (yLogByMode[mode] && vals[i] <= 0) continue;
      d += `${d === '' ? 'M' : 'L'} ${xOf(s.roundOf(i)).toFixed(1)} ${yOf(vals[i]).toFixed(1)} `;
    }
    return d;
  }

  const yTickLabel = (v: number) => (mode === 'inequality' ? percent(v) : dollarsCompact(v));

  const yTicks = $derived.by(() => {
    const { yMax, yMinPos } = view;
    if (yLogByMode[mode]) {
      const out: number[] = [];
      for (let e = Math.ceil(Math.log10(yMax)); e >= Math.log10(yMinPos) - 1e-9 && out.length < 3; e--) out.push(10 ** e);
      return out;
    }
    return mode === 'inequality' ? [0, 0.5, 1] : [0, yMax];
  });

  const titles: Record<Mode, string> = {
    inequality: 'Gini — top share ┄',
    agents: 'each agent, $',
    volume: 'won per round, $',
  };

  const cycleMode = gatedClick(() => (mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]));
  const toggleY = gatedClick(() => (yLogByMode[mode] = !yLogByMode[mode]));
  const toggleX = gatedClick(() => (xLog = !xLog));
</script>

<svg
  viewBox={`0 0 ${W} ${H}`}
  class="timeseries"
  role="img"
  aria-label={`${titles[mode]} over ${rounds} rounds, anchored at round one. Click the body for the next view, an axis to toggle its scale.`}
>
  <line class="axis" x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x + PLOT.w} y2={PLOT.y + PLOT.h} />
  <line class="axis" x1={PLOT.x} y1={PLOT.y} x2={PLOT.x} y2={PLOT.y + PLOT.h} />

  {#each yTicks as t}
    <line class="grid" x1={PLOT.x} y1={yOf(t)} x2={PLOT.x + PLOT.w} y2={yOf(t)} />
    <text class="tick" x={PLOT.x - 3} y={yOf(t) + 3} text-anchor="end">{yTickLabel(t)}</text>
  {/each}

  {#if rounds > 1}
    {#each view.list as { s, color, dash }}
      <path class="line" d={pathOf(s)} stroke={color} stroke-dasharray={dash ?? 'none'} />
    {/each}
    <text class="tick" x={PLOT.x} y={PLOT.y + PLOT.h + 11} text-anchor="start">1</text>
    <text class="tick" x={PLOT.x + PLOT.w} y={PLOT.y + PLOT.h + 11} text-anchor="end">{rounds.toLocaleString('en-US')}</text>
  {:else}
    <text class="empty" x={PLOT.x + PLOT.w / 2} y={PLOT.y + PLOT.h / 2} text-anchor="middle">no rounds yet</text>
  {/if}

  <text class="label" x={PLOT.x + 4} y={PLOT.y - 6} text-anchor="start">{titles[mode]}</text>
  <text class="label" x={PLOT.x + PLOT.w} y={H - 5} text-anchor="end">round{xLog ? ' (log)' : ''}</text>

  <!-- convention: body cycles the view; each axis toggles its own scale -->
  <rect class="hit" x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} onclick={cycleMode} role="button" tabindex="-1" aria-label="Show the next time view"><title>next view</title></rect>
  <rect class="hit" x="0" y="0" width={PLOT.x} height={PLOT.y + PLOT.h} onclick={toggleY} role="button" tabindex="-1" aria-label="Toggle the value axis between log and linear"><title>log ↔ linear</title></rect>
  <rect class="hit" x={PLOT.x} y={PLOT.y + PLOT.h} width={PLOT.w} height={H - PLOT.y - PLOT.h} onclick={toggleX} role="button" tabindex="-1" aria-label="Toggle the round axis between log and linear"><title>log ↔ linear</title></rect>
</svg>

<style>
  .timeseries {
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
    stroke-width: 1.3;
    stroke-linejoin: round;
    opacity: 0.9;
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

  .empty {
    fill: var(--ink-soft);
    font-size: 8.5px;
  }

  .hit {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }
</style>
