<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { createEngine, type SimEngine } from '$lib/sim';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { createTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { logRun, predictionLabel, session } from '../shared/runLog.svelte';
  import { REVEAL_BETA, REVEAL_TRADES, ROOM_N } from '../shared/presets';
  import { assignStyles, headlineForStyle, styleNoun } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';

  // Display-only styles, dealt before any run (agentStyle.ts GUARD: the sim
  // has no import path to them — the morning paper below is the only consumer).
  const styles = assignStyles(ROOM_N);

  // First run is the dramatic one; reruns are quick. Every run rolls fresh
  // dice — no seed, no seed concept (owner review 2026-07-08).
  const FIRST_MS = 9000;
  const RERUN_MS = 4200;

  const freshSeed = () => Math.floor(Math.random() * 0xffff_ffff);

  let engine: SimEngine = $state(createEngine({ n: ROOM_N, beta: REVEAL_BETA, seed: freshSeed() }));
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
  const winnerStyle = $derived(winner !== null ? styles[winner] : null);
  const headline = $derived(winnerStyle ? headlineForStyle(winnerStyle, history.length - 1) : null);

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
    const duration = history.length === 0 ? FIRST_MS : RERUN_MS;
    const progress = Math.min(1, elapsed / duration);
    const target = Math.round(easeInOutCubic(progress) * REVEAL_TRADES);
    const stepBy = target - engine.state.step;
    if (stepBy > 0) engine.step(stepBy);
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
      history.push({ seed: engine.config.seed ?? -1, winner: winner ?? 0, topShare });
    } else {
      measureTop();
    }
  });

  function run(): void {
    if (running) return;
    if (finished) {
      // every run rolls new dice — no curated seed, per the storyboard
      engine = createEngine({ n: ROOM_N, beta: REVEAL_BETA, seed: freshSeed() });
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

<div class="widget" aria-label="The main run: a hundred thousand fair trades, fresh dice every run">
  <p class="kicker">The room, for real this time</p>

  <RoomCanvas
    wealth={engine.state.wealth}
    {revision}
    {styles}
    {winner}
    height={320}
    label="One hundred shapes trading; one grows enormous while the rest shrink"
  />

  <div class="readout">
    <output aria-live="off">{countTrades(step)} trades</output>
    <div class="meter" role="img" aria-label={`Biggest circle holds ${percent(topShare)} of everything`}>
      <div class="meter-fill" style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest circle: {percent(topShare)}</span>
    </div>
  </div>

  {#if finished && winnerStyle && headline}
    <aside class="headline-card newspaper" in:fly={{ y: 10, duration: 350 }} aria-live="polite">
      <p class="masthead">The Morning Ledger <span class="edition">· markets</span></p>
      <div class="paper-body">
        <div class="portrait" aria-hidden="true">
          <svg viewBox="-30 -30 60 60" width="64" height="64">
            <path d={svgShapePath(winnerStyle.shape, 22)} fill={winnerStyle.fill} stroke={winnerStyle.stroke} stroke-width="2.4" fill-opacity="0.85" />
          </svg>
          <p class="cutline">the winner, this morning</p>
        </div>
        <div>
          <p class="headline-text">{headline.text}</p>
          <p class="headline-source">{headline.source}</p>
        </div>
      </div>
    </aside>
  {/if}

  <p class="caption" aria-live="polite">
    {#if !finished && !running}
      Everyone equal. Every trade fair. {guess ? `Your guess: ${guess.toLowerCase()}.` : 'You didn’t lock a guess — brave.'}
    {:else if running}
      No one is cheating. Watch the sizes.
    {:else if history.length <= 1}
      The winner — {winner !== null ? styleNoun(styles[winner]) : 'one of them'} — holds
      <strong>{percent(topShare)}</strong> of everything there is.
      {guess ? `You guessed: ${guess.toLowerCase()}.` : ''}
    {:else}
      {history.length} runs, {distinctWinners}
      {distinctWinners === 1 ? 'winner' : 'different winners'} — and a fresh headline every time.
      The crown moves. The crowning doesn’t.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={run} disabled={running}>
      {#if running}
        Trading…
      {:else}
        {finished ? 'Run it again — new dice' : `Run ${countTrades(REVEAL_TRADES)} trades`}
      {/if}
    </button>
    {#if history.length > 1}
      <ul class="history" aria-label="Winners so far">
        {#each history.slice(-4) as h (h.seed)}
          <li>{styleNoun(styles[h.winner])} took {percent(h.topShare)}</li>
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

  /* the morning paper: the one deliberate framed exception (news is content) */
  .newspaper {
    margin-block-start: 1.1rem;
  }

  .masthead {
    margin-block: 0 0.6rem;
    padding-block-end: 0.35rem;
    border-block-end: 2px solid #3c352b;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #3c352b;
  }

  .masthead .edition {
    float: inline-end;
    font-weight: 400;
    letter-spacing: 0.06em;
    color: #7a7061;
  }

  .paper-body {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .portrait {
    flex: none;
    text-align: center;
  }

  .portrait svg {
    display: block;
    margin-inline: auto;
    border: 1px solid #d8cdb9;
    background: #f8f3e7;
  }

  .cutline {
    margin-block: 0.3rem 0;
    max-inline-size: 5.5rem;
    font-size: 0.62rem;
    font-style: italic;
    color: #7a7061;
    line-height: 1.3;
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
