<script lang="ts">
  import { onMount } from 'svelte';
  import { createEngine, type SimEngine } from '$lib/sim';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { DUST_DOLLARS, REVEAL_SEED, REVEAL_TRADES, ROOM_BETA, ROOM_N, START_DOLLARS } from '../shared/presets';

  // Continue the room the reveal left off: same seed, pre-run to the same point.
  function preRunEngine(seed: number): SimEngine {
    const engine = createEngine({ n: ROOM_N, beta: ROOM_BETA, seed });
    engine.step(REVEAL_TRADES);
    return engine;
  }

  const MAX_TRADES = 40_000_000;
  const STOP_SHARE = 0.9995;

  let engine = $state(preRunEngine(REVEAL_SEED));
  let revision = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let topShare = $state(0);
  let winner = $state<number | null>(null);
  let holdersLeft = $state(ROOM_N);
  let perFrame = 400;

  function measure(): void {
    const w = engine.state.wealth;
    let total = 0;
    let max = 0;
    let argmax = 0;
    let holders = 0;
    const dustShare = DUST_DOLLARS / (ROOM_N * START_DOLLARS);
    for (let i = 0; i < w.length; i++) {
      total += w[i];
      if (w[i] > max) {
        max = w[i];
        argmax = i;
      }
      if (w[i] >= dustShare) holders++;
    }
    topShare = total === 0 ? 0 : max / total;
    holdersLeft = holders;
    winner = topShare >= 0.5 ? argmax : null;
  }

  const ticker = createTicker(() => {
    perFrame = Math.min(400_000, perFrame * 1.06);
    engine.step(Math.round(perFrame));
    revision++;
    measure();
    if (topShare >= STOP_SHARE || engine.state.step >= MAX_TRADES) {
      ticker.stop();
      running = false;
      finished = true;
    }
  });

  const step = $derived.by(() => {
    void revision;
    return engine.state.step;
  });

  function run(): void {
    if (running) return;
    perFrame = 400;
    running = true;
    finished = false;
    ticker.start();
  }

  function differentRoom(): void {
    ticker.stop();
    running = false;
    finished = false;
    perFrame = 400;
    engine = preRunEngine(Math.floor(Math.random() * 0xffff_ffff));
    revision++;
    measure();
  }

  measure();

  onMount(() => () => ticker.stop());
</script>

<div class="widget" aria-label="Time accelerates until a single circle holds everything">
  <p class="kicker">Time, accelerated</p>

  <RoomCanvas
    wealth={engine.state.wealth}
    {revision}
    {winner}
    height={320}
    label="The room under accelerating time; the tail thins until one circle holds everything"
  />

  <div class="stats">
    <output>{countTrades(step)} trades</output>
    <output>biggest circle: {percent(topShare, topShare > 0.99 ? 1 : 0)}</output>
    <output>still above one cent: {holdersLeft} of {ROOM_N}</output>
  </div>

  <p class="caption" aria-live="polite">
    {#if finished}
      One circle holds everything the pixels can show. Run a different room — a different circle ends up as the one. It is always someone. It is never no one.
    {:else if running}
      Each second covers more trades than the last. Watch the counter, not the clock.
    {:else}
      This is the room from the reveal, picking up where it stopped. Let it run — not to a bigger number, but toward the limit.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={run} disabled={running || finished}>
      {finished ? 'It ended — as promised' : running ? 'Running…' : 'Let it run'}
    </button>
    <button type="button" onclick={differentRoom} disabled={running}>Try a different room</button>
  </div>
</div>

<style>
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.4rem;
    margin-block-start: 0.8rem;
  }

  .stats output {
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    font-weight: 700;
    color: #3c352b;
  }
</style>
