<script lang="ts">
  import { onMount } from 'svelte';
  import { applyYardSaleTrade } from '$lib/sim/internal/YardSaleTrade';
  import { ROOM_BETA } from '../shared/presets';

  const N = 13;
  const VIEW_W = 480;
  const VIEW_H = 300;
  const CENTER_X = VIEW_W / 2;
  const FOCUS_Y = 168;
  const FOCUS_LEFT = { x: 150, y: FOCUS_Y };
  const FOCUS_RIGHT = { x: 330, y: FOCUS_Y };
  const RADIUS_K = 26 / Math.sqrt(1 / N);

  const wealth = new Float64Array(N).fill(1 / N);

  type Phase = 'idle' | 'picked' | 'staked' | 'flipping' | 'settled';

  let phase = $state<Phase>('idle');
  let pair = $state<[number, number] | null>(null);
  let stake = $state(0);
  let potVisible = $state(false);
  let potAt = $state<'table' | 'left' | 'right'>('table');
  let coinFace = $state<'?' | 'H' | 'T'>('?');
  let coinSpinning = $state(false);
  let tradesDone = $state(0);
  let revision = $state(0);
  let caption = $state('Thirteen of them, mid-room. Everyone still equal.');

  let generation = 0;
  onMount(() => () => {
    generation++;
  });

  const ringPositions = Array.from({ length: N }, (_, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: CENTER_X + Math.cos(angle) * 195, y: 158 + Math.sin(angle) * 118 };
  });

  function radius(i: number): number {
    void revision;
    let w = wealth[i];
    if (pair && phase !== 'idle' && phase !== 'picked' && potAt === 'table' && (i === pair[0] || i === pair[1])) {
      w -= stake; // the ante is sitting on the table
    }
    return RADIUS_K * Math.sqrt(Math.max(0, w));
  }

  function positionOf(i: number): { x: number; y: number } {
    if (pair && (phase !== 'idle')) {
      if (i === pair[0]) return FOCUS_LEFT;
      if (i === pair[1]) return FOCUS_RIGHT;
    }
    return ringPositions[i];
  }

  function potRadius(): number {
    void revision;
    return RADIUS_K * Math.sqrt(Math.max(0, 2 * stake));
  }

  function potPosition(): { x: number; y: number } {
    if (!pair) return { x: CENTER_X, y: FOCUS_Y };
    if (potAt === 'left') return FOCUS_LEFT;
    if (potAt === 'right') return FOCUS_RIGHT;
    return { x: CENTER_X, y: FOCUS_Y };
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function pickTwo(): void {
    const a = Math.floor(Math.random() * N);
    let b = Math.floor(Math.random() * (N - 1));
    if (b >= a) b++;
    pair = [a, b];
    stake = 0;
    potVisible = false;
    potAt = 'table';
    coinFace = '?';
    phase = 'picked';
    caption = 'These two. Nobody chose them for a reason — the room’s dice did.';
  }

  function putStake(): void {
    if (!pair) return;
    stake = ROOM_BETA * Math.min(wealth[pair[0]], wealth[pair[1]]);
    potVisible = true;
    potAt = 'table';
    phase = 'staked';
    caption = 'Each puts in the same slice — a fifth of whatever the poorer one owns.';
    revision++;
  }

  async function flip(): Promise<void> {
    if (!pair || phase !== 'staked') return;
    const gen = generation;
    phase = 'flipping';
    coinSpinning = true;
    coinFace = '?';
    caption = 'A fair coin. Fifty–fifty. Nothing else decides it.';
    const firstWins = Math.random() < 0.5;
    await sleep(950);
    if (gen !== generation) return;
    coinSpinning = false;
    coinFace = firstWins ? 'H' : 'T';
    potAt = firstWins ? 'left' : 'right';
    await sleep(420);
    if (gen !== generation) return;
    applyYardSaleTrade(wealth, pair[0], pair[1], ROOM_BETA, firstWins);
    potVisible = false;
    revision++;
    tradesDone++;
    phase = 'settled';
    const side = firstWins ? 'left' : 'right';
    caption =
      tradesDone < 3
        ? `${coinFace === 'H' ? 'Heads' : 'Tails'} — the ${side} one takes the pot. Exactly what the other lost.`
        : `${coinFace === 'H' ? 'Heads' : 'Tails'} — the ${side} one takes it. No money made, none destroyed. It only moved.`;
  }

  function again(): void {
    generation++;
    pair = null;
    potVisible = false;
    coinFace = '?';
    phase = 'idle';
    revision++;
    pickTwo();
  }

  function resetRoom(): void {
    generation++;
    wealth.fill(1 / N);
    pair = null;
    stake = 0;
    potVisible = false;
    coinFace = '?';
    tradesDone = 0;
    phase = 'idle';
    revision++;
    caption = 'Back to the start. Everyone equal again.';
  }
</script>

<div class="widget" aria-label="One trade, staged step by step">
  <p class="kicker">The whole game, one trade at a time</p>

  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="A ring of circles; two are picked, stake a slice, and flip a coin">
    {#each ringPositions as _, i}
      {@const pos = positionOf(i)}
      <circle
        class="agent"
        class:dimmed={pair !== null && phase !== 'idle' && i !== pair[0] && i !== pair[1]}
        class:focused={pair !== null && (i === pair[0] || i === pair[1])}
        cx={pos.x}
        cy={pos.y}
        r={radius(i)}
      />
    {/each}

    {#if potVisible && pair}
      {@const pot = potPosition()}
      <circle class="pot" cx={pot.x} cy={pot.y} r={potRadius()} />
      {#if potAt === 'table'}
        <text class="pot-label" x={CENTER_X} y={FOCUS_Y + potRadius() + 18} text-anchor="middle">the stake</text>
      {/if}
    {/if}

    {#if phase === 'staked' || phase === 'flipping' || (phase === 'settled' && coinFace !== '?')}
      <g class="coin" class:spinning={coinSpinning} transform={`translate(${CENTER_X} 52)`}>
        <circle r="24" />
        <text y="8" text-anchor="middle">{coinFace}</text>
      </g>
    {/if}
  </svg>

  <p class="caption" aria-live="polite">{caption}</p>

  <div class="toolbar">
    {#if phase === 'idle'}
      <button class="primary" type="button" onclick={pickTwo}>Pick two at random</button>
    {:else if phase === 'picked'}
      <button class="primary" type="button" onclick={putStake}>Put the stake on the table</button>
    {:else if phase === 'staked'}
      <button class="primary" type="button" onclick={flip}>Flip the coin</button>
    {:else if phase === 'flipping'}
      <button class="primary" type="button" disabled>Flipping…</button>
    {:else}
      <button class="primary" type="button" onclick={again}>Trade again</button>
    {/if}
    {#if tradesDone > 0 && (phase === 'settled' || phase === 'idle')}
      <button type="button" onclick={resetRoom}>Start over, all equal</button>
    {/if}
    {#if tradesDone > 0}
      <output>{tradesDone} {tradesDone === 1 ? 'trade' : 'trades'}</output>
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

  .agent {
    fill: rgb(189 98 69 / 26%);
    stroke: #96543c;
    stroke-width: 1.4;
    transition:
      cx 0.55s cubic-bezier(0.5, 0, 0.2, 1),
      cy 0.55s cubic-bezier(0.5, 0, 0.2, 1),
      r 0.4s ease,
      opacity 0.35s ease;
  }

  .agent.dimmed {
    opacity: 0.22;
  }

  .agent.focused {
    fill: rgb(189 98 69 / 38%);
    stroke: #4d271c;
    stroke-width: 2.2;
  }

  .pot {
    fill: rgb(196 148 58 / 45%);
    stroke: #8a6a2a;
    stroke-width: 1.6;
    stroke-dasharray: 4 3;
    transition:
      cx 0.4s cubic-bezier(0.5, 0, 0.2, 1),
      cy 0.4s cubic-bezier(0.5, 0, 0.2, 1),
      r 0.35s ease;
  }

  .pot-label {
    fill: #8a6a2a;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  .coin circle {
    fill: #e9c96a;
    stroke: #8a6a2a;
    stroke-width: 2;
  }

  .coin text {
    fill: #5c4413;
    font-size: 20px;
    font-weight: 700;
  }

  .coin.spinning {
    animation: coin-spin 0.24s linear infinite;
  }

  @keyframes coin-spin {
    0% {
      transform: translate(240px, 52px) scale(1, 1);
    }
    50% {
      transform: translate(240px, 52px) scale(0.12, 1);
    }
    100% {
      transform: translate(240px, 52px) scale(1, 1);
    }
  }
</style>
