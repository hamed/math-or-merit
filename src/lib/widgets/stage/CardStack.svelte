<script lang="ts" module>
  export interface Card {
    readonly id: string;
    readonly title: string;
    readonly lines: readonly string[];
  }
</script>

<script lang="ts">
  /**
   * The concept cards (iteration-2 brief 1.6). Each concept, once taught,
   * drops a small card onto a stack in the stage's corner; tapping the stack
   * opens the cards — short, clean definitions. The first is the rule card,
   * like the one in a board game box, and it always reads the rule that is
   * running (the scene hands it the live numbers).
   *
   * Knows no concept by name: cards are data (id, title, lines).
   */
  interface Props {
    cards: readonly Card[];
    /** The card showing, or null for the closed stack. */
    open: string | null;
    ontoggle: (id: string | null) => void;
    /** What a screen reader calls the stack. */
    label: string;
    closeLabel: string;
    /** Reports the open card's height, so the talk can make room on a narrow stage. */
    onsize?: (height: number) => void;
  }

  let { cards, open, ontoggle, label, closeLabel, onsize }: Props = $props();

  const shown = $derived(cards.find((card) => card.id === open) ?? null);
  const top = $derived(cards[cards.length - 1] ?? null);
  let height = $state(0);
  $effect(() => onsize?.(shown ? height : 0));
</script>

{#if top}
  <div class="cards">
    <button
      type="button"
      class="stack"
      aria-expanded={shown !== null}
      aria-label={`${label}: ${cards.map((c) => c.title).join(', ')}`}
      onclick={() => ontoggle(shown ? null : top.id)}
    >
      {#each cards as card, i (card.id)}
        <span class="back" style={`--i:${cards.length - 1 - i}`}></span>
      {/each}
      <span class="face">{top.title}</span>
    </button>

    {#if shown}
      <section class="card" aria-label={shown.title} bind:clientHeight={height}>
        <h2>{shown.title}</h2>
        <ol>
          {#each shown.lines as line, i (i)}<li>{line}</li>{/each}
        </ol>
        <button type="button" class="close" onclick={() => ontoggle(null)}>{closeLabel}</button>
      </section>
    {/if}
  </div>
{/if}

<style>
  .cards {
    position: absolute;
    z-index: 5;
    inset-block-start: 0.8rem;
    inset-inline-start: 0.9rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    font-family: var(--font-hand);
  }

  .stack {
    position: relative;
    min-inline-size: 5.6rem;
    min-block-size: 2.75rem;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    animation: drop 420ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  .back,
  .face {
    position: absolute;
    inset: 0;
    border: 1.5px solid var(--line);
    border-radius: 0.45rem;
    background: var(--paper-bright);
    box-shadow: 0 1px 2px rgb(40 37 31 / 10%);
  }

  .back {
    transform: translate(calc(var(--i) * 3px), calc(var(--i) * -3px)) rotate(calc(var(--i) * 2deg));
  }

  .face {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 0.6rem;
    color: var(--ink);
    font-size: 0.95rem;
    font-weight: 700;
  }

  .stack:hover .face,
  .stack[aria-expanded='true'] .face {
    border-color: var(--accent);
  }

  .stack:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
    border-radius: 0.45rem;
  }

  .card {
    inline-size: min(19rem, calc(100vw - 2rem));
    padding-block: 0.65rem 0.45rem;
    padding-inline: 1rem;
    border: 1.5px solid var(--ink-soft);
    border-radius: 0.7rem;
    background: var(--paper-bright);
    box-shadow: 0 3px 10px rgb(40 37 31 / 14%);
    color: var(--ink);
    animation: open 220ms ease-out both;
  }

  /* a card, not a chapter: none of the essay's heading and list rhythm */
  .card h2 {
    margin: 0 0 0.3rem;
    padding: 0;
    border: 0;
    font-family: inherit;
    font-size: 1.12rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0;
  }

  .card ol {
    margin: 0;
    padding-inline-start: 1.25rem;
    font-size: 0.98rem;
  }

  .card li {
    margin: 0;
    line-height: 1.3;
  }

  .card li + li {
    margin-block-start: 0.15rem;
  }

  .close {
    margin-block-start: 0.25rem;
    padding: 0.2rem 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: 0.95rem;
    text-decoration: underline;
    cursor: pointer;
  }

  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-14px) rotate(-6deg);
    }
  }

  @keyframes open {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stack,
    .card {
      animation: none;
    }
  }
</style>
