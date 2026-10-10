<script lang="ts" module>
  import type { Snippet } from 'svelte';

  /** A line of a card's memo, or a formula set on its own. */
  export type CardLine = string | { readonly formula: string };

  export interface Card {
    readonly id: string;
    readonly title: string;
    readonly lines: readonly CardLine[];
    /** A picture that helps it stick: the reader's own room, measured. */
    readonly picture?: Snippet;
    /** A toy to play with, inside the card, on request. */
    readonly toy?: Snippet;
  }
</script>

<script lang="ts">
  /**
   * The concept cards (iteration-2 brief 1.6; owner review 2026-09-26). Each
   * concept, once taught, drops a card onto a deck in the stage's corner. A
   * card is a short memo — a few lines and a picture, for short attention and
   * short memory — and some hold a toy to play with. Any card can be picked
   * from the deck: under the pointer, or once the deck is pressed, it fans out
   * into tabs, each card's title on its own edge (owner, 2026-10-09: "only the
   * top one can be picked up"). An open card can be leafed through. The first
   * is the rule card, which always reads the rule that is running.
   *
   * Knows no concept by name: cards are data.
   */
  interface Props {
    cards: readonly Card[];
    /** The card showing, or null for the closed deck. */
    open: string | null;
    ontoggle: (id: string | null) => void;
    /** The card whose toy is out, if any. */
    playing?: string | null;
    onplay?: (id: string | null) => void;
    label: string;
    closeLabel: string;
    playLabel: string;
    /** Reports the open card's height, so the talk can make room on a narrow stage. */
    onsize?: (height: number) => void;
  }

  let { cards, open, ontoggle, playing = null, onplay, label, closeLabel, playLabel, onsize }: Props = $props();

  const index = $derived(cards.findIndex((card) => card.id === open));
  const shown = $derived(index >= 0 ? cards[index] : null);
  const top = $derived(cards[cards.length - 1] ?? null);
  let height = $state(0);
  $effect(() => onsize?.(shown ? height : 0));

  /** KaTeX, loaded the first time a card with math opens. */
  let math = $state<typeof import('./math') | null>(null);
  const needsMath = (card: Card | null) => !!card?.lines.some((l) => typeof l !== 'string' || /\$[^$]+\$/.test(l));
  $effect(() => {
    if (!math && needsMath(shown)) import('./math').then((m) => (math = m));
  });

  function leaf(step: -1 | 1): void {
    if (index < 0) return;
    ontoggle(cards[(index + step + cards.length) % cards.length].id);
  }

  /** The deck fanned out into tabs, one per card, newest on top. */
  let fanned = $state(false);
  const newestFirst = $derived([...cards].reverse());
  let fan: HTMLUListElement | undefined = $state();

  function pick(id: string): void {
    fanned = false;
    ontoggle(id);
  }

  /** Focus is on its way from the pile to the tabs: the pile leaving the page is not the reader leaving the deck. */
  let moving = false;
  function spread(): void {
    moving = true;
    fanned = true;
    // from the keyboard, straight onto the first tab
    requestAnimationFrame(() => {
      fan?.querySelector('button')?.focus({ preventScroll: true });
      moving = false;
    });
  }
</script>

