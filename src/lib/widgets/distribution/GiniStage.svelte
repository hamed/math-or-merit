<script lang="ts">
  import { giniCoefficient, lorenzCurve } from '$lib/research';
  import { completedRoomRun } from '../shared/roomRun';
  import { latestRun } from '../shared/runLog.svelte';
  import { assignStyles } from '../shared/agentStyle';
  import { lorenzGapPath, lorenzLinePath } from '../shared/lorenzPath';
  import { percent } from '../shared/format';
  import { REVEAL_SEED, REVEAL_TRADES, ROOM_N } from '../shared/presets';

  const VIEW_W = 480;
  const VIEW_H = 360;
  const FRAME = { x: 84, y: 300, size: 252 };

  // The room the reader just watched; the curated reveal room as fallback.
  const fallback = completedRoomRun(REVEAL_SEED, REVEAL_TRADES);
  const run = $derived(latestRun() ?? fallback);

  const styles = assignStyles(ROOM_N);

  type Phase = 'lineup' | 'curve' | 'equal' | 'gap';
  const PHASES: readonly Phase[] = ['lineup', 'curve', 'equal', 'gap'];
  let phase = $state<Phase>('lineup');
  const phaseIndex = $derived(PHASES.indexOf(phase));

  // Sort agents poorest → richest; x = population percentile.
  const order = $derived(Array.from(run.wealth.keys()).sort((a, b) => run.wealth[a] - run.wealth[b]));
  const points = $derived(lorenzCurve(run.wealth));
  const gini = $derived(giniCoefficient(run.wealth));

  const curvePath = $derived(lorenzLinePath(points, FRAME));
  const gapPath = $derived(lorenzGapPath(points, FRAME));

  const dotR = 3.2;

  const captions: Record<Phase, string> = {
    lineup: 'Everyone in one line, poorest to richest, equally spaced. Size is still money.',
    curve: 'Walk the line and add up what you have passed. The curve is the running total: it crawls, then leaps at the rich end.',
    equal: 'If everyone held the same, the running total would climb this straight line instead.',
    gap: 'The gap between the two is the inequality. Twice that shaded share is one number: the Gini.',
  };
</script>

<div class="widget" aria-label="Building the Gini number from the room, step by step">
  <p class="kicker">One number for a whole room</p>

  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={`Lorenz curve of the room; the shaded gap gives a Gini of ${gini.toFixed(2)}`}>
    <!-- axes appear from the curve phase on -->
    {#if phaseIndex >= 1}
      <g class="axes">
        <line x1={FRAME.x} y1={FRAME.y} x2={FRAME.x + FRAME.size} y2={FRAME.y} />
        <line x1={FRAME.x} y1={FRAME.y} x2={FRAME.x} y2={FRAME.y - FRAME.size} />
        <text class="axis-label" x={FRAME.x + FRAME.size / 2} y={FRAME.y + 40} text-anchor="middle">share of people</text>
        <text class="axis-label rotated" x={FRAME.x - 40} y={FRAME.y - FRAME.size / 2} text-anchor="middle">share of money</text>
        <text class="tick" x={FRAME.x} y={FRAME.y + 24} text-anchor="middle">0%</text>
        <text class="tick" x={FRAME.x + FRAME.size} y={FRAME.y + 24} text-anchor="middle">100%</text>
      </g>
    {/if}

    {#if phaseIndex >= 3}
      <path class="gap" d={gapPath} />
    {/if}

    {#if phaseIndex >= 2}
      <line class="equal" x1={FRAME.x} y1={FRAME.y} x2={FRAME.x + FRAME.size} y2={FRAME.y - FRAME.size} />
      <text class="equal-label" x={FRAME.x + FRAME.size * 0.44} y={FRAME.y - FRAME.size * 0.52} text-anchor="middle">everyone equal</text>
    {/if}

    {#if phaseIndex >= 1}
      <path class="curve" d={curvePath} />
    {/if}

    <!-- the people: sorted along the population axis -->
    {#each order as agent, rank (agent)}
      {@const x = FRAME.x + ((rank + 1) / order.length) * FRAME.size}
      {@const lifted = phaseIndex >= 1}
      {@const y = lifted ? FRAME.y - points[rank + 1].wealthShare * FRAME.size : FRAME.y - dotR - 1}
      <circle
        class="dot"
        class:winner={agent === run.winner}
        style={`transform: translate(${x}px, ${y}px); fill: ${styles[agent].fill}; stroke: ${styles[agent].stroke};`}
        r={agent === run.winner ? dotR + 1.4 : dotR}
      />
    {/each}

    {#if phaseIndex >= 3}
      <text class="gini-readout" x={FRAME.x + FRAME.size * 0.62} y={FRAME.y - FRAME.size * 0.22} text-anchor="middle">
        Gini = {gini.toFixed(2)}
      </text>
      <text class="gini-scale" x={FRAME.x + FRAME.size * 0.62} y={FRAME.y - FRAME.size * 0.22 + 18} text-anchor="middle">
        0 = all equal · 1 = one owns all
      </text>
    {/if}
  </svg>

  <p class="caption" aria-live="polite">{captions[phase]}</p>

  <div class="toolbar">
    <button type="button" onclick={() => (phase = PHASES[Math.max(0, phaseIndex - 1)])} disabled={phaseIndex === 0}>‹ Back</button>
    <button class="primary" type="button" onclick={() => (phase = PHASES[Math.min(PHASES.length - 1, phaseIndex + 1)])} disabled={phaseIndex === PHASES.length - 1}>
      {phase === 'lineup' ? 'Add up as you go' : phase === 'curve' ? 'Draw the equal line' : 'Shade the gap'}
    </button>
    {#if phaseIndex >= 3}
      <output>this room: {gini.toFixed(2)} — top holds {percent(run.topShare)}</output>
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
    stroke-width: 1;
    fill-opacity: 0.8;
    transition: transform 0.9s cubic-bezier(0.45, 0, 0.2, 1);
  }

  .dot.winner {
    stroke-width: 1.8;
  }

  .axes line {
    stroke: #a99980;
    stroke-width: 1.2;
  }

  .axis-label {
    fill: var(--ink-soft);
    font-size: 11.5px;
  }

  .axis-label.rotated {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  .tick {
    fill: var(--ink-soft);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
  }

  .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.4;
    stroke-linejoin: round;
  }

  .equal {
    stroke: var(--ink-mid);
    stroke-width: 1.6;
    stroke-dasharray: 6 5;
  }

  .equal-label {
    fill: var(--ink-mid);
    font-size: 11px;
    font-style: italic;
  }

  .gap {
    fill: var(--accent);
    fill-opacity: 0.14;
    stroke: none;
  }

  .gini-readout {
    fill: var(--accent-deep);
    font-size: 19px;
    font-weight: 700;
  }

  .gini-scale {
    fill: var(--ink-soft);
    font-size: 10.5px;
  }
</style>
