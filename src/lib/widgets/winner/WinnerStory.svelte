<script lang="ts">
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import { completedRoomRun, type LoggedRun } from '../shared/roomRun';
  import { assignShapes, headlineFor, shapeNoun } from '../shared/traits';
  import { percent } from '../shared/format';
  import { REVEAL_TRADES, ROOM_N, WINNER_FIRST_SEED, WINNER_RERUN_SEED } from '../shared/presets';

  interface Props {
    /** 'first' shows the curated square-crowning run; 'rerun' rolls new rooms. */
    mode: 'first' | 'rerun';
  }

  let { mode }: Props = $props();

  // GUARD (beat 13): shapes are dealt round-robin before any run and live only
  // in this display layer. The engine below never sees them — it cannot: the
  // sim package has no import path to traits.
  const shapes = assignShapes(ROOM_N);

  // `mode` is fixed per essay slot; reading it once at init is intentional.
  // svelte-ignore state_referenced_locally
  const firstSeed = mode === 'first' ? WINNER_FIRST_SEED : WINNER_RERUN_SEED;

  let runCount = $state(0);
  let run = $state<LoggedRun>(completedRoomRun(firstSeed, REVEAL_TRADES));
  let revision = $state(0);

  const winnerShape = $derived(shapes[run.winner]);
  const headline = $derived(headlineFor(winnerShape, runCount));

  function again(): void {
    runCount++;
    run = completedRoomRun(Math.floor(Math.random() * 0xffff_ffff), REVEAL_TRADES);
    revision++;
  }
</script>

<div class="widget" aria-label="The morning-after headline for the room's winner">
  <div class="headline-card winner-headline" aria-live="polite">
    <p class="headline-text">{headline.text}</p>
    <p class="headline-source">{headline.source}</p>
  </div>

  <RoomCanvas
    wealth={run.wealth}
    {revision}
    {shapes}
    winner={run.winner}
    height={300}
    label={`The finished room: the winner, ${shapeNoun(winnerShape)}, holds ${percent(run.topShare)} of everything`}
  />

  <p class="caption" aria-live="polite">
    The winner: <strong>{shapeNoun(winnerShape)}</strong>, holding {percent(run.topShare)} of the room.
    {#if mode === 'rerun' && runCount > 0}
      A fresh room, a fresh coin — and the headline is just as sure of itself.
    {:else}
      The shapes were dealt out before the first trade, at random, and never touched the game.
    {/if}
  </p>

  {#if mode === 'rerun'}
    <div class="toolbar">
      <button class="primary" type="button" onclick={again}>
        {runCount === 0 ? 'Run the room again' : 'Convinced? Or once more'}
      </button>
      {#if runCount > 0}
        <output>{runCount + 1} rooms, {runCount + 1} headlines</output>
      {/if}
    </div>
  {/if}
</div>
