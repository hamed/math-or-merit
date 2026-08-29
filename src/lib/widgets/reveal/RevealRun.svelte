<script lang="ts">
  import { onMount } from 'svelte';
  import { createEngine, type SimEngine } from '$lib/sim';
  import { measureWealth } from '$lib/research';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import NewsFlash from '../sandbox/NewsFlash.svelte';
  import { collectStats } from '../sandbox/newsroom';
  import { createTicker } from '../shared/ticker';
  import { countTrades, percent } from '../shared/format';
  import { radiusScale, roomPositions } from '../shared/layout';
  import { logRun, predictionLabel, session } from '../shared/runLog.svelte';
  import { REVEAL_BETA, REVEAL_TRADES, ROOM_N, START_DOLLARS } from '../shared/presets';
  import { assignStyles, styleNoun } from '../shared/agentStyle';

  // Display-only styles, dealt before any run (agentStyle.ts GUARD: the sim
  // has no import path to them — the morning paper below is the only consumer).
  const styles = assignStyles(ROOM_N);

  // First run is the dramatic one; reruns are quick. Every run rolls fresh
  // dice — no seed, no seed concept (owner review 2026-07-08).
  const FIRST_MS = 9000;
  const RERUN_MS = 4200;
  const ROOM_H = 320;
  const TOTAL_DOLLARS = ROOM_N * START_DOLLARS;

  const freshSeed = () => Math.floor(Math.random() * 0xffff_ffff);

  let engine: SimEngine = $state(createEngine({ n: ROOM_N, beta: REVEAL_BETA, seed: freshSeed() }));
  let revision = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let elapsed = 0;
  let topShare = $state(0);
  let winner = $state<number | null>(null);
  let history = $state<{ seed: number; winner: number; topShare: number }[]>([]);

  // The morning paper is the sandbox's: it prints ON the room, over whoever
  // the camera caught, instead of arriving as a card underneath it.
  let roomW = $state(0);
  let newsOpen = $state(false);
  let newsSubject = $state(-1);
  let newsRun = $state(0);

  const guess = $derived(predictionLabel(session.prediction));
  const step = $derived.by(() => {
    void revision;
    return engine.state.step;
  });

  const newsPos = $derived.by(() => {
    void revision;
    if (newsSubject < 0 || roomW === 0) return { x: 0, y: 0, r: 10 };
    const p = roomPositions(ROOM_N, roomW, ROOM_H)[newsSubject];
    const r = radiusScale(ROOM_N, roomW, ROOM_H) * Math.sqrt(Math.max(0, engine.state.wealth[newsSubject]));
    return { x: p.x, y: p.y, r: Math.max(6, r) };
  });

  /** Where the photographed one stands, in dollars and in the pecking order. */
  const newsStanding = $derived.by(() => {
    void revision;
    if (newsSubject < 0) return { dollars: 0, percentile: 0 };
    const w = engine.state.wealth;
    let poorer = 0;
    for (let i = 0; i < w.length; i++) if (w[i] < w[newsSubject]) poorer++;
    return { dollars: w[newsSubject] * TOTAL_DOLLARS, percentile: poorer / ROOM_N };
  });

  const newsStats = $derived.by(() => {
    void revision;
    const w = engine.state.wealth;
    const m = measureWealth(w);
    // No levy exists yet in the essay, and this beat keeps no volume series.
    return collectStats(
      { n: ROOM_N, startDollars: START_DOLLARS, taxRate: 0, dollarsOf: (i) => w[i] * TOTAL_DOLLARS, volume: [] },
      m.gini,
      m.topShare,
    );
  });

  function photograph(index: number): void {
    if (running) return;
    newsSubject = index;
    newsRun++;
    newsOpen = true;
  }

  /** The canvas is pointer-only; this is the keyboard path to the same page. */
  function photographPoorest(): void {
    const w = engine.state.wealth;
    let pick = 0;
    for (let i = 1; i < w.length; i++) if (w[i] < w[pick]) pick = i;
    photograph(pick);
  }

  function closeNews(): void {
    newsOpen = false;
    newsSubject = -1;
  }

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
        beta: engine.config.beta,
        trades: engine.state.step,
        wealth,
        winner: winner ?? 0,
        topShare,
      });
      history.push({ seed: engine.config.seed ?? -1, winner: winner ?? 0, topShare });
      newsSubject = winner ?? 0;
      newsRun = history.length - 1; // same headline rotation as before
      newsOpen = true;
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
    closeNews();
    revision++;
    running = true;
    ticker.start();
  }

  onMount(() => () => ticker.stop());

  const distinctWinners = $derived(new Set(history.map((h) => h.winner)).size);
</script>

<div class="widget" aria-label="The main run: a hundred thousand fair trades, fresh dice every run">
  <p class="kicker">The room, for real this time</p>

  <div class="room-frame" bind:clientWidth={roomW}>
    <RoomCanvas
      wealth={engine.state.wealth}
      {revision}
      {styles}
      {winner}
      height={ROOM_H}
      onTap={finished && !newsOpen ? photograph : null}
      label={finished
        ? 'One hundred shapes after the trading; tap any one of them to put them on the front page'
        : 'One hundred shapes trading; one grows enormous while the rest shrink'}
    />
    {#if newsOpen && newsSubject >= 0}
      <NewsFlash
        paper="ledger"
        style={styles[newsSubject]}
        pos={newsPos}
        run={newsRun}
        dollars={newsStanding.dollars}
        percentile={newsStanding.percentile}
        stats={newsStats}
        onClose={closeNews}
      />
    {/if}
  </div>

  <div class="readout">
    <output aria-live="off">{countTrades(step)} trades</output>
    <div class="meter" role="img" aria-label={`Biggest circle holds ${percent(topShare)} of everything`}>
      <div class="meter-fill" style={`inline-size: ${Math.min(100, topShare * 100)}%`}></div>
      <span class="meter-label">biggest circle: {percent(topShare)}</span>
    </div>
  </div>

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
    {#if finished}
      <button type="button" onclick={photographPoorest} disabled={newsOpen}>Photograph the last-placed</button>
    {/if}
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
  /* the news prints inside the room, anchored on its subject */
  .room-frame {
    position: relative;
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
