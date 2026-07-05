<script lang="ts">
  import { onMount } from 'svelte';
  import { createEngine, type SimEngine } from '$lib/sim';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { logRun, predictionLabel, session } from '../shared/runLog.svelte';
  import { REVEAL_SEED, REVEAL_TRADES, ROOM_BETA, ROOM_N } from '../shared/presets';

  interface Props {
    /** 'reveal' replays the curated seed; 'rerun' rolls a new seed every run. */
    mode: 'reveal' | 'rerun';
  }

  let { mode }: Props = $props();

  // `mode` is fixed per essay slot; reading it once at init is intentional.
  // svelte-ignore state_referenced_locally
  const DURATION_MS = mode === 'reveal' ? 9000 : 3600;

  let engine: SimEngine = $state(createEngine({ n: ROOM_N, beta: ROOM_BETA, seed: REVEAL_SEED }));
  let revision = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let elapsed = 0;
  let topShare = $state(0);
  let winner = $state<number | null>(null);
  let history = $state<{ seed: number; winner: number; topShare: number }[]>([]);

  const guess = $derived(predictionLabel(session.prediction));
  const step = $derived.by(() => {
    void revision;
    return engine.state.step;
  });

  function measureTop(): void {
    const w = engine.state.wealth;
    let total = 0;
    let max = 0;
    let argmax = 0;
    for (let i = 0; i < w.length; i++) {
      total += w[i];
      if (w[i] > max) {
        max = w[i];
        argmax = i;
      }
    }
    topShare = total === 0 ? 0 : max / total;
    winner = finished ? argmax : null;
  }

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const ticker = createTicker((dt) => {
    elapsed += dt;
    const progress = Math.min(1, elapsed / DURATION_MS);
    const target = Math.round(easeInOutCubic(progress) * REVEAL_TRADES);
    const step = target - engine.state.step;
    if (step > 0) engine.step(step);
    revision++;
    if (progress >= 1) {
      ticker.stop();
      running = false;
      finished = true;
      measureTop();
      const wealth = Float64Array.from(engine.state.wealth);
      logRun({
        seed: engine.config.seed ?? -1,
        trades: engine.state.step,
        wealth,
        winner: winner ?? 0,
        topShare,
      });
      if (mode === 'rerun') {
        history.push({ seed: engine.config.seed ?? -1, winner: winner ?? 0, topShare });
      }
    } else {
      measureTop();
    }
  });

  function run(): void {
    if (running) return;
    if (mode === 'rerun') {
      engine = createEngine({ n: ROOM_N, beta: ROOM_BETA, seed: Math.floor(Math.random() * 0xffff_ffff) });
    } else if (finished) {
      engine.reset();
    }
    elapsed = 0;
    finished = false;
    winner = null;
    topShare = 0;
    revision++;
    running = true;
    ticker.start();
  }

  onMount(() => () => ticker.stop());

  const distinctWinners = $derived(new Set(history.map((h) => h.winner)).size);
</script>

<div class="widget" aria-label={mode === 'reveal' ? 'The main run: a hundred thousand fair trades' : 'Run the room again with new dice'}>
  <p class="kicker">
    {mode === 'reveal' ? 'The room, for real this time' : 'New dice, same rule'}
  </p>

  <RoomCanvas
    wealth={engine.state.wealth}
    {revision}
    {winner}
    height={320}
    label={mode === 'reveal'
      ? 'One hundred circles trading; one grows enormous while the rest shrink'
      : 'The same room re-run with a fresh seed; a different circle wins'}
  />

  <div class="readout">
    <output aria-live="off">{countTrades(step)} trades</output>
    <div class="meter" role="img" aria-label={`Biggest circle holds ${percent(topShare)} of everything`}>
      <div class="meter-fill" style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest circle: {percent(topShare)}</span>
    </div>
  </div>

  <p class="caption" aria-live="polite">
    {#if mode === 'reveal'}
      {#if !finished && !running}
        Everyone equal. Every trade fair. {guess ? `Your guess: ${guess.toLowerCase()}.` : 'You didn’t lock a guess — brave.'}
      {:else if running}
        No one is cheating. Watch the sizes.
      {:else}
        The biggest circle holds <strong>{percent(topShare)}</strong> of everything there is.
        {guess ? `You guessed: ${guess.toLowerCase()}.` : ''}
        This exact run replays identically — it is seeded. The next widget rolls fresh dice.
      {/if}
    {:else if history.length === 0}
      Same rule, same equal start — but this time the dice are new every run.
    {:else}
      {history.length} {history.length === 1 ? 'run' : 'runs'}, {distinctWinners}
      {distinctWinners === 1 ? 'winner' : 'different winners'}.
      {#if history.length >= 2}
        The crown moves. The crowning doesn’t.
      {/if}
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={run} disabled={running}>
      {#if running}
        Trading…
      {:else if mode === 'reveal'}
        {finished ? 'Replay the same run' : `Run ${countTrades(REVEAL_TRADES)} trades`}
      {:else}
        {history.length === 0 ? 'Run it again — new dice' : 'Again'}
      {/if}
    </button>
    {#if mode === 'rerun' && history.length > 0}
      <ul class="history" aria-label="Winners so far">
        {#each history.slice(-4) as h, i (h.seed)}
          <li>circle #{h.winner + 1} took {percent(h.topShare)}</li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
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

  .meter {
    position: relative;
    flex: 1;
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

  .history {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .history li {
    padding-block: 0.25rem;
    padding-inline: 0.6rem;
    border: 1px solid #d8cdb9;
    border-radius: 999px;
    background: #fffdf8;
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
    color: #5c5344;
  }
</style>
