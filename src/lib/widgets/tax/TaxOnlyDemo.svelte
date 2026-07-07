<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { measureWealth } from '$lib/research';
  import { completedRoomRun } from '../shared/roomRun';
  import { latestRun } from '../shared/runLog.svelte';
  import { assignStyles } from '../shared/agentStyle';
  import { percent } from '../shared/format';
  import { LeviedWorld } from './LeviedWorld';
  import { REVEAL_SEED, REVEAL_TRADES, ROOM_N } from '../shared/presets';

  const LEVY_RATE = 0.1;
  const LEVY_INTERVAL_MS = 320;

  const styles = assignStyles(ROOM_N);

  // Start from a condensed room — the one the reader just fought, if any.
  const snapshot = () => (latestRun() ?? completedRoomRun(REVEAL_SEED, REVEAL_TRADES)).wealth;

  let world = $state(
    new LeviedWorld({ n: ROOM_N, beta: 0, taxRate: LEVY_RATE, levyEvery: 1, initialWealth: snapshot() }),
  );
  let revision = $state(0);
  let running = $state(false);
  let levies = $state(0);
  let gini = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  function measure(): void {
    gini = measureWealth(world.wealth).gini;
  }

  function stop(): void {
    running = false;
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  }

  function start(): void {
    if (running) return;
    running = true;
    timer = setInterval(() => {
      world.step(1); // one tick = one flat levy; nothing trades (beta = 0)
      levies++;
      revision++;
      measure();
      if (gini < 0.02) stop();
    }, LEVY_INTERVAL_MS);
  }

  function reset(): void {
    stop();
    world = new LeviedWorld({ n: ROOM_N, beta: 0, taxRate: LEVY_RATE, levyEvery: 1, initialWealth: snapshot() });
    levies = 0;
    revision++;
    measure();
  }

  measure();

  onMount(() => () => stop());
</script>

<div class="widget" aria-label="Taxing a frozen room until it is equal again">
  <p class="kicker">Rule one: only tax, no trade</p>

  <RoomCanvas
    wealth={world.wealth}
    {revision}
    {styles}
    height={300}
    label={`A condensed room with trading switched off; each levy takes ${percent(LEVY_RATE)} of everyone's wealth and shares it back equally`}
  />

  <p class="caption" aria-live="polite">
    {#if levies === 0}
      Freeze the trading. Now the only rule is a flat levy: every beat, {percent(LEVY_RATE)} of everyone's
      wealth comes out and goes back as an equal dividend.
    {:else if running}
      {levies} {levies === 1 ? 'levy' : 'levies'} — Gini {gini.toFixed(2)}. The dividend lifts the many faster than the levy dents the few.
    {:else}
      Equal again, in {levies} levies, no force involved. Redistribution alone always wins — <em>when nothing pushes back</em>. Now turn the trading back on…
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={running ? stop : start}>
      {running ? 'Pause' : levies === 0 ? 'Start levying' : 'Keep levying'}
    </button>
    <button type="button" onclick={reset} disabled={levies === 0}>Back to unequal</button>
    <output>Gini {gini.toFixed(2)}</output>
  </div>
</div>

<style>
  output {
    margin-inline-start: auto;
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    font-weight: 700;
    color: #3c352b;
  }
</style>
