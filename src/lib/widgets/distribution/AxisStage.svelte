<script lang="ts">
  import { completedRoomRun } from '../shared/roomRun';
  import { latestRun } from '../shared/runLog.svelte';
  import { dollars } from '../shared/format';
  import { toDollars } from './binning';
  import { DUST_DOLLARS, REVEAL_SEED, REVEAL_TRADES, START_DOLLARS } from '../shared/presets';

  const VIEW_W = 480;
  const VIEW_H = 300;
  const BASELINE = 240;
  const PLOT_X = 92; // leaves room for the "≈ nothing" pile on the start side
  const PLOT_W = VIEW_W - PLOT_X - 26;
  const DOT_R = 4;
  const CELL = DOT_R * 2 + 1.2;

  const fallback = completedRoomRun(REVEAL_SEED, REVEAL_TRADES);
  const run = $derived(latestRun() ?? fallback);
  const amounts = $derived(toDollars(run.wealth, START_DOLLARS));

  let ruler = $state<'linear' | 'log'>('linear');

  const maxAmount = $derived(Math.max(...amounts, START_DOLLARS));
  const topEdge = $derived(10 ** Math.ceil(Math.log10(maxAmount / DUST_DOLLARS) - 1e-9) * DUST_DOLLARS);

  function xOf(amount: number, mode: 'linear' | 'log'): number | null {
    if (mode === 'linear') return PLOT_X + (amount / maxAmount) * PLOT_W;
    if (amount < DUST_DOLLARS) return null; // no spot on a multiplying ruler
    return PLOT_X + (Math.log10(amount / DUST_DOLLARS) / Math.log10(topEdge / DUST_DOLLARS)) * PLOT_W;
  }

  // Stack overlapping dots upward from the baseline (quantized beeswarm).
  const placed = $derived.by(() => {
    const stacks = new Map<number, number>();
    const order = Array.from(amounts.keys()).sort((a, b) => amounts[a] - amounts[b]);
    const out = new Array<{ x: number; y: number; dust: boolean }>(amounts.length);
    let dustSeen = 0;
    for (const i of order) {
      const x = xOf(amounts[i], ruler);
      if (x === null) {
        const slot = dustSeen++;
        out[i] = {
          x: 18 + (slot % 5) * CELL,
          y: BASELINE - DOT_R - 1 - Math.floor(slot / 5) * CELL,
          dust: true,
        };
        continue;
      }
      const cell = Math.round(x / CELL);
      const level = stacks.get(cell) ?? 0;
      stacks.set(cell, level + 1);
      out[i] = { x: cell * CELL, y: BASELINE - DOT_R - 1 - level * CELL, dust: false };
    }
    return out;
  });

  const dustCount = $derived(placed.filter((p) => p.dust).length);

  const logTicks = $derived.by(() => {
    const ticks: { x: number; label: string }[] = [];
    for (let edge = DUST_DOLLARS; edge <= topEdge * 1.0001; edge *= 10) {
      const x = xOf(edge, 'log');
      if (x !== null) ticks.push({ x, label: dollars(edge) });
    }
    return ticks;
  });

  const linearTicks = $derived([
    { x: PLOT_X, label: '$0' },
    { x: PLOT_X + PLOT_W / 2, label: dollars(maxAmount / 2) },
    { x: PLOT_X + PLOT_W, label: dollars(maxAmount) },
  ]);

  const ticks = $derived(ruler === 'linear' ? linearTicks : logTicks);
</script>

<div class="widget" aria-label="The same room on an adding ruler and a multiplying ruler">
  <p class="kicker">Change the ruler, not the people</p>

  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="One hundred dots on a wealth axis; switching to a log ruler spreads the crushed crowd apart">
    <line class="axis" x1={PLOT_X - 4} y1={BASELINE} x2={PLOT_X + PLOT_W + 8} y2={BASELINE} />
    {#each ticks as tick (tick.label)}
      <line class="tickline" x1={tick.x} y1={BASELINE} x2={tick.x} y2={BASELINE + 6} />
      <text class="tick" x={tick.x} y={BASELINE + 20} text-anchor="middle">{tick.label}</text>
    {/each}
    {#if ruler === 'log'}
      <text class="hint" x={PLOT_X + PLOT_W / 2} y={BASELINE + 40} text-anchor="middle">each step to the right: ten times the money</text>
      <g class="dust-pile">
        <rect x="8" y={BASELINE - 118} width={5 * CELL + 16} height="118" rx="8" />
        <text x="10" y={BASELINE + 20} text-anchor="start">≈ nothing</text>
        <text class="dust-sub" x="10" y={BASELINE + 34} text-anchor="start">below 1¢ · {dustCount} of them</text>
      </g>
    {/if}
    {#each placed as p, i}
      <circle
        class="dot"
        class:winner={i === run.winner}
        class:dust={p.dust}
        style={`transform: translate(${p.x}px, ${p.y}px)`}
        r={DOT_R}
      />
    {/each}
  </svg>

  <p class="caption" aria-live="polite">
    {#if ruler === 'linear'}
      Every step to the right adds the same amount. The winner needs the whole ruler — everyone else shares a sliver.
    {:else}
      Every step multiplies by ten. Now the crowd opens up — and a gap between dots means <em>times</em> more, not just more.
    {/if}
  </p>

  <div class="toolbar" role="group" aria-label="Choose the ruler">
    <button type="button" class:primary={ruler === 'linear'} aria-pressed={ruler === 'linear'} onclick={() => (ruler = 'linear')}>
      Adding ruler
    </button>
    <button type="button" class:primary={ruler === 'log'} aria-pressed={ruler === 'log'} onclick={() => (ruler = 'log')}>
      Multiplying ruler
    </button>
  </div>
</div>

<style>
  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
    border: 1px solid #d8cdb9;
    border-radius: 0.9rem;
    background:
      radial-gradient(circle at 30% 20%, rgb(255 255 255 / 55%), transparent 60%),
      #fbf6ea;
  }

  .dot {
    fill: rgb(189 98 69 / 40%);
    stroke: #96543c;
    stroke-width: 1;
    transition: transform 0.9s cubic-bezier(0.45, 0, 0.2, 1);
  }

  .dot.winner {
    fill: rgb(139 63 43 / 60%);
    stroke: #4d271c;
    stroke-width: 1.6;
  }

  .dot.dust {
    fill: rgb(110 85 62 / 45%);
    stroke: #8a7a64;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1.2;
  }

  .tickline {
    stroke: #a99980;
  }

  .tick {
    fill: #756c5d;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .hint {
    fill: #8b3f2b;
    font-size: 11px;
    font-style: italic;
  }

  .dust-pile rect {
    fill: rgb(110 85 62 / 7%);
    stroke: #b3a58c;
    stroke-dasharray: 5 4;
  }

  .dust-pile text {
    fill: #756c5d;
    font-size: 11px;
    font-weight: 700;
  }

  .dust-pile .dust-sub {
    font-size: 9.5px;
    font-weight: 400;
  }
</style>
