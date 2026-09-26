<script lang="ts">
  /**
   * One comic speech bubble on a stage (iteration-2 brief 3.1; A2).
   *
   * HTML, not SVG text: Farsi shaping and bidi only work in HTML, and the size
   * is MEASURED, never fixed — a longer translation grows the bubble. The panel
   * that owns it measures it (`w`, `h`), decides where it goes (`bubbles.ts`),
   * and hands back its place and tail. The outline is drawn around whatever
   * size that is.
   *
   * One sentence per line; the lines arrive one after another (`shown`), each
   * taking its space from the start so nothing jumps. A screen reader gets the
   * whole bubble at once, name first.
   */
  import { fade } from 'svelte/transition';
  import Coin from './scenes/Coin.svelte';
  import { bubbleLines, comicOutline, shoutSegments, type BubbleChoice, type Tail } from './bubbles';
  import { PROTAGONISTS, SPEAKER_TONES } from '../shared/agentStyle';
  import type { Speaker } from './steps';

  interface Props {
    /** Stable per bubble: seeds its wobble. */
    id: string;
    text: string;
    /** Whose colours it wears; null for someone not yet introduced. */
    speaker: Speaker | null;
    /** The name a screen reader says first ("Blue"). */
    name?: string;
    x: number;
    y: number;
    /** None for a logged event. */
    tail: Tail | null;
    /** A line someone says, or something that happened (a coin landed), logged. */
    kind?: 'line' | 'event';
    /** An event's coin: the face that landed, in its owner's colour. */
    coin?: Speaker;
    /** The widest it may grow, px: a bubble never spans its whole column. */
    maxWidth?: number;
    /** How many lines are showing; the rest keep their space, unseen. */
    shown?: number;
    /** Scrolled out of the top of a full panel. */
    gone?: boolean;
    /** Reports the measured size, for the panel's layout. */
    onsize?: (w: number, h: number) => void;
    /** The reader's choices, as links inside the bubble (3.1). */
    choices?: readonly BubbleChoice[];
    /** The pointer is resting on it: chit-chat waits. */
    onrest?: (on: boolean) => void;
    reduced?: boolean;
  }

  let {
    id,
    text,
    speaker,
    name = '',
    x,
    y,
    tail,
    kind = 'line',
    coin,
    maxWidth = 368,
    shown = Infinity,
    gone = false,
    onsize,
    choices,
    onrest,
    reduced = false,
  }: Props = $props();

  let w = $state(0);
  let h = $state(0);
  $effect(() => onsize?.(w, h));

  const lines = $derived(bubbleLines(text));
  const plain = $derived(lines.join(' ').replace(/\*\*/g, ''));
  const tone = $derived(SPEAKER_TONES[speaker ?? 'none']);
  const outline = $derived(w > 0 && h > 0 ? comicOutline(w, h, tail, id) : '');
  /** Moves between places glide, but the first placement never slides in from a corner. */
  let settled = $state(false);

  $effect(() => {
    if (w > 0 && !settled) requestAnimationFrame(() => (settled = true));
  });
</script>

<!-- the pointer resting on a bubble holds chit-chat (3.2); a click on it still steps -->
<div
  class="bubble"
  class:event={kind === 'event'}
  class:settled
  class:gone
  class:still={reduced}
  data-speaker={speaker ?? 'none'}
  style={`left:${x}px; top:${y}px; max-inline-size:${maxWidth}px; --ink:${tone.ink}; visibility:${w > 0 ? 'visible' : 'hidden'}`}
  bind:clientWidth={w}
  bind:clientHeight={h}
  onpointerenter={() => onrest?.(true)}
  onpointerleave={() => onrest?.(false)}
  role="presentation"
  out:fade|global={{ duration: reduced ? 0 : 260 }}
