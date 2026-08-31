<script lang="ts">
  import { onMount } from 'svelte';
  import { measureWealth } from '$lib/research';
  import { SandboxWorld, type RoundMeasurement } from '../sandbox/SandboxWorld';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import HistoMini from '../shared/HistoMini.svelte';
  import LorenzMini from '../shared/LorenzMini.svelte';
  import { createFixedTicker } from '../shared/ticker';
  import { countTrades } from '../shared/format';
  import { ROOM_N, START_DOLLARS } from '../shared/presets';

  const TRADES_PER_FRAME = 2600;
  const MAX_TRADES = 25_000_000;
  const HALF_ROOM = 0.5;

  let stakePercent = $state(20);
  const beta = $derived(stakePercent / 100);

  let revision = $state(0);
  let running = $state(false);
  let topShare = $state(0);
  let gini = $state(0);
  let effectiveParticipants = $state(ROOM_N);
  let turnover = $state(0);
  let halfAt = $state<number | null>(null);
  let observations = $state<{ stake: number; trades: number }[]>([]);

  function readMeasurement(measurement: RoundMeasurement): void {
    turnover = measurement.wealthTurnover;
  }

  function buildWorld(): SandboxWorld {
    const next = new SandboxWorld({ n: ROOM_N, startDollars: START_DOLLARS });
    next.beta = beta;
    next.onMeasurement(readMeasurement);
    return next;
  }

  let world = $state(buildWorld());

  function measure(): void {
    const metrics = measureWealth(world.wealth);
    topShare = metrics.topShare;
    gini = metrics.gini;
    effectiveParticipants = metrics.effectiveParticipants;
  }

  const ticker = createFixedTicker(() => {
    if (world.beta === 0) {
      // Nothing at stake, nothing happens — draw once and idle.
      revision++;
      ticker.stop();
      return;
    }
    world.step(TRADES_PER_FRAME);
    revision++;
    measure();
    if (halfAt === null && topShare >= HALF_ROOM) {
      halfAt = world.trades;
      const stake = Math.round(world.beta * 100);
      if (!observations.some((o) => o.stake === stake)) {
        observations.push({ stake, trades: halfAt });
        observations.sort((a, b) => a.stake - b.stake);
      }
    }
    if (world.trades >= MAX_TRADES) {
      ticker.stop();
      running = false;
    }
  });

  function restart(): void {
    world = buildWorld();
    halfAt = null;
    turnover = 0;
    revision++;
    measure();
    if (running) ticker.start();
  }

  function toggle(): void {
    if (running) {
      running = false;
      ticker.stop();
    } else {
      running = true;
      ticker.start();
    }
  }

  const step = $derived.by(() => {
    void revision;
    return world.trades;
  });

  onMount(() => () => ticker.stop());
</script>

<div class="widget" aria-label="Vary the stake and watch the speed change">
  <p class="kicker">Your hand on the dial</p>

  <label class="dial">
    <span>the stake: <strong>{stakePercent}%</strong> of the poorer trader’s wealth</span>
    <input
      type="range"
      min="0"
      max="99"
      step="1"
      bind:value={stakePercent}
      oninput={restart}
      aria-label="Stake as a percentage of the poorer trader's wealth"
    />
  </label>

  <div class="duo">
    <RoomCanvas
      wealth={world.wealth}
      {revision}
      height={300}
      label={`The room trading live at a ${stakePercent} percent stake`}
    />
    <aside class="sidebar" aria-label="The same room as a histogram and a Lorenz curve">
      <HistoMini wealth={world.wealth} startDollars={START_DOLLARS} {revision} />
      <LorenzMini wealth={world.wealth} {revision} />
    </aside>
  </div>

  <div class="readout">
    <output>{countTrades(step)} trades</output>
    <p><span>Gini</span><strong>{gini.toFixed(2)}</strong></p>
    <p><span>effective participants</span><strong>{effectiveParticipants.toFixed(1)}</strong></p>
    <p><span>turnover / round</span><strong>{turnover > 0 && turnover < 0.005 ? '<0.01' : turnover.toFixed(2)}</strong></p>
  </div>

  <p class="caption" aria-live="polite">
    {#if halfAt !== null}
      At a {stakePercent}% stake, one circle passed half the room after {countTrades(halfAt)} trades — in this run.
    {:else if running}
      Watching for the half-the-room moment at {stakePercent}%…
    {:else}
      Press run, then drag the stake while it trades. Each restart draws a fresh room.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={toggle}>{running ? 'Pause' : 'Run'}</button>
    <button type="button" onclick={restart}>Restart this stake</button>
  </div>

  {#if observations.length > 1}
    <ul class="observations" aria-label="What your runs did, stake by stake">
      {#each observations as o (o.stake)}
        <li><strong>{o.stake}%</strong> → half the room after {countTrades(o.trades)} trades</li>
      {/each}
    </ul>
    <p class="footnote">What these fresh runs did — not a law. The ending is the same for any stake above zero; the speed is what you are changing.</p>
  {/if}
</div>

<style>
  .dial {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-block-end: 0.9rem;
    font-size: 0.88rem;
    color: #3c352b;
  }

  .dial input {
    accent-color: #8b3f2b;
  }

  .duo {
    display: grid;
    grid-template-columns: 1fr 10rem;
    gap: 1rem;
    align-items: start;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  @media (max-width: 40rem) {
    .duo {
      grid-template-columns: 1fr;
    }

    .sidebar {
      flex-direction: row;
    }
  }

  .readout {
    display: grid;
    grid-template-columns: 9.5rem repeat(3, minmax(0, 1fr));
    align-items: center;
    gap: 0.7rem;
    margin-block-start: 0.8rem;
  }

  output {
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    font-weight: 700;
    color: #3c352b;
  }

  .readout p {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    margin: 0;
    padding-block: 0.4rem;
    border-block: 1px solid #d8cdb9;
    color: #756c5d;
    font-size: 0.68rem;
  }

  .readout strong {
    color: #5c5344;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 40rem) {
    .readout {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  .observations {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-block: 0.9rem 0;
    padding: 0;
    list-style: none;
  }

  .observations li {
    padding-block: 0.3rem;
    padding-inline: 0.65rem;
    border: 1px solid #d8cdb9;
    border-radius: 999px;
    background: #fffdf8;
    font-size: 0.74rem;
    font-variant-numeric: tabular-nums;
    color: #5c5344;
  }

  .footnote {
    margin-block: 0.5rem 0;
    font-size: 0.72rem;
    color: #756c5d;
  }
</style>
