<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createTicker } from '../shared/ticker';
  import { countTrades, dollars, percent } from '../shared/format';
  import { measureWealth } from '$lib/research';
  import { assignStyles } from '../shared/agentStyle';
  import { TaxWorld, judgeGame } from './TaxWorld';
  import { ROOM_BETA, ROOM_N, START_DOLLARS } from '../shared/presets';

  const TRADES_PER_FRAME = 26; // ≈ 1,500 trades per second at 60 fps
  const LEVY_RATE = 0.25;
  const LOSE_SHARE = 0.35;
  const LOSE_SUSTAIN = 240; // frames ≈ 4 s over the line = game over

  // Difficulty = the room's stake, fixed for the whole game (owner decision
  // 2026-07-08: no mid-game escalation — taxing must not change the trade
  // rule, or the lesson gets contaminated).
  const DIFFICULTIES = [
    { label: 'Gentle', beta: 0.12 },
    { label: 'Normal', beta: ROOM_BETA },
    { label: 'Brutal', beta: 0.3 },
  ] as const;

  const styles = assignStyles(ROOM_N);

  let difficulty = $state(1);

  const newWorld = () =>
    new TaxWorld({
      n: ROOM_N,
      beta: DIFFICULTIES[difficulty].beta,
      seed: Math.floor(Math.random() * 0xffff_ffff),
    });

  let world = $state(newWorld());
  let room: RoomCanvas | undefined = $state();
  let revision = $state(0);
  let running = $state(false);
  let started = $state(false);
  let gameOver = $state(false);
  let topShare = $state(0);
  let gini = $state(0);
  let taps = $state(0);
  let playMs = $state(0);
  let levied = $state(0);
  let shareHistory: number[] = [];

  function measure(): void {
    const metrics = measureWealth(world.wealth);
    topShare = metrics.topShare;
    gini = metrics.gini;
  }

  const ticker = createTicker((dt) => {
    playMs += dt;
    world.step(TRADES_PER_FRAME);
    revision++;
    measure();
    shareHistory.push(topShare);
    if (shareHistory.length > LOSE_SUSTAIN + 8) shareHistory = shareHistory.slice(-LOSE_SUSTAIN - 4);
    if (judgeGame(shareHistory, LOSE_SHARE, LOSE_SUSTAIN)) {
      running = false;
      gameOver = true;
      ticker.stop();
    }
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
    gameOver = false;
    ticker.stop();
    world = newWorld();
    taps = 0;
    playMs = 0;
    levied = 0;
    shareHistory = [];
    revision++;
    measure();
  }

  function setDifficulty(i: number): void {
    if (i === difficulty) return;
    difficulty = i;
    reset();
  }

  measure();

  const trades = $derived.by(() => {
    void revision;
    return world.trades;
  });

  const stake = $derived.by(() => {
    void revision;
    return world.beta;
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
    {styles}
    height={340}
    onTap={running ? tap : null}
    label="A live trading room; tap a shape to tax a quarter of its wealth and share it back equally"
  />

  <div class="stats">
    <output>{seconds}s</output>
    <output>{countTrades(trades)} trades</output>
    <output>{taps} taps · {dollars(levied * ROOM_N * START_DOLLARS)} shared back</output>
  </div>

  <div class="stats">
    <div class="meter" role="img" aria-label={`Biggest holder has ${percent(topShare)}`}>
      <div class="meter-fill" class:alarming={topShare > LOSE_SHARE} style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest: {percent(topShare)}</span>
    </div>
    <div class="meter" role="img" aria-label={`Gini ${gini.toFixed(2)}`}>
      <div class="meter-fill" class:alarming={gini > 0.8} style={`inline-size: ${Math.min(100, gini * 100)}%`}></div>
      <span class="meter-label">Gini: {gini.toFixed(2)}</span>
    </div>
    <div class="meter" role="img" aria-label={`Stake ${percent(stake)}`}>
      <div class="meter-fill stake" style={`inline-size: ${Math.min(100, stake * 200)}%`}></div>
      <span class="meter-label">stake: {percent(stake)}</span>
    </div>
  </div>

  <p class="caption" aria-live="polite">
    {#if gameOver}
      <strong>The room got away.</strong> You held it for {seconds}s and {countTrades(trades)} trades. The rule never
      changed — the room simply outpaced your taps. Nothing was unfair along the way.
    {:else if !started}
      Tap a shape that has grown too fat: a quarter of its wealth is pulled out and shared back equally, all {ROOM_N} of them.
      Pick how hard the room trades — a higher stake condenses faster.
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
    {#if gameOver}
      <button class="primary" type="button" onclick={reset}>Try a fresh room</button>
    {:else}
      <button class="primary" type="button" onclick={toggle}>{running ? 'Pause' : started ? 'Back to it' : 'Start the room'}</button>
      <button type="button" onclick={reset} disabled={!started}>New room</button>
    {/if}
    <div class="difficulty" role="group" aria-label="Difficulty — the room's fixed stake">
      {#each DIFFICULTIES as d, i}
        <button type="button" class="level" aria-pressed={difficulty === i} onclick={() => setDifficulty(i)}>
          {d.label} · {percent(d.beta)}
        </button>
      {/each}
    </div>
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

  .meter-fill.stake {
    background: linear-gradient(90deg, rgb(233 201 106 / 55%), rgb(138 106 42 / 80%));
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

  .difficulty {
    display: flex;
    gap: 0.35rem;
    margin-inline-start: auto;
  }

  .level {
    font-size: 0.78rem;
    padding-block: 0.3rem;
    padding-inline: 0.7rem;
  }

  .level[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
</style>
