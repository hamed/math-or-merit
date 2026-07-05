<script lang="ts">
  import { roomPositions } from '../shared/layout';
  import { completedRoomRun } from '../shared/roomRun';
  import { latestRun } from '../shared/runLog.svelte';
  import { dollars } from '../shared/format';
  import { linearBins, toDollars } from './binning';
  import { REVEAL_SEED, REVEAL_TRADES, START_DOLLARS } from '../shared/presets';

  const VIEW_W = 480;
  const VIEW_H = 330;
  const BASELINE = 292;
  const PLOT_X = 24;
  const PLOT_W = VIEW_W - 2 * PLOT_X;

  // The room the reader just watched; the curated reveal room if they didn't run one.
  const fallback = completedRoomRun(REVEAL_SEED, REVEAL_TRADES);
  const run = $derived(latestRun() ?? fallback);
  const amounts = $derived(toDollars(run.wealth, START_DOLLARS));

  let phase = $state<'room' | 'sorted' | 'binned'>('room');
  let binCount = $state(8);

  const scatter = roomPositions(100, VIEW_W, 250, 22);
  const roomScale = 12 / Math.sqrt(1 / 100);

  const ranks = $derived.by(() => {
    const order = Array.from(amounts.keys()).sort((a, b) => amounts[a] - amounts[b]);
    const rank = new Array<number>(amounts.length);
    order.forEach((agent, r) => (rank[agent] = r));
    return rank;
  });

  const binning = $derived(linearBins(amounts, binCount));

  const stacked = $derived.by(() => {
    const colW = PLOT_W / binCount;
    const dotR = binCount <= 8 ? 4 : 3;
    const perRow = Math.max(3, Math.floor((colW - 8) / (2 * dotR + 1.6)));
    const seen = new Array<number>(binCount).fill(0);
    // Stable fill: place agents into their bin in rank order.
    const byRank = Array.from(amounts.keys()).sort((a, b) => ranks[a] - ranks[b]);
    const out = new Array<{ x: number; y: number }>(amounts.length);
    for (const agent of byRank) {
      const bin = binning.binOf[agent];
      const slot = seen[bin]++;
      const row = Math.floor(slot / perRow);
      const col = slot % perRow;
      out[agent] = {
        x: PLOT_X + bin * colW + colW / 2 + (col - (perRow - 1) / 2) * (2 * dotR + 1.6),
        y: BASELINE - dotR - 1.5 - row * (2 * dotR + 1.6),
      };
    }
    return { positions: out, dotR };
  });

  function dotTransform(i: number): string {
    if (phase === 'room') return `translate(${scatter[i].x}px, ${scatter[i].y + 20}px)`;
    if (phase === 'sorted') {
      const x = PLOT_X + (ranks[i] / (amounts.length - 1)) * PLOT_W;
      return `translate(${x}px, ${BASELINE - Math.max(1.4, dotRadius(i))}px)`;
    }
    const p = stacked.positions[i];
    return `translate(${p.x}px, ${p.y}px)`;
  }

  function dotRadius(i: number): number {
    if (phase === 'binned') return stacked.dotR;
    return Math.max(1.4, roomScale * Math.sqrt(run.wealth[i]));
  }

  const captions = {
    room: 'The room, as the trading left it. Try to compare any two of them.',
    sorted: 'Smallest to largest. Better — but a line of sizes is still not a picture you can read at a glance.',
    binned: 'Every circle becomes one head in a pile. The bars are the people you just watched.',
  } as const;
</script>

<div class="widget" aria-label="From circles to a histogram, step by step">
  <p class="kicker">Same people, better picture</p>

  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="One hundred circles sorted and stacked into wealth bins">
    {#if phase === 'binned'}
      {#each binning.counts as count, b}
        {@const colW = PLOT_W / binCount}
        <rect
          class="bar"
          x={PLOT_X + b * colW + 3}
          y={BASELINE - Math.max(2, count * 2.2)}
          width={colW - 6}
          height={Math.max(2, count * 2.2)}
          opacity="0.35"
        />
        {#if count > 0}
          <text class="count" x={PLOT_X + b * colW + colW / 2} y={BASELINE + 16} text-anchor="middle">{count}</text>
        {/if}
      {/each}
      <text class="tick" x={PLOT_X} y={BASELINE + 32} text-anchor="start">$0</text>
      <text class="tick" x={PLOT_X + PLOT_W} y={BASELINE + 32} text-anchor="end">{dollars(binning.edges[binCount])}</text>
    {/if}
    {#if phase !== 'room'}
      <line class="axis" x1={PLOT_X - 6} y1={BASELINE} x2={PLOT_X + PLOT_W + 6} y2={BASELINE} />
    {/if}
    {#each run.wealth as _, i}
      <circle
        class="dot"
        class:winner={i === run.winner}
        style={`transform: ${dotTransform(i)}`}
        r={dotRadius(i)}
      />
    {/each}
  </svg>

  <p class="caption" aria-live="polite">{captions[phase]}</p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={() => (phase = phase === 'room' ? 'sorted' : 'binned')} disabled={phase === 'binned'}>
      {phase === 'room' ? 'Sort them' : 'Stack them into piles'}
    </button>
    <button type="button" onclick={() => (phase = 'room')} disabled={phase === 'room'}>Scatter them back</button>
    {#if phase === 'binned'}
      <label class="bins-label">
        piles: {binCount}
        <input type="range" min="4" max="12" step="1" bind:value={binCount} aria-label="Number of bins" />
      </label>
    {/if}
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
    fill: rgb(189 98 69 / 34%);
    stroke: #96543c;
    stroke-width: 1;
    transition:
      transform 0.8s cubic-bezier(0.45, 0, 0.2, 1),
      r 0.8s cubic-bezier(0.45, 0, 0.2, 1);
  }

  .dot.winner {
    fill: rgb(139 63 43 / 55%);
    stroke: #4d271c;
    stroke-width: 1.6;
  }

  .bar {
    fill: #bd6245;
    transition: y 0.4s ease, height 0.4s ease, x 0.4s ease, width 0.4s ease;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1.2;
  }

  .count {
    fill: #756c5d;
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
  }

  .tick {
    fill: #756c5d;
    font-size: 11px;
  }

  .bins-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-inline-start: auto;
    font-size: 0.78rem;
    font-weight: 650;
    color: #5c5344;
  }

  input[type='range'] {
    accent-color: #8b3f2b;
  }
</style>
