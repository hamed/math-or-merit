<script lang="ts">
  import { onMount } from 'svelte';
  import { createEngine, type SimEngine } from '$lib/sim';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import HistoMini from '../shared/HistoMini.svelte';
  import LorenzMini from '../shared/LorenzMini.svelte';
  import { createFixedTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { ROOM_N, START_DOLLARS } from '../shared/presets';

  const TRADES_PER_FRAME = 2600;
  const MAX_TRADES = 25_000_000;
  const HALF_ROOM = 0.5;

  let stakePercent = $state(20);
  const beta = $derived(stakePercent / 100);

  let engine: SimEngine = $state(createEngine({ n: ROOM_N, beta: 0.2 }));
  let revision = $state(0);
  let running = $state(false);
  let topShare = $state(0);
  let halfAt = $state<number | null>(null);
  let observations = $state<{ stake: number; trades: number }[]>([]);

  function measure(): void {
    const w = engine.state.wealth;
    let total = 0;
    let max = 0;
    for (let i = 0; i < w.length; i++) {
      total += w[i];
      if (w[i] > max) max = w[i];
    }
    topShare = total === 0 ? 0 : max / total;
  }

  const ticker = createFixedTicker(() => {
    if (engine.config.beta === 0) {
      // Nothing at stake, nothing happens — draw once and idle.
      revision++;
      running = false;
      ticker.stop();
      return;
    }
    engine.step(TRADES_PER_FRAME);
    revision++;
    measure();
    if (halfAt === null && topShare >= HALF_ROOM) {
      halfAt = engine.state.step;
      const stake = Math.round(engine.config.beta * 100);
      if (!observations.some((o) => o.stake === stake)) {
        observations.push({ stake, trades: halfAt });
        observations.sort((a, b) => a.stake - b.stake);
      }
    }
    if (engine.state.step >= MAX_TRADES) {
      ticker.stop();
      running = false;
    }
  });

  function restart(): void {
    engine = createEngine({ n: ROOM_N, beta });
    halfAt = null;
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
    return engine.state.step;
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
      wealth={engine.state.wealth}
      {revision}
      height={300}
      label={`The room trading live at a ${stakePercent} percent stake`}
    />
    <aside class="sidebar" aria-label="The same room as a histogram and a Lorenz curve">
      <HistoMini wealth={engine.state.wealth} startDollars={START_DOLLARS} {revision} />
      <LorenzMini wealth={engine.state.wealth} {revision} />
    </aside>
  </div>

  <div class="readout">
    <output>{countTrades(step)} trades</output>
    <div class="meter" role="img" aria-label={`Biggest circle holds ${percent(topShare)}`}>
      <div class="meter-fill" style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest circle: {percent(topShare)}</span>
    </div>
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
    <p class="footnote">What these seeded runs did — not a law. The ending is the same for any stake above zero; the speed is what you are changing.</p>
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
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-block-start: 0.8rem;
  }

  output {
    min-inline-size: 9.5rem;
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    font-weight: 700;
    color: #3c352b;
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
