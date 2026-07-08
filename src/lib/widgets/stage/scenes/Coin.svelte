<script lang="ts">
  /**
   * The canonical coin (owner review 2026-07-08): minimal, open, instantly
   * money. One fixed size per context — wealth changes coin COUNT, never
   * coin size. Gold is reserved for money (agentStyle.ts).
   */
  interface Props {
    cx?: number;
    cy?: number;
    r?: number;
  }

  let { cx = 0, cy = 0, r = 16.6 }: Props = $props();
</script>

<g class="coin-token" transform={`translate(${cx} ${cy})`}>
  <circle r={r} class="face" />
  <circle r={r * 0.7} class="rim" />
  <text class="glyph" font-size={r * 1.15} dy="0.37em">$</text>
</g>

<style>
  .face {
    fill: var(--coin);
    stroke: var(--coin-ink);
    stroke-width: 2;
  }

  .rim {
    fill: none;
    stroke: var(--coin-ink);
    stroke-width: 1.2;
    opacity: 0.5;
  }

  .glyph {
    fill: var(--coin-ink);
    font-family: var(--font-mono);
    font-weight: 700;
    text-anchor: middle;
  }
</style>
