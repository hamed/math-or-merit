<script lang="ts" module>
  /**
   * Curated slider stops (owner review 2026-07-14): the slider steps over a
   * log-ish ladder of round values — it always LANDS on a round number, which
   * is the snap effect with none of the epsilon fiddling.
   */
  export const RATE_STOPS: readonly number[] = [
    0, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5,
    0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999, 0.9999, 1,
  ];

  export const MONEY_STOPS: readonly number[] = [
    1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000,
    200_000, 500_000, 1_000_000,
  ];
</script>

<script lang="ts">
  interface Props {
    label: string;
    /** The live value. Slider mode snaps it to a stop; expert mode is raw. */
    value: number;
    stops: readonly number[];
    format: (v: number) => string;
    /**
     * Expert mode: a raw number input, deliberately unclamped — negative
     * taxes and 250% stakes are part of the curriculum.
     */
    expert?: boolean;
    disabled?: boolean;
    /** Fires on any user change (slider input or committed text). */
    onChange?: (v: number) => void;
  }

  let { label, value = $bindable(), stops, format, expert = false, disabled = false, onChange }: Props = $props();

  const index = $derived.by(() => {
    let best = 0;
    for (let i = 1; i < stops.length; i++) {
      if (Math.abs(stops[i] - value) < Math.abs(stops[best] - value)) best = i;
    }
    return best;
  });

  function fromSlider(e: Event): void {
    const i = Number((e.currentTarget as HTMLInputElement).value);
    value = stops[Math.max(0, Math.min(stops.length - 1, i))];
    onChange?.(value);
  }

  function fromText(e: Event): void {
    const raw = Number((e.currentTarget as HTMLInputElement).value);
    if (Number.isFinite(raw)) {
      value = raw;
      onChange?.(value);
    }
  }
</script>

<label class="dial" class:disabled>
  <span>{label} <strong>{format(value)}</strong></span>
  {#if expert}
    <input class="raw" type="number" step="any" {value} {disabled} onchange={fromText} aria-label={`${label}, raw number`} />
  {:else}
    <input type="range" min="0" max={stops.length - 1} step="1" value={index} {disabled} oninput={fromSlider} aria-label={label} />
  {/if}
</label>

<style>
  .dial {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-family: var(--font-sans);
    font-size: 0.68rem;
    color: var(--ink-mid);
    font-variant-numeric: tabular-nums;
  }

  .dial.disabled {
    opacity: 0.45;
  }

  .dial strong {
    font-weight: 700;
  }

  .dial input[type='range'] {
    inline-size: 100%;
    accent-color: var(--accent);
  }

  .raw {
    inline-size: 7rem;
    min-block-size: 1.7rem;
    padding-block: 0.15rem;
    padding-inline: 0.5rem;
    border: 1px solid #a99980;
    border-radius: 0.4rem;
    background: var(--paper-bright);
    color: #3c352b;
    font-size: 0.74rem;
    font-variant-numeric: tabular-nums;
  }
</style>
