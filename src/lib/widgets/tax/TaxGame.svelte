<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createFixedTicker } from '../shared/ticker';
  import { countTrades, dollars, percent } from '../shared/format';
  import { measureWealth } from '$lib/research';
  import { assignStyles } from '../shared/agentStyle';
  import { SandboxWorld } from '../sandbox/SandboxWorld';
  import { judgeGame } from './judge';
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

  // The sandbox's world with the structural levy off: here the READER is the
  // only levy, one tap at a time.
  const newWorld = () => {
    const w = new SandboxWorld({
      n: ROOM_N,
      startDollars: START_DOLLARS,
      seed: Math.floor(Math.random() * 0xffff_ffff),
    });
    w.beta = DIFFICULTIES[difficulty].beta;
    w.taxRate = 0;
    w.tradesPerRound = ROOM_N;
    return w;
  };

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

  const ticker = createFixedTicker((dt) => {
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
    const revenue = world.levyAgent(index, LEVY_RATE); // dollars, not a share
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

  // keyboard path: the same levy as tapping the canvas, as real buttons
  // (the canvas is pointer-only; reviews 2026-07-08 flagged it)
  const topFive = $derived.by(() => {
    void revision;
    const w = world.wealth;
    return Array.from(w.keys())
      .sort((a, b) => w[b] - w[a])
      .slice(0, 5)
      .map((i) => ({ i, share: w[i] }));
  });

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

  {#if running}
    <div class="quick-tax" role="group" aria-label="Tax one of the five biggest holders">
      <span class="quick-label">tax the big five:</span>
      {#each topFive as t, rank (rank)}
        <button type="button" onclick={() => tap(t.i)} aria-label={`Tax holder number ${rank + 1}, currently ${percent(t.share)}`}>
          #{rank + 1} · {percent(t.share)}
        </button>
      {/each}
    </div>
  {/if}

  <div class="stats">
    <output>{seconds}s</output>
    <output>{countTrades(trades)} trades</output>
    <output>{taps} taps · {dollars(levied)} shared back</output>
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
      Choose a large holder: a quarter of its wealth is collected and returned in equal shares to all {ROOM_N} participants.
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

  /* the pill itself lives in app.css; the game's is never narrow */
  .meter {
    min-inline-size: 10rem;
  }

  .meter-fill.alarming {
    background: linear-gradient(90deg, rgb(139 63 43 / 55%), rgb(93 30 18 / 85%));
  }

  .meter-fill.stake {
    background: linear-gradient(90deg, rgb(233 201 106 / 55%), rgb(138 106 42 / 80%));
  }

  .difficulty {
    display: flex;
    gap: 0.35rem;
    margin-inline-start: auto;
  }

  .quick-tax {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin-block-start: 0.6rem;
  }

  .quick-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .quick-tax button {
    min-block-size: 2.75rem;
    padding-block: 0.2rem;
    padding-inline: 0.55rem;
    border: 1px solid #a99980;
    border-radius: 999px;
    background: var(--paper-bright);
    color: #3c352b;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }

  .quick-tax button:focus-visible {
    outline: 3px solid rgb(139 63 43 / 35%);
    outline-offset: 2px;
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
