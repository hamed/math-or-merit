<script lang="ts">
  import { onMount } from 'svelte';
  import {
    IncrementalOutcomeRun,
    measureWealth,
    type OutcomeMeasurement,
  } from '$lib/research';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { assignStyles } from '../shared/agentStyle';
  import { countTrades, percent } from '../shared/format';
  import { createFixedTicker } from '../shared/ticker';
  import {
    MATCHED_BETA,
    MATCHED_LEVY_RATE,
    MATCHED_PROTOCOL,
    matchedRunConfigs,
  } from './matchedComparison';

  const TRADES_PER_FRAME = 750;
  const styles = assignStyles(MATCHED_PROTOCOL.n).map((style) => ({ ...style, shape: 'circle' as const }));

  function freshSeed(): number {
    return Math.floor(Math.random() * 0x1_0000_0000);
  }

  function createPair(seed: number) {
    const [without, withLevy] = matchedRunConfigs(seed);
    return {
      seed,
      control: new IncrementalOutcomeRun(without),
      treatment: new IncrementalOutcomeRun(withLevy),
    };
  }

  let pair = $state(createPair(freshSeed()));
  let running = $state(false);
  let finished = $state(false);
  let revision = $state(0);
  let trades = $state(0);
  let controlEffective = $state(MATCHED_PROTOCOL.n);
  let treatmentEffective = $state(MATCHED_PROTOCOL.n);
  let controlResult = $state<OutcomeMeasurement | null>(null);
  let treatmentResult = $state<OutcomeMeasurement | null>(null);

  function readLive(): void {
    controlEffective = measureWealth(pair.control.wealth).effectiveParticipants;
    treatmentEffective = measureWealth(pair.treatment.wealth).effectiveParticipants;
  }

  function resetPair(seed = pair.seed): void {
    ticker.stop();
    pair = createPair(seed);
    running = false;
    finished = false;
    trades = 0;
    controlResult = null;
    treatmentResult = null;
    controlEffective = MATCHED_PROTOCOL.n;
    treatmentEffective = MATCHED_PROTOCOL.n;
    revision++;
  }

  const ticker = createFixedTicker(() => {
    pair.control.step(TRADES_PER_FRAME);
    pair.treatment.step(TRADES_PER_FRAME);
    trades = pair.control.trades;
    revision++;
    readLive();
    if (!pair.control.done) return;

    ticker.stop();
    running = false;
    finished = true;
    controlResult = pair.control.result();
    treatmentResult = pair.treatment.result();
    controlEffective = controlResult.effectiveParticipants;
    treatmentEffective = treatmentResult.effectiveParticipants;
  });

  function run(): void {
    if (running) return;
    if (finished) resetPair(freshSeed());
    running = true;
    ticker.start();
  }

  onMount(() => () => ticker.stop());
</script>

<div class="widget" aria-label="Two matched rooms compare fair trades without and with a shared counterforce">
  <p class="kicker">Same partners. Same tosses. One changed rule.</p>

  <div class="rooms">
    <section aria-label="Matched room without a levy">
      <h3>Trades only</h3>
      <RoomCanvas
        wealth={pair.control.wealth}
        {revision}
        {styles}
        height={230}
        label={`One hundred people trading with a ${percent(MATCHED_BETA)} stake and no levy`}
      />
      <div class="measurements">
        <p><span>effective participants</span><strong>{controlEffective.toFixed(1)} of {MATCHED_PROTOCOL.n}</strong></p>
        <p><span>ordinary turnover</span><strong>{controlResult ? `${controlResult.wealthTurnover.toFixed(3)} roomfuls` : '—'}</strong></p>
      </div>
    </section>

    <div class="versus" aria-hidden="true">same luck</div>

    <section aria-label="Matched room with a levy and equal return">
      <h3>Trades + shared return</h3>
      <RoomCanvas
        wealth={pair.treatment.wealth}
        {revision}
        {styles}
        height={230}
        label={`The same trades with a ${percent(MATCHED_LEVY_RATE, 1)} levy and equal return every round`}
      />
      <div class="measurements">
        <p><span>effective participants</span><strong>{treatmentEffective.toFixed(1)} of {MATCHED_PROTOCOL.n}</strong></p>
        <p><span>ordinary turnover</span><strong>{treatmentResult ? `${treatmentResult.wealthTurnover.toFixed(3)} roomfuls` : '—'}</strong></p>
      </div>
    </section>
  </div>

  <p class="caption" aria-live="polite">
    {#if finished && controlResult && treatmentResult}
      Same random script, {countTrades(MATCHED_PROTOCOL.trades)} trades each. The shared rule left this run equivalent to
      {treatmentResult.effectiveParticipants.toFixed(1)} equal participants instead of {controlResult.effectiveParticipants.toFixed(1)};
      ordinary trades moved {treatmentResult.wealthTurnover.toFixed(3)} roomfuls per measured round instead of
      {controlResult.wealthTurnover.toFixed(3)}.
    {:else if running}
      Both rooms are reading the same list of partners and coin tosses: {countTrades(trades)} of {countTrades(MATCHED_PROTOCOL.trades)} trades.
    {:else}
      One fresh random script will drive both rooms. The right room adds a {percent(MATCHED_LEVY_RATE, 1)} levy plus equal return every round.
    {/if}
  </p>

  <div class="toolbar">
    <button class="primary" type="button" onclick={run} disabled={running}>
      {running ? 'Comparing…' : finished ? 'Run another matched pair' : 'Run both rooms'}
    </button>
    <button type="button" onclick={() => resetPair()} disabled={trades === 0}>Back to equal</button>
    <output>{countTrades(trades)} trades each</output>
  </div>
</div>

<style>
  .rooms {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 0.7rem;
    align-items: center;
  }

  section {
    min-inline-size: 0;
  }

  h3 {
    margin-block: 0 0.15rem;
    color: #5c5344;
    font-size: 0.82rem;
    text-align: center;
  }

  .versus {
    color: #8b3f2b;
    font-size: 0.68rem;
    font-style: italic;
    writing-mode: vertical-rl;
  }

  .measurements {
    display: grid;
    gap: 0.35rem;
    margin-block-start: 0.4rem;
  }

  .measurements p {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 0;
    padding-block: 0.35rem;
    border-block-end: 1px solid #d8cdb9;
    color: #756c5d;
    font-size: 0.68rem;
  }

  .measurements strong {
    color: #5c5344;
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  .toolbar output {
    margin-inline-start: auto;
    color: #756c5d;
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 40rem) {
    .rooms {
      grid-template-columns: 1fr;
    }

    .versus {
      justify-self: center;
      writing-mode: horizontal-tb;
    }
  }
</style>
