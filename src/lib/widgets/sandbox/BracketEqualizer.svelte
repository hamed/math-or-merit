<script lang="ts">
  import type { ProgressiveBracket } from '$lib/research';
  import { dollarsCompact, percent } from '../shared/format';

  interface Props {
    /** Average dollars per head — bracket thresholds are multiples of it. */
    avgDollars: number;
    onChange: (brackets: ProgressiveBracket[]) => void;
  }

  let { avgDollars, onChange }: Props = $props();

  /** Threshold steps as multiples of the room average (equalizer bands). */
  const MULTIPLIERS = [1, 2, 5, 10, 20, 50];
  const MAX_RATE = 0.4;

  let rates = $state([0, 0, 0.05, 0.1, 0.15, 0.25]);

  function emit(): void {
    const brackets: ProgressiveBracket[] = [];
    MULTIPLIERS.forEach((mult, i) => {
      if (rates[i] > 0) brackets.push({ above: mult * avgDollars, rate: rates[i] });
    });
    onChange(brackets);
  }

  // announce the defaults once and on any threshold-base change
  $effect(() => {
    void avgDollars;
    emit();
  });
</script>

<fieldset class="equalizer">
  <legend>progressive levy — rate above each line</legend>
  <div class="bands">
    {#each MULTIPLIERS as mult, i}
      <label class="band">
        <span class="rate">{percent(rates[i])}</span>
        <input
          type="range"
          min="0"
          max={MAX_RATE}
          step="0.01"
          bind:value={rates[i]}
          oninput={emit}
          aria-label={`Levy rate on wealth above ${mult} times the average`}
        />
        <span class="threshold">&gt;{mult}×</span>
        <span class="dollars">{dollarsCompact(mult * avgDollars)}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .equalizer {
    margin: 0;
    padding-block: 0.5rem 0.6rem;
    padding-inline: 0.8rem;
    border: 1px solid var(--line);
    border-radius: 0.7rem;
  }

  legend {
    padding-inline: 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
    text-transform: uppercase;
  }

  .bands {
    display: flex;
    gap: 0.7rem;
    justify-content: space-between;
  }

  .band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    color: var(--ink-mid);
  }

  .band input[type='range'] {
    writing-mode: vertical-lr;
    direction: rtl;
    inline-size: 1.4rem;
    block-size: 5.5rem;
    accent-color: var(--accent);
  }

  .rate {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  .threshold {
    font-weight: 700;
  }

  .dollars {
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }
</style>
