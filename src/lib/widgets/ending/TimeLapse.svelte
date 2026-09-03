<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import TimeSeries from '../sandbox/TimeSeries.svelte';
  import { SandboxWorld } from '../sandbox/SandboxWorld';
  import { createFixedTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { latestRun } from '../shared/runLog.svelte';
  import { completedRoomRun, type LoggedRun } from '../shared/roomRun';
  import { DUST_DOLLARS, REVEAL_BETA, REVEAL_TRADES, ROOM_N, START_DOLLARS } from '../shared/presets';
  import { continuationWorld } from './continuation';

  /**
   * A bookkeeping round is 1,000 trades here, not the usual 100: this beat
   * accelerates to 400,000 trades a frame, and a round costs a Gini over the
   * whole room. At 100 it added 15 ms to a 39 ms frame; at 1,000 it adds 2.
   */
  const ROUND_TRADES = 1000;

  const freshSeed = () => Math.floor(Math.random() * 0xffff_ffff);
  const runKey = (run: LoggedRun) => `${run.seed}:${run.beta}:${run.trades}`;
  const freshRun = () => completedRoomRun(freshSeed(), REVEAL_TRADES, ROOM_N, REVEAL_BETA);

  const MAX_TRADES = 40_000_000;
  const STOP_SHARE = 0.9995;

  const fallback = freshRun();
  let world = $state(continuationWorld(fallback, ROUND_TRADES));
  let loadedRunKey = $state(runKey(fallback));
  let ignoredLatestKey = $state<string | null>(null);
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

  const ticker = createFixedTicker(() => {
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

  $effect(() => {
    const latest = latestRun();
    if (!latest || running) return;
    const key = runKey(latest);
    if (key === loadedRunKey || key === ignoredLatestKey) return;
    ticker.stop();
    world = continuationWorld(latest, ROUND_TRADES);
    loadedRunKey = key;
    ignoredLatestKey = null;
    finished = false;
    perFrame = 400;
    revision++;
    measure();
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
    const latest = latestRun();
    ignoredLatestKey = latest ? runKey(latest) : null;
    const next = freshRun();
    world = continuationWorld(next, ROUND_TRADES);
    loadedRunKey = runKey(next);
    revision++;
    measure();
  }

  measure();

  onMount(() => () => ticker.stop());
</script>

<div class="widget" aria-label="Time accelerates toward the one-owner limit">
  <p class="kicker">Time, accelerated</p>

  <div class="duo">
    <RoomCanvas
      wealth={world.wealth}
      {revision}
      {winner}
      height={320}
      label="The room under accelerating time; the tail thins toward the one-owner limit"
    />
    <!-- The room shows the ending; the curve preserves the finite path, including its wobbles. -->
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
      One circle holds everything these pixels can distinguish. The finite run stops here;
      the theorem supplies the rest. Try a different room and chance chooses again.
    {:else if running}
      Each second covers more trades than the last. Watch the counter, not the clock.
    {:else}
      This is the room from the reveal, picking up where it stopped. Let it run — not to a bigger number, but toward the limit.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={run} disabled={running || finished}>
      {finished ? 'Close enough for pixels' : running ? 'Running…' : 'Let it run'}
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
