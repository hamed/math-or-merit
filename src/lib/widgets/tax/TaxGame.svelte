<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createTicker } from '../shared/ticker';
  import { countTrades, dollars, percent } from '../shared/format';
  import { TaxWorld } from './TaxWorld';
  import { ROOM_BETA, ROOM_N, START_DOLLARS } from '../shared/presets';

  const TRADES_PER_FRAME = 26; // ≈ 1,500 trades per second at 60 fps
  const LEVY_RATE = 0.25;

  let world = $state(new TaxWorld({ n: ROOM_N, beta: ROOM_BETA, seed: Math.floor(Math.random() * 0xffff_ffff) }));
  let room: RoomCanvas | undefined = $state();
  let revision = $state(0);
  let running = $state(false);
  let started = $state(false);
  let topShare = $state(0);
  let taps = $state(0);
  let playMs = $state(0);
  let levied = $state(0);

  function measure(): void {
    const w = world.wealth;
    let total = 0;
    let max = 0;
    for (let i = 0; i < w.length; i++) {
      total += w[i];
      if (w[i] > max) max = w[i];
    }
    topShare = total === 0 ? 0 : max / total;
  }

  const ticker = createTicker((dt) => {
    playMs += dt;
    world.step(TRADES_PER_FRAME);
    revision++;
    measure();
  });

  function toggle(): void {
    if (running) {
      running = false;
      ticker.stop();
    } else {
      running = true;
      started = true;
      ticker.start();
    }
  }

  function tap(index: number): void {
    if (!running) return;
    const revenue = world.levy(index, LEVY_RATE);
    levied += revenue;
    taps++;
    room?.pulse(index);
    revision++;
    measure();
  }

  function reset(): void {
    running = false;
    started = false;
    ticker.stop();
    world = new TaxWorld({ n: ROOM_N, beta: ROOM_BETA, seed: Math.floor(Math.random() * 0xffff_ffff) });
    taps = 0;
    playMs = 0;
    levied = 0;
    revision++;
    measure();
  }

  measure();

  const trades = $derived.by(() => {
    void revision;
    return world.trades;
  });

  const seconds = $derived(Math.floor(playMs / 1000));

  onMount(() => () => ticker.stop());
</script>

<div class="widget" aria-label="A live room you tax by tapping the largest circles">
  <p class="kicker">The room keeps trading. You hold the levy.</p>

  <RoomCanvas
    bind:this={room}
    wealth={world.wealth}
    {revision}
    height={340}
    onTap={running ? tap : null}
    label="A live trading room; tap a circle to tax a quarter of its wealth and share it back equally"
  />

  <div class="stats">
    <output>{seconds}s</output>
    <output>{countTrades(trades)} trades</output>
    <output>{taps} taps · {dollars(levied * ROOM_N * START_DOLLARS)} shared back</output>
    <div class="meter" role="img" aria-label={`Biggest circle holds ${percent(topShare)}`}>
      <div class="meter-fill" class:alarming={topShare > 0.4} style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest circle: {percent(topShare)}</span>
    </div>
  </div>

  <p class="caption" aria-live="polite">
    {#if !started}
      Tap a circle that has grown too fat: a quarter of its wealth is pulled out and shared back equally, all {ROOM_N} of them. The trading never stops for you.
    {:else if !running}
      Paused. The room waits — it won’t when you’re back.
    {:else if topShare < 0.12}
      You are holding it. For now.
    {:else if topShare < 0.3}
      It’s slipping. Two more are swelling behind your back.
    {:else}
      The room is getting away from you.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={toggle}>{running ? 'Pause' : started ? 'Back to it' : 'Start the room'}</button>
    <button type="button" onclick={reset} disabled={!started}>New room</button>
  </div>
</div>

<style>
  .stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.2rem;
    margin-block-start: 0.8rem;
  }

  .stats output {
    font-variant-numeric: tabular-nums;
    font-size: 0.82rem;
    font-weight: 700;
    color: #3c352b;
  }

  .meter {
    position: relative;
    flex: 1;
    min-inline-size: 10rem;
    block-size: 1.5rem;
    border: 1px solid #cbbfa8;
    border-radius: 999px;
    background: #fffdf8;
    overflow: hidden;
  }

  .meter-fill {
    block-size: 100%;
    background: linear-gradient(90deg, rgb(189 98 69 / 35%), rgb(139 63 43 / 75%));
    transition: inline-size 0.2s linear;
  }

  .meter-fill.alarming {
    background: linear-gradient(90deg, rgb(139 63 43 / 55%), rgb(93 30 18 / 85%));
  }

  .meter-label {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 0.8rem;
    transform: translateY(-50%);
    font-size: 0.72rem;
    font-weight: 700;
    color: #3c352b;
    white-space: nowrap;
  }
</style>
