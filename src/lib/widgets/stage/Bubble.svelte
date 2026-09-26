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
  import { bubbleLines, comicOutline, shoutSegments, type BubbleChoice, type Tail } from './bubbles';
  import { SPEAKER_TONES } from '../shared/agentStyle';
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
    tail: Tail;
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
  class:settled
  class:gone
  class:still={reduced}
  data-speaker={speaker ?? 'none'}
  style={`left:${x}px; top:${y}px; --ink:${tone.ink}; visibility:${w > 0 ? 'visible' : 'hidden'}`}
  bind:clientWidth={w}
  bind:clientHeight={h}
  onpointerenter={() => onrest?.(true)}
  onpointerleave={() => onrest?.(false)}
  role="presentation"
>
  {#if outline}
    <svg class="outline" width={w} height={h} aria-hidden="true">
      <path d={outline} class="paper" />
      <path d={outline} fill={tone.wash} stroke={tone.edge} stroke-width="2.1" stroke-linejoin="round" />
    </svg>
  {/if}
  <p class="words">
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
    max-inline-size: min(23rem, calc(100% - 32px));
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
