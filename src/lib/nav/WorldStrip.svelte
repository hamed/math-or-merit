<script lang="ts">
  /**
   * A shared world, on arrival (owner, 2026-10-10): a friend's link carries the
   * levy they chose (`?world=0.01`); the page opens at the start as always,
   * with one quiet strip in the friend's colour. Nothing is stored.
   */
  import { formatNumber, say } from '$lib/i18n';
  import { parseWorld, worldColour } from '$lib/widgets/stage/scenes/pair/world';

  const levy = typeof location === 'undefined' ? null : parseWorld(location.search);
  const tone = levy === null ? null : worldColour(levy);
  let open = $state(levy !== null);
</script>

{#if open && levy !== null && tone}
  <aside class="world-strip" style:--tone-fill={tone.fill} style:--tone-stroke={tone.stroke}>
    <span class="swatch" aria-hidden="true"></span>
    <p>{say('veil_strip', { levy: formatNumber(levy, { style: 'percent', maximumFractionDigits: 2 }) })}</p>
    <button type="button" onclick={() => (open = false)}>{say('veil_close')}</button>
  </aside>
{/if}

<style>
  .world-strip {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0.75rem auto 0;
    padding: 0.55rem 0.9rem;
    max-inline-size: min(44rem, calc(100% - 32px));
    border: 1.5px solid var(--tone-stroke);
    border-radius: 0.8rem;
    background: color-mix(in srgb, var(--tone-fill) 45%, var(--paper, #f4efe4));
    font-family: var(--font-sans);
    font-size: 0.9rem;
    color: var(--ink);
  }

  .world-strip p {
    flex: 1;
    margin: 0;
  }

  .swatch {
    flex: none;
    inline-size: 1.4rem;
    block-size: 1.4rem;
    border: 1.5px solid var(--tone-stroke);
    border-radius: 50%;
    background: var(--tone-fill);
  }

  button {
    flex: none;
    padding: 0.25rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper-bright, #fffaf0);
    color: var(--ink);
    font: inherit;
    font-weight: 650;
    cursor: pointer;
  }
</style>
