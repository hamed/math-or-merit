<script lang="ts">
  import { roomPositions } from '../shared/layout';
  import { completedRoomRun } from '../shared/roomRun';
  import { latestRun } from '../shared/runLog.svelte';
  import { dollarsCompact } from '../shared/format';
  import { linearBins, toDollars } from './binning';
  import { decadeEdges, keepLabels, type RulerLabel } from './rulerLabels';
  import { assignStyles } from '../shared/agentStyle';
  import { DUST_DOLLARS, REVEAL_SEED, REVEAL_TRADES, ROOM_N, START_DOLLARS } from '../shared/presets';

  // Original circle coloring only — no shapes here (owner review 2026-07-08:
  // the histogram doesn't need the shape concept).
  const styles = assignStyles(ROOM_N);

  const VIEW_W = 480;
  // 336, not 330: the ruler hint sits at BASELINE + 38 and its descenders
  // were being cut off by the bottom of the box
  const VIEW_H = 336;
  const BASELINE = 292;
  const PLOT_X = 24;
  const PLOT_W = VIEW_W - 2 * PLOT_X;
  // The log ruler starts further in: the "≈ nothing" pile lives on the left.
  const LOG_X = 92;
  const LOG_W = VIEW_W - LOG_X - 26;
  const DOT_R = 4;
  const CELL = DOT_R * 2 + 1.2;

  // The room the reader just watched; the curated reveal room if they didn't run one.
  const fallback = completedRoomRun(REVEAL_SEED, REVEAL_TRADES);
  const run = $derived(latestRun() ?? fallback);
  const amounts = $derived(toDollars(run.wealth, START_DOLLARS));

  const PHASES = ['room', 'sorted', 'binned', 'log'] as const;
  type Phase = (typeof PHASES)[number];
  let phase = $state<Phase>('room');
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

  const maxAmount = $derived(Math.max(...amounts, START_DOLLARS));
  const topEdge = $derived(10 ** Math.ceil(Math.log10(maxAmount / DUST_DOLLARS) - 1e-9) * DUST_DOLLARS);

  function logXOf(amount: number): number | null {
    if (amount < DUST_DOLLARS) return null; // no spot on a multiplying ruler
    return LOG_X + (Math.log10(amount / DUST_DOLLARS) / Math.log10(topEdge / DUST_DOLLARS)) * LOG_W;
  }

  // Stack overlapping dots upward from the baseline (quantized beeswarm).
  const logPlaced = $derived.by(() => {
    const stacks = new Map<number, number>();
    const order = Array.from(amounts.keys()).sort((a, b) => amounts[a] - amounts[b]);
    const out = new Array<{ x: number; y: number; dust: boolean }>(amounts.length);
    let dustSeen = 0;
    for (const i of order) {
      const x = logXOf(amounts[i]);
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

  const dustCount = $derived(logPlaced.filter((p) => p.dust).length);
  const dustBoxH = $derived(Math.ceil(dustCount / 5) * CELL + 12);

  /**
   * One set of decade marks for BOTH rulers, keyed so the same elements move
   * when the ruler changes: on the ordinary ruler the small decades pile into
   * the first few pixels, and on the multiplying one they spread out evenly.
   * Watching them slide is the lesson, so they are never redrawn in between.
   */
  const decades = $derived(decadeEdges(DUST_DOLLARS, topEdge));
  const linearTop = $derived(binning.edges[binCount]);
  // 11px type in a 480-unit box; an estimate that errs wide only hides a label
  const CHAR_W = 6.4;
  const LABEL_GAP = 5;

  function linearXOf(amount: number): number {
    return PLOT_X + (Math.min(amount, linearTop) / linearTop) * PLOT_W;
  }

  const ruler = $derived.by(() => {
    const onLog = phase === 'log';
    const marks = decades.map((value, k) => ({
      key: `decade-${k}`,
      value,
      text: dollarsCompact(value),
      x: onLog ? (logXOf(value) ?? LOG_X) : linearXOf(value),
      // a decade past the ordinary ruler's end waits, invisible, at the end;
      // it slides into place when the multiplying ruler arrives
      onRuler: onLog || value <= linearTop * 1.0001,
    }));
    const candidates: RulerLabel[] = [];
    if (!onLog) {
      candidates.push({ key: 'zero', x: PLOT_X, text: '$0', priority: 0, anchor: 'start' });
      candidates.push({
        key: 'end',
        x: PLOT_X + PLOT_W,
        text: dollarsCompact(linearTop),
        priority: 1,
        anchor: 'end',
      });
    }
    // Largest decade first: on the ordinary ruler those are the only ones
    // with room, and they are the ones that make the crowding visible.
    const onScale = marks.filter((mark) => mark.onRuler);
    onScale.forEach((mark, index) =>
      candidates.push({
        key: mark.key,
        x: mark.x,
        text: mark.text,
        priority: 2 + (onScale.length - 1 - index),
        anchor: 'middle',
      }),
    );
    return { marks, shown: keepLabels(candidates, CHAR_W, LABEL_GAP) };
  });

  /**
   * Pile counts are read on demand, not printed under every bar: a row of
   * numbers along the baseline reads as the axis, which it is not.
   */
  let activeBin = $state<number | null>(null);

  function pileTop(bin: number): number {
    const count = binning.counts[bin];
    const colW = PLOT_W / binCount;
    const dotR = stacked.dotR;
    const perRow = Math.max(3, Math.floor((colW - 8) / (2 * dotR + 1.6)));
    const rows = Math.ceil(count / perRow);
    const dotsTop = BASELINE - 1.5 - dotR * 2 - Math.max(0, rows - 1) * (2 * dotR + 1.6);
    const barTop = BASELINE - Math.max(2, count * 2.2);
    return Math.min(dotsTop, barTop);
  }

  function pileLabel(bin: number): string {
    const count = binning.counts[bin];
    const from = dollarsCompact(binning.edges[bin]);
    const to = dollarsCompact(binning.edges[bin + 1]);
    return `${count} ${count === 1 ? 'person' : 'people'} from ${from} to ${to}`;
  }

  function togglePile(bin: number): void {
    activeBin = activeBin === bin ? null : bin;
  }

  function pileKey(event: KeyboardEvent, bin: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePile(bin);
    } else if (event.key === 'Escape') {
      activeBin = null;
    }
  }

  $effect(() => {
    // a count left showing from another ruler would label the wrong pile
    void phase;
    void binCount;
    activeBin = null;
  });

  function dotTransform(i: number): string {
    if (phase === 'room') return `translate(${scatter[i].x}px, ${scatter[i].y + 20}px)`;
    if (phase === 'sorted') {
      const x = PLOT_X + (ranks[i] / (amounts.length - 1)) * PLOT_W;
      return `translate(${x}px, ${BASELINE - Math.max(1.4, dotRadius(i))}px)`;
    }
    if (phase === 'binned') {
      const p = stacked.positions[i];
      return `translate(${p.x}px, ${p.y}px)`;
    }
    const p = logPlaced[i];
    return `translate(${p.x}px, ${p.y}px)`;
  }

  function dotRadius(i: number): number {
    if (phase === 'binned') return stacked.dotR;
    if (phase === 'log') return DOT_R;
    return Math.max(1.4, roomScale * Math.sqrt(run.wealth[i]));
  }

  const captions = {
    room: 'The room, as the trading left it. Try to compare any two of them.',
    sorted: 'Smallest to largest. Better — but a line of sizes is still not a picture you can read at a glance.',
    binned:
      'Every circle becomes one head in a pile. The richest circle sets the ruler; look at what that does to everybody else.',
    log: 'Change the ruler: every step now multiplies by ten. The crowd opens up — and a gap between dots means times more, not just more.',
  } as const;

  const nextLabel = {
    room: 'Sort them',
    sorted: 'Stack them into piles',
    binned: 'Change the ruler',
    log: null,
  } as const;

  function advance(): void {
    const i = PHASES.indexOf(phase);
    if (i < PHASES.length - 1) phase = PHASES[i + 1];
  }

  function back(): void {
    const i = PHASES.indexOf(phase);
    if (i > 0) phase = PHASES[i - 1];
  }
</script>

<div class="widget" aria-label="From scattered circles to a sorted, binned, log-ruled histogram — one stage">
  <p class="kicker">Same people, better picture</p>

  <svg
    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    role="group"
    aria-label="One hundred circles sorted, stacked into wealth bins, then spread on a multiplying ruler"
  >
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
      {/each}
      <text class="tick" class:hidden={!ruler.shown.has('zero')} x={PLOT_X} y={BASELINE + 20} text-anchor="start"
        >$0</text
      >
      <text
        class="tick"
        class:hidden={!ruler.shown.has('end')}
        x={PLOT_X + PLOT_W}
        y={BASELINE + 20}
        text-anchor="end">{dollarsCompact(linearTop)}</text
      >
    {/if}

    {#if phase === 'binned' || phase === 'log'}
      {#each ruler.marks as mark (mark.key)}
        <g class="decade" class:off-ruler={!mark.onRuler} style={`transform: translateX(${mark.x}px)`}>
          <line class="tickline" x1="0" y1={BASELINE} x2="0" y2={BASELINE + 6} />
          <text class="tick" class:hidden={!ruler.shown.has(mark.key)} x="0" y={BASELINE + 20} text-anchor="middle"
            >{mark.text}</text
          >
        </g>
      {/each}
    {/if}

    {#if phase === 'log'}
      <text class="hint" x={LOG_X + LOG_W / 2} y={BASELINE + 38} text-anchor="middle">each step to the right: ten times the money</text>
      <g class="dust-pile">
        <rect x="8" y={BASELINE - dustBoxH} width={5 * CELL + 16} height={dustBoxH} rx="8" />
        <text x="10" y={BASELINE + 20} text-anchor="start">≈ nothing</text>
        <text class="dust-sub" x="10" y={BASELINE + 34} text-anchor="start">below 1¢ · {dustCount} of them</text>
      </g>
    {/if}

    {#if phase !== 'room'}
      <line class="axis" x1={(phase === 'log' ? LOG_X : PLOT_X) - 6} y1={BASELINE} x2={VIEW_W - 18} y2={BASELINE} />
    {/if}

    {#each run.wealth as _, i}
      <circle
        class="dot"
        class:winner={i === run.winner}
        class:dust={phase === 'log' && logPlaced[i].dust}
        style={`transform: ${dotTransform(i)}; fill: ${styles[i].fill}; stroke: ${styles[i].stroke};`}
        r={dotRadius(i)}
      />
    {/each}

    {#if phase === 'binned'}
      {#each binning.counts as count, b}
        {@const colW = PLOT_W / binCount}
        <rect
          class="pile-hit"
          x={PLOT_X + b * colW}
          y="8"
          width={colW}
          height={BASELINE - 8}
          role="button"
          tabindex="0"
          aria-label={pileLabel(b)}
          aria-pressed={activeBin === b}
          onpointerenter={(event) => {
            if (event.pointerType === 'mouse') activeBin = b;
          }}
          onpointerleave={(event) => {
            if (event.pointerType === 'mouse' && activeBin === b) activeBin = null;
          }}
          onclick={() => togglePile(b)}
          onkeydown={(event) => pileKey(event, b)}
          onfocus={() => (activeBin = b)}
          onblur={() => {
            if (activeBin === b) activeBin = null;
          }}
        />
        {#if activeBin === b}
          <text class="count" x={PLOT_X + b * colW + colW / 2} y={pileTop(b) - 6} text-anchor="middle">{count}</text>
        {/if}
      {/each}
    {/if}
  </svg>

  <p class="caption" aria-live="polite">{captions[phase]}</p>

  <div class="toolbar">
    {#if nextLabel[phase]}
      <button class="primary" type="button" onclick={advance}>{nextLabel[phase]}</button>
    {/if}
    <button type="button" onclick={back} disabled={phase === 'room'}>Step back</button>
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
  }

  .dot {
    /* the pile columns take the pointer; a dot must not steal a hover */
    pointer-events: none;
    stroke-width: 1;
    fill-opacity: 0.8;
    transition:
      transform 0.8s cubic-bezier(0.45, 0, 0.2, 1),
      r 0.8s cubic-bezier(0.45, 0, 0.2, 1);
  }

  .dot.winner {
    stroke-width: 1.8;
  }

  .dot.dust {
    fill-opacity: 0.4;
  }

  .bar {
    fill: #bd6245;
    transition: y 0.4s ease, height 0.4s ease, x 0.4s ease, width 0.4s ease;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1.2;
  }

  .tickline {
    stroke: #a99980;
  }

  .count {
    fill: #3c352b;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  .tick {
    fill: #756c5d;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    transition: opacity 0.35s ease;
  }

  .tick.hidden {
    opacity: 0;
  }

  /* same easing as the dots, so ruler and people move as one */
  .decade {
    transition:
      transform 0.8s cubic-bezier(0.45, 0, 0.2, 1),
      opacity 0.4s ease;
  }

  .decade.off-ruler {
    opacity: 0;
  }

  .pile-hit {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }

  .pile-hit:focus-visible {
    stroke: #3c352b;
    stroke-width: 1.2;
    stroke-dasharray: 3 3;
  }

  @media (prefers-reduced-motion: reduce) {
    .decade,
    .tick {
      transition: none;
    }
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
