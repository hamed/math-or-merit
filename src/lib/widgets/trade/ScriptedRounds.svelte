<script lang="ts">
  import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
  import { ROOM_BETA } from '../shared/presets';

  // Every snapshot is produced by the actual trade rule — only the OUTCOMES
  // are authored. That keeps "roughly where they started" honest: at β = 0.2
  // the scripted win/lose-back path ends within ~3% of equal.
  interface Step {
    readonly wealth: readonly number[];
    readonly pair: readonly [number, number] | null;
    readonly winner: number | null;
    readonly caption: string;
  }

  const SCRIPT: readonly (readonly [number, number, string])[] = [
    // [winner, loser, caption]
    [0, 1, 'The left one wins a slice, and pulls ahead.'],
    [1, 0, 'Next trade, it loses the slice straight back. Even again.'],
    [2, 0, 'The right one takes a slice from the left…'],
    [0, 2, '…and gives it back the next round.'],
    [1, 2, 'One more each way…'],
    [2, 1, 'And look: everyone is roughly where they started. Win some, lose some.'],
  ];

  const steps: Step[] = (() => {
    const wealth = new Float64Array(3).fill(1 / 3);
    const out: Step[] = [
      {
        wealth: [...wealth],
        pair: null,
        winner: null,
        caption: 'Three of them, all equal. Remember: I am picking every outcome here, not a coin.',
      },
    ];
    for (const [winner, loser, caption] of SCRIPT) {
      applyYardSaleTrade(wealth, winner, loser, ROOM_BETA, true);
      out.push({ wealth: [...wealth], pair: [winner, loser], winner, caption });
    }
    return out;
  })();

  let index = $state(0);
  const step = $derived(steps[index]);

  const X = [120, 240, 360];
  const Y = 130;
  const RADIUS_K = 44 / Math.sqrt(1 / 3);
  const radius = (w: number) => RADIUS_K * Math.sqrt(w);
</script>

<div class="widget" aria-label="A few scripted trades that return to roughly equal">
  <p class="kicker">Scripted — no randomness on this one</p>

  <svg viewBox="0 0 480 230" role="img" aria-label="Three circles trading scripted slices and returning to roughly equal">
    {#each step.wealth as w, i}
      <circle
        class="agent"
        class:trading={step.pair !== null && (i === step.pair[0] || i === step.pair[1])}
        cx={X[i]}
        cy={Y}
        r={radius(w)}
      />
      {#if step.winner === i}
        <text class="mark win" x={X[i]} y={Y - radius(w) - 12} text-anchor="middle">+ wins</text>
      {:else if step.pair !== null && i === step.pair[1]}
        <text class="mark lose" x={X[i]} y={Y - radius(w) - 12} text-anchor="middle">− loses</text>
      {/if}
    {/each}
    {#if step.pair !== null}
      <path
        class="flow"
        d={`M ${X[step.pair[1]]} ${Y + 62} Q ${(X[step.pair[0]] + X[step.pair[1]]) / 2} ${Y + 96} ${X[step.pair[0]]} ${Y + 62}`}
        marker-end="url(#arrowhead)"
      />
    {/if}
    <defs>
      <marker id="arrowhead" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 z" fill="#8a6a2a" />
      </marker>
    </defs>
  </svg>

  <p class="caption" aria-live="polite">{step.caption}</p>

  <div class="toolbar">
    <button type="button" onclick={() => (index = Math.max(0, index - 1))} disabled={index === 0}>‹ Back</button>
    <button class="primary" type="button" onclick={() => (index = Math.min(steps.length - 1, index + 1))} disabled={index === steps.length - 1}>
      {index === 0 ? 'Run the first trade' : 'Next trade ›'}
    </button>
    <div class="dots" role="presentation">
      {#each steps as _, i}
        <span class="dot" class:active={i === index}></span>
      {/each}
    </div>
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

  .agent {
    fill: rgb(189 98 69 / 26%);
    stroke: #96543c;
    stroke-width: 1.6;
    transition: r 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .agent.trading {
    stroke: #4d271c;
    stroke-width: 2.4;
  }

  .mark {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .mark.win {
    fill: #4a6b34;
  }

  .mark.lose {
    fill: #8b3f2b;
  }

  .flow {
    fill: none;
    stroke: #8a6a2a;
    stroke-width: 2;
    stroke-dasharray: 5 4;
  }

  .dots {
    display: flex;
    gap: 0.4rem;
    margin-inline-start: auto;
  }

  .dot {
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-radius: 50%;
    background: #d8cdb9;
  }

  .dot.active {
    background: #8b3f2b;
  }
</style>
