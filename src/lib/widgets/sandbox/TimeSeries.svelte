<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { STROKES } from '../shared/agentStyle';
  import { compactNumber, logTicks, niceLinearTicks, percentNumber } from './ticks';
  import { gatedClick } from './gatedClick';
  import type { RoundSeries, SandboxWorld } from './SandboxWorld';

  interface Props {
    world: SandboxWorld;
    revision?: number;
  }

  let { world, revision = 0 }: Props = $props();

  // one panel, three academic time views — a click on the body cycles them.
  // All anchored at round 1 (log 0), never a moving window (owner review
  // 2026-07-14). Round-number time labels slide in and out as the run grows.
  const MODES = ['inequality', 'agents', 'volume'] as const;
  type Mode = (typeof MODES)[number];
  let mode = $state<Mode>('inequality');
  let xLog = $state(false);
  const yLogByMode = $state<Record<Mode, boolean>>({ inequality: false, agents: true, volume: false });

  const agentColors = Object.values(STROKES);

  // world is a class instance — its properties are not reactive; every read
  // must go through a revision-keyed derived
  const actualRounds = $derived.by(() => {
    void revision;
    return world.rounds;
  });
  const rounds = $derived(Math.max(2, actualRounds));

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

  const yLog = $derived(yLogByMode[mode]);

  const xAxis: AxisSpec = $derived({
    type: xLog ? 'log' : 'linear',
    lo: xLog ? 1 : 0,
    hi: rounds,
    ticks: xLog ? logTicks(1, rounds) : niceLinearTicks(0, rounds).filter((t) => t > 0),
    format: compactNumber,
    label: 'round',
    onToggle: gatedClick(() => (xLog = !xLog)),
  });

  const yAxis: AxisSpec = $derived.by(() => {
    const { yMax, yMinPos } = view;
    const percentish = mode === 'inequality';
    return {
      type: yLog ? ('log' as const) : ('linear' as const),
      lo: yLog ? yMinPos : 0,
      hi: yMax,
      ticks: yLog ? logTicks(yMinPos, yMax) : niceLinearTicks(0, yMax),
      format: percentish ? percentNumber : compactNumber,
      label: percentish ? '%' : '$',
      onToggle: gatedClick(() => (yLogByMode[mode] = !yLogByMode[mode])),
    };
  });

  function pathOf(s: RoundSeries, xOf: (v: number) => number, yOf: (v: number) => number): string {
    const vals = s.values;
    if (vals.length === 0) return '';
    let d = '';
    for (let i = 0; i < vals.length; i++) {
      if (yLog && vals[i] <= 0) continue; // zeros have no log home
      d += `${d === '' ? 'M' : 'L'} ${xOf(s.roundOf(i)).toFixed(1)} ${yOf(vals[i]).toFixed(1)} `;
    }
    return d;
  }

  const titles: Record<Mode, string> = {
    inequality: 'Gini — top share ┄',
    agents: 'each agent',
    volume: 'won per round',
  };

  const cycleMode = gatedClick(() => (mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length]));
</script>

<PlotFrame
  x={xAxis}
  y={yAxis}
  title={titles[mode]}
  onBody={cycleMode}
  bodyTooltip="next view"
  ariaLabel={`${titles[mode]} over ${actualRounds} rounds, anchored at round one. Click the body for the next view, an axis to toggle its scale.`}
>
  {#snippet children({ xOf, yOf, frame })}
    {#if actualRounds > 1}
      {#each view.list as { s, color, dash }}
        <path class="line" d={pathOf(s, xOf, yOf)} stroke={color} stroke-dasharray={dash ?? 'none'} />
      {/each}
    {:else}
      <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2} text-anchor="middle">no rounds yet</text>
    {/if}
  {/snippet}
</PlotFrame>

<style>
  .line {
    fill: none;
    stroke-width: 1.3;
    stroke-linejoin: round;
    opacity: 0.9;
  }

  .empty {
    fill: var(--ink-soft);
    font-size: 8.5px;
    font-family: var(--font-sans);
  }
</style>