{#if top}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="cards"
    onpointerenter={(e) => e.pointerType === 'mouse' && (fanned = true)}
    onpointerleave={(e) => e.pointerType === 'mouse' && (fanned = false)}
    onfocusout={(e) => !moving && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node) && (fanned = false)}
  >
    {#if fanned}
      <ul class="fan" bind:this={fan} aria-label={label}>
        {#each newestFirst as card, k (card.id)}
          <li style={`--k:${k}`}>
            <button type="button" class="tab" class:on={shown?.id === card.id} aria-current={shown?.id === card.id ? 'true' : undefined} onclick={() => pick(card.id)}>
              {card.title}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <button
        type="button"
        class="stack"
        aria-expanded={fanned}
        aria-label={`${label}: ${cards.map((c) => c.title).join(', ')}`}
        onclick={spread}
      >
        {#each cards as card, i (card.id)}
          <span class="back" style={`--i:${cards.length - 1 - i}`}></span>
        {/each}
        <span class="face">{top.title}</span>
        {#if cards.length > 1}<span class="count">{cards.length}</span>{/if}
      </button>
    {/if}

    {#if shown}
      <section class="card" class:wide={playing === shown.id} aria-label={shown.title} bind:clientHeight={height}>
        <h2>{shown.title}</h2>
        {#if shown.picture}<div class="picture">{@render shown.picture()}</div>{/if}
        <ol>
          {#each shown.lines as line, i (i)}
            {#if typeof line !== 'string'}
              <li class="formula">{#if math}{@html math.tex(line.formula, true)}{:else}<code>{line.formula}</code>{/if}</li>
            {:else if math && math.hasMath(line)}
              <li>{@html math.lineWithMath(line)}</li>
            {:else}
              <li>{line}</li>
            {/if}
          {/each}
        </ol>
        {#if shown.toy}
          {#if playing === shown.id}
            <div class="toy">{@render shown.toy()}</div>
          {:else}
            <button type="button" class="link" onclick={() => onplay?.(shown.id)}>{playLabel}</button>
          {/if}
        {/if}
        <p class="nav">
          {#if cards.length > 1}
            <button type="button" class="link" aria-label="‹" onclick={() => leaf(-1)}>‹</button>
            <span>{index + 1} / {cards.length}</span>
            <button type="button" class="link" aria-label="›" onclick={() => leaf(1)}>›</button>
          {/if}
          <button type="button" class="link close" onclick={() => ontoggle(null)}>{closeLabel}</button>
        </p>
      </section>
    {/if}
  </div>
{/if}

<style>
  .cards {
    position: absolute;
    z-index: 7;
    inset-block-start: 0.8rem;
    inset-inline-start: 0.9rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    max-block-size: calc(100% - 1.6rem);
    font-family: var(--font-hand);
  }

  .stack {
    position: relative;
    flex: none;
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

  .stack:hover .face {
    border-color: var(--accent);
  }

  /* how many cards are in the deck: the ones under the top are there to pick */
  .count {
    position: absolute;
    inset-block-start: -0.55rem;
    inset-inline-end: -0.55rem;
    min-inline-size: 1.25rem;
    padding: 0.05rem 0.3rem;
    border-radius: 999px;
    background: var(--accent);
    color: var(--paper-bright);
    font-family: var(--font-sans);
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
  }

  /* the deck fanned: every card's edge, its title on it, one tab each */
  .fan {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .fan li {
    margin: 0;
    animation: fan 200ms ease-out both;
    animation-delay: calc(var(--k) * 25ms);
  }

  .fan li + li {
    margin-block-start: -0.2rem;
  }

  .tab {
    min-inline-size: 7.5rem;
    padding-block: 0.4rem;
    padding-inline: 0.75rem;
    border: 1.5px solid var(--line);
    border-radius: 0.45rem;
    background: var(--paper-bright);
    box-shadow: 0 1px 2px rgb(40 37 31 / 12%);
    color: var(--ink);
    font: inherit;
    font-size: 0.98rem;
    font-weight: 700;
    text-align: start;
    cursor: pointer;
    transform: rotate(calc((var(--k) - 1) * 0.4deg));
  }

  .tab:hover,
  .tab:focus-visible {
    position: relative;
    border-color: var(--accent);
    color: var(--accent-deep);
    transform: translateX(0.3rem);
    outline: none;
  }

  .tab.on {
    border-color: var(--accent);
    background: rgb(189 98 69 / 8%);
  }

  .stack:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
    border-radius: 0.45rem;
  }

  .card {
    inline-size: min(20rem, calc(100vw - 2rem));
    overflow-y: auto;
    padding-block: 0.65rem 0.45rem;
    padding-inline: 1rem;
    border: 1.5px solid var(--ink-soft);
    border-radius: 0.7rem;
    background: var(--paper-bright);
    box-shadow: 0 3px 10px rgb(40 37 31 / 14%);
    color: var(--ink);
    animation: open 220ms ease-out both;
  }

  .card.wide {
    inline-size: min(34rem, calc(100vw - 2rem));
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

  .picture {
    margin-block: 0.2rem 0.4rem;
  }

  .picture :global(svg) {
    display: block;
    inline-size: 100%;
    block-size: auto;
    max-block-size: 11rem;
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

  /* a formula stands on its own line, unnumbered, the way the script sets it */
  .card li.formula {
    /* a block, not a list item: the numbering skips it */
    display: block;
    margin-block: 0.35rem;
    text-align: center;
    overflow-x: auto;
  }

  .toy {
    margin-block-start: 0.5rem;
    font-family: var(--font-sans);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.35rem 0 0;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .link {
    padding: 0.2rem 0.1rem;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: 0.98rem;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }

  .close {
    margin-inline-start: auto;
  }

  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-14px) rotate(-6deg);
    }
  }

  @keyframes fan {
    from {
      opacity: 0;
      transform: translateY(-0.6rem);
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
    .card,
    .fan li {
      animation: none;
    }
  }
</style>
