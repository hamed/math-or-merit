<script lang="ts">
  import { onMount } from 'svelte';
  import { PREDICTIONS, session, type PredictionId } from '../shared/runLog.svelte';

  const STORAGE_KEY = 'merit-or-math.prediction';

  // Mini pictograms: circle radii per option, on a 96×64 canvas-less SVG.
  const PICTOGRAMS: Record<PredictionId, readonly number[]> = {
    equal: [8, 8, 8, 8, 8, 8],
    spread: [10, 9, 8, 8, 7, 6],
    split: [13, 12, 11, 5, 4, 3],
    giant: [24, 4, 3, 2.5, 2, 1.5],
  };

  const spots = [
    { x: 16, y: 22 },
    { x: 48, y: 18 },
    { x: 80, y: 24 },
    { x: 20, y: 48 },
    { x: 52, y: 46 },
    { x: 82, y: 50 },
  ];

  function choose(id: PredictionId): void {
    session.prediction = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // private mode etc. — the choice still lives for this session
    }
  }

  onMount(() => {
    if (session.prediction !== null) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && PREDICTIONS.some((p) => p.id === saved)) {
        session.prediction = saved as PredictionId;
      }
    } catch {
      // ignore
    }
  });
</script>

<div class="widget" aria-label="Commit to a prediction before running the room">
  <p class="kicker">Lock in a guess — before the room answers</p>

  <div class="options" role="radiogroup" aria-label="What does the room look like after a hundred thousand fair trades?">
    {#each PREDICTIONS as option (option.id)}
      <button
        type="button"
        class="option"
        role="radio"
        aria-checked={session.prediction === option.id}
        class:selected={session.prediction === option.id}
        onclick={() => choose(option.id)}
      >
        <svg viewBox="0 0 96 64" aria-hidden="true">
          {#each PICTOGRAMS[option.id] as r, i}
            <circle cx={spots[i].x} cy={spots[i].y} r={Math.max(1, r)} />
          {/each}
        </svg>
        <span>{option.label}</span>
      </button>
    {/each}
  </div>

  <p class="caption" aria-live="polite">
    {#if session.prediction === null}
      Pick one. There is no grade — but a guess you commit to is a guess you can be surprised by.
    {:else}
      Locked in: <strong>{PREDICTIONS.find((p) => p.id === session.prediction)?.label}</strong>. You can still change it — until you run the room.
    {/if}
  </p>
</div>

<style>
  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
    gap: 0.7rem;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    padding-block: 0.9rem;
    padding-inline: 0.7rem;
    border: 1.5px solid #cbbfa8;
    border-radius: 0.8rem;
    background: #fffdf8;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 600;
    color: #3c352b;
    line-height: 1.25;
    text-align: center;
  }

  .option:hover {
    border-color: #8b3f2b;
  }

  .option:focus-visible {
    outline: 3px solid rgb(139 63 43 / 35%);
    outline-offset: 2px;
  }

  .option.selected {
    border-color: #8b3f2b;
    background: rgb(139 63 43 / 7%);
    box-shadow: inset 0 0 0 1px #8b3f2b;
  }

  .option svg {
    inline-size: 100%;
    max-inline-size: 7rem;
  }

  .option circle {
    fill: var(--agent-fill-red);
    fill-opacity: 0.75;
    stroke: var(--agent-stroke-blue);
    stroke-width: 1.2;
  }

  .option circle:nth-child(3n + 2) {
    fill: var(--agent-fill-blue);
    stroke: var(--agent-stroke-violet);
  }

  .option circle:nth-child(3n) {
    fill: var(--agent-fill-green);
    stroke: var(--agent-stroke-pink);
  }
</style>
