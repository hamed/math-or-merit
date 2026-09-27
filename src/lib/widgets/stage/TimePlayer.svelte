<script lang="ts">
  /**
   * The time player for a recorded run (owner review 2026-09-26: "minimal, like
   * a video player, a few icons"): back to the start, play or pause, a thin
   * scrubber, to the end, and how far in. Knows nothing about what it plays.
   */
  interface Props {
    frame: number;
    frames: number;
    playing: boolean;
    /** How far in, in words ("12,413 trades"). */
    label: string;
    names: { play: string; pause: string; start: string; end: string; scrub: string };
    onscrub: (frame: number) => void;
    onplay: () => void;
    onpause: () => void;
  }

  let { frame, frames, playing, label, names, onscrub, onplay, onpause }: Props = $props();
  const last = $derived(Math.max(0, frames - 1));
</script>

<div class="player">
  <button type="button" aria-label={names.start} onclick={() => onscrub(0)}>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4v12M16 4 7 10l9 6z" /></svg>
  </button>
  {#if playing}
    <button type="button" aria-label={names.pause} onclick={onpause}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4v12M14 4v12" /></svg>
    </button>
  {:else}
    <button type="button" aria-label={names.play} onclick={onplay}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path class="solid" d="M6 4l10 6-10 6z" /></svg>
    </button>
  {/if}
  <input
    type="range"
    min="0"
    max={last}
    value={frame}
    aria-label={names.scrub}
    aria-valuetext={label}
    style={`--p:${last ? (frame / last) * 100 : 100}%`}
    oninput={(e) => onscrub(+e.currentTarget.value)}
  />
  <button type="button" aria-label={names.end} onclick={() => onscrub(last)}>
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 4v12M4 4l9 6-9 6z" /></svg>
  </button>
  <span class="label">{label}</span>
</div>

<style>
  .player {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    min-inline-size: 0;
    font-family: var(--font-sans);
  }

  button {
    display: grid;
    place-items: center;
    flex: none;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-mid);
    cursor: pointer;
  }

  button:hover {
    color: var(--accent);
    background: rgb(139 63 43 / 8%);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  svg {
    inline-size: 1rem;
    block-size: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  svg .solid {
    fill: currentColor;
  }

  /* a thin line with a small knob; the part already played is the accent */
  input {
    flex: 1;
    min-inline-size: 3rem;
    block-size: 1.2rem;
    margin: 0 0.2rem;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input::-webkit-slider-runnable-track {
    block-size: 3px;
    border-radius: 2px;
    background: linear-gradient(to right, var(--accent) var(--p), var(--line) var(--p));
  }

  input::-moz-range-track {
    block-size: 3px;
    border-radius: 2px;
    background: linear-gradient(to right, var(--accent) var(--p), var(--line) var(--p));
  }

  input::-webkit-slider-thumb {
    appearance: none;
    inline-size: 12px;
    block-size: 12px;
    margin-block-start: -4.5px;
    border-radius: 50%;
    background: var(--accent);
  }

  input::-moz-range-thumb {
    inline-size: 12px;
    block-size: 12px;
    border: 0;
    border-radius: 50%;
    background: var(--accent);
  }

  input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .label {
    flex: none;
    margin-inline-start: 0.2rem;
    color: var(--ink-soft);
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>
