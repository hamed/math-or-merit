<script lang="ts">
  import { percent } from '../shared/format';
  import { session } from '../shared/runLog.svelte';
  import { interpretRuns } from './interpretation';

  const result = $derived(interpretRuns(session.runs));
</script>

<div aria-live="polite">
  {#if result === null}
    <p>The room has not answered yet. Good. Prediction first.</p>
  {:else}
    <p>The largest shape in this run holds <strong>{percent(result.latest.topShare)}</strong> of all wealth.</p>

    <p>Every trade was fair. No coin was loaded. Nobody cheated. Nobody was smarter.</p>

    <p>
      {#if result.winnerChange === 'same'}
        The same shape finished first again. A fair coin is allowed to repeat itself.
      {:else if result.winnerChange === 'different'}
        This time a different shape finished first.
      {:else}
        Chance chose which shape finished first.
      {/if}
      The process needed no difference in merit to make the gap.
    </p>
  {/if}
</div>