>
  {#if outline}
    <svg class="outline" width={w} height={h} aria-hidden="true">
      <path d={outline} class="paper" />
      <path
        d={outline}
        fill={kind === 'event' ? 'none' : tone.wash}
        stroke={kind === 'event' ? 'var(--line)' : tone.edge}
        stroke-width={kind === 'event' ? 1.3 : 2.1}
        stroke-linejoin="round"
      />
    </svg>
  {/if}
  <p class="words">
    {#if coin}
      <svg class="coin" viewBox="-17 -17 34 34" aria-hidden="true"
        ><Coin r={16} face={coin === 'red' ? 'front' : 'back'} tint={PROTAGONISTS[coin].fill} /></svg
      >
    {/if}
    <span class="visually-hidden">{name ? `${name}: ` : ''}{plain}</span>
    <span class="lines" aria-hidden="true">
      {#each lines as line, i (i)}
        <span class="line" class:waiting={i >= shown}
          >{#each shoutSegments(line) as segment, k (k)}{#if segment.shout}<strong class="shout">{segment.text}</strong
              >{:else}{segment.text}{/if}{/each}</span
        >
      {/each}
    </span>
  </p>
  {#if choices && choices.length > 0}
    <p class="choices" class:waiting={shown < lines.length}>
      {#each choices as choice, i (choice.label)}
        {#if i > 0}<span class="dot" aria-hidden="true">·</span>{/if}
        <button type="button" class="choice" onclick={choice.act}>{choice.label}</button>
      {/each}
    </p>
  {/if}
</div>

<style>
  .bubble {
    position: absolute;
    z-index: 3;
    inline-size: max-content;
    padding-block: 0.7rem 0.75rem;
    padding-inline: 1.1rem;
    color: var(--ink);
    font-family: var(--font-hand);
    font-size: clamp(1.08rem, 1.9vw, 1.3rem);
    font-weight: 700;
    line-height: 1.32;
    text-align: start;
    animation: pop 220ms cubic-bezier(0.34, 1.45, 0.64, 1) both;
  }

  .bubble.settled {
    transition:
      top 380ms cubic-bezier(0.3, 0.7, 0.3, 1),
      left 380ms cubic-bezier(0.3, 0.7, 0.3, 1),
      opacity 300ms ease;
  }

  .bubble.gone {
    opacity: 0;
    pointer-events: none;
  }

  .outline {
    position: absolute;
    inset-block-start: 0;
    left: 0;
    z-index: -1;
    overflow: visible;
    filter: drop-shadow(0 1px 2px rgb(40 37 31 / 10%));
  }

  .outline .paper {
    fill: var(--paper-bright);
  }

  /* something that happened, logged in the talk: quieter than anyone's voice */
  .bubble.event {
    padding-block: 0.3rem;
    padding-inline: 0.75rem;
    color: var(--ink-mid);
    font-size: clamp(0.9rem, 1.4vw, 1rem);
    font-weight: 400;
  }

  .bubble.event .words {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .coin {
    flex: none;
    inline-size: 1.35em;
    block-size: 1.35em;
  }

  /* the essay's paragraph rhythm is for prose, not for a bubble */
  .words,
  .choices {
    font-size: inherit;
    line-height: inherit;
  }

  .words {
    margin: 0;
  }

  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.12em;
  }

  .line {
    display: block;
    transition: opacity 260ms ease;
  }

  .line.waiting,
  .choices.waiting {
    opacity: 0;
  }

  .shout {
    display: inline-block;
    font-size: 1.45em;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1.15;
  }

  .choices {
    margin: 0.45rem 0 0;
    transition: opacity 260ms ease;
  }

  .choice {
    padding: 0.15rem 0.1rem;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.2em;
    cursor: pointer;
  }

  .choice:hover {
    color: var(--accent-deep);
  }

  .choice:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 3px;
  }

  .dot {
    margin-inline: 0.45rem;
    color: var(--ink-soft);
  }

  .bubble.still {
    animation: none;
    transition: none;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.92) translateY(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bubble,
    .bubble.settled,
    .line {
      animation: none;
      transition: none;
    }
  }
</style>
