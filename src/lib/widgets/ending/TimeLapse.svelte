<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import TimeSeries from '../sandbox/TimeSeries.svelte';
  import { SandboxWorld } from '../sandbox/SandboxWorld';
  import { createTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { DUST_DOLLARS, REVEAL_SEED, REVEAL_TRADES, ROOM_BETA, ROOM_N, START_DOLLARS } from '../shared/presets';

  /**
   * A bookkeeping round is 1,000 trades here, not the usual 100: this beat
   * accelerates to 400,000 trades a frame, and a round costs a Gini over the
   * whole room. At 100 it added 15 ms to a 39 ms frame; at 1,000 it adds 2.
   */
  const ROUND_TRADES = 1000;

  // Continue the room the reveal left off: same seed, pre-run to the same point.
  function preRunWorld(seed: number): SandboxWorld {
    const world = new SandboxWorld({ n: ROOM_N, startDollars: START_DOLLARS, seed });
    world.beta = ROOM_BETA;
    world.taxEvery = ROUND_TRADES;
    world.step(REVEAL_TRADES);
    return world;
  }

  const MAX_TRADES = 40_000_000;
  const STOP_SHARE = 0.9995;

  let world = $state(preRunWorld(REVEAL_SEED));
  let revision = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let topShare = $state(0);
  let winner = $state<number | null>(null);
  let holdersLeft = $state(ROOM_N);
  let perFrame = 400;

  function measure(): void {
    const w = world.wealth;
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
    world.step(Math.round(perFrame));
    revision++;
    measure();
    if (topShare >= STOP_SHARE || world.trades >= MAX_TRADES) {
      ticker.stop();
      running = false;
      finished = true;
    }
  });

  const step = $derived.by(() => {
    void revision;
    return world.trades;
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
    world = preRunWorld(Math.floor(Math.random() * 0xffff_ffff));
    revision++;
    measure();
  }

  measure();

  onMount(() => () => ticker.stop());
</script>

<div class="widget" aria-label="Time accelerates until a single circle holds everything">
  <p class="kicker">Time, accelerated</p>

  <div class="duo">
    <RoomCanvas
      wealth={world.wealth}
      {revision}
      {winner}
      height={320}
      label="The room under accelerating time; the tail thins until one circle holds everything"
    />
    <!-- the room shows the ending; the curve shows that it never turns back -->
    <div class="plot">
      <TimeSeries {world} {revision} />
    </div>
  </div>

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
  .duo {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(9rem, 11rem);
    gap: 1rem;
    align-items: center;
  }

  @media (max-width: 40rem) {
    .duo {
      grid-template-columns: 1fr;
      justify-items: center;
    }
  }

  /* the finale's plot frame is square and drawn for a small tile — cap it so
     it stays a margin note beside the room, on mobile as well */
  .plot {
    inline-size: 100%;
    max-inline-size: 12rem;
    aspect-ratio: 1;
  }

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
