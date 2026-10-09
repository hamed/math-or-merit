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
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import Coin from './scenes/Coin.svelte';
  import { bubbleLines, comicOutline, restsOn, shoutSegments, type BubbleChoice, type Tail } from './bubbles';
  import { PROTAGONISTS, SPEAKER_TONES, type AgentStyle } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';
  import AgentFace from '../shared/face/AgentFace.svelte';
  import { drawStill } from '../shared/face/draw';
  import { faceStyle } from '../shared/face/faceStyle.svelte';
  import { CONTEMPT, stillOf, type Affect } from '../shared/face/moments';
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
    /** A line someone says, something that happened (a coin landed), or the morning paper. */
    kind?: 'line' | 'event' | 'paper';
    /** The paper's front page, when `kind` is 'paper'. */
    paper?: { masthead: string; text: string; source: string; style: AgentStyle; mood?: Affect };
    /** An event's coin: the face that landed, in its owner's colour. */
    coin?: Speaker;
    /** The widest it may grow, px: a bubble never spans its whole column. */
    maxWidth?: number;
    /** Which way its lines lean: toward the speaker in the talk, toward his circle in an aside. */
    align?: 'left' | 'right' | null;
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
    /** Laid out and measured, but not seen yet (the paper while its big front page shows). */
    hidden?: boolean;
    /**
     * Said to the reader, not to the other one. Comics set these apart from
     * dialogue with a caption box — squarer, in the speaker's colour — and so
     * does this, on the speaker's outer side.
     */
    aside?: boolean;
    /** A control the reader holds, set inside the bubble (the stake dial). */
    control?: Snippet;
    /** Pictures posted with the words, like photos in a chat: their sources, in order (the joke's plates). */
    pictures?: readonly string[];
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
    paper,
    maxWidth = 368,
    align = null,
    shown = Infinity,
    gone = false,
    onsize,
    choices,
    onrest,
    hidden = false,
    aside = false,
    control,
    pictures = [],
    reduced = false,
  }: Props = $props();

  /** Where the people of a choice's little picture stand, in its 96×64 box. */
  const GLYPH_SPOTS = [
    { x: 16, y: 22 },
    { x: 48, y: 18 },
    { x: 80, y: 24 },
    { x: 20, y: 48 },
    { x: 52, y: 46 },
    { x: 82, y: 50 },
  ];

  let w = $state(0);
  let h = $state(0);
  $effect(() => onsize?.(w, h));

  const lines = $derived(bubbleLines(text));
  const plain = $derived(lines.join(' ').replace(/\*\*/g, ''));
  const tone = $derived(SPEAKER_TONES[speaker ?? 'none']);
  const outline = $derived(w > 0 && h > 0 && kind !== 'paper' ? comicOutline(w, h, tail, id, aside ? 0.9 : 1.4, aside ? 5 : 18) : '');
  /** Moves between places glide, but the first placement never slides in from a corner. */
  let settled = $state(false);

  $effect(() => {
    if (w > 0 && !settled) requestAnimationFrame(() => (settled = true));
  });

  /**
   * The reader rests on a bubble only by moving onto it. A bubble that appears,
   * or slides, under a pointer standing still is not being read — Chrome fires
   * `pointerenter` for it all the same, and the talk stopped there for good.
   */
  let resting = false;
  function rest(on: boolean): void {
    if (resting === on) return;
    resting = on;
    onrest?.(on);
  }
  // a bubble that goes while it is rested on lets the talk go on
  $effect(() => () => {
    if (resting) onrest?.(false);
  });
</script>

<!-- the pointer resting on a bubble holds chit-chat (3.2); a click on it still steps -->
<div
  class="bubble"
  class:event={kind === 'event'}
  class:paper={kind === 'paper'}
  class:aside
  class:settled
  class:gone
  class:still={reduced}
  data-speaker={speaker ?? 'none'}
  style={`left:${x}px; top:${y}px; max-inline-size:${maxWidth}px; --ink:${tone.ink}; visibility:${w > 0 && !hidden ? 'visible' : 'hidden'}${align ? `; text-align:${align}` : ''}`}
  bind:clientWidth={w}
  bind:clientHeight={h}
  onpointermove={(e) => {
    if (restsOn(e)) rest(true);
  }}
  onpointerleave={() => rest(false)}
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
  {#if paper}
    <!-- as the paper prints them: the winner very contemptuous (owner, 2026-10-07), anyone else as their fortune feels (field.ts `photoMood`) -->
    {@const portrait = faceStyle.look === 'none' ? null : drawStill(faceStyle.look, paper.style.shape, 10, 10, stillOf(paper.mood ?? CONTEMPT))}
    <article class="page" aria-label={`${paper.masthead}: ${paper.text}`}>
      <p class="masthead">{paper.masthead}</p>
      <div class="spread">
        <svg class="photo" viewBox="-14 -14 28 28" aria-hidden="true">
          <path d={svgShapePath(paper.style.shape, 10)} fill={paper.style.fill} stroke={paper.style.stroke} stroke-width="1.6" />
          {#if portrait}<AgentFace drawing={portrait} fill={paper.style.fill} stroke={paper.style.stroke} uid={`face-paper-${id}`} />{/if}
        </svg>
        <div>
          <p class="headline">{paper.text}</p>
          <p class="source">{paper.source}</p>
        </div>
      </div>
    </article>
  {:else}
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
  {/if}
  {#if pictures.length > 0}
    <!-- posted with the words: as wide as the bubble may grow, two to a row; the shape is kept before they load -->
    <div class="pictures" class:pair={pictures.length > 1} class:waiting={shown < lines.length} style={`inline-size:${Math.max(160, maxWidth - 36)}px`}>
      {#each pictures as src, k (k)}<img {src} alt="" loading="lazy" decoding="async" />{/each}
    </div>
  {/if}
  {#if choices && choices.length > 0}
    {@const listed = choices.some((c) => c.glyph)}
    <p class="choices" class:listed class:waiting={shown < lines.length}>
      {#each choices as choice, i (choice.label)}
        {#if i > 0 && !listed}<span class="dot" aria-hidden="true">·</span>{/if}
        <button type="button" class="choice" class:chosen={choice.chosen} aria-pressed={choice.chosen ?? undefined} onclick={choice.act}>
          {#if choice.glyph}
            <svg class="glyph" viewBox="0 0 96 64" aria-hidden="true">
              {#each choice.glyph as r, k (k)}
                <circle cx={GLYPH_SPOTS[k].x} cy={GLYPH_SPOTS[k].y} r={Math.max(1, r)} />
              {/each}
            </svg>
          {/if}
          <span>{choice.label}</span>
        </button>
      {/each}
    </p>
  {/if}
  {#if control}
    <div class="control" class:waiting={shown < lines.length}>{@render control()}</div>
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

  /* a little see-through, so the crowd underneath still shows (owner, 2026-09-26) */
  .outline .paper {
    fill: rgb(255 250 240 / 84%);
  }

  /* the morning paper, printed into the talk: newsprint, not a voice */
  .bubble.paper {
    inline-size: min(21rem, calc(100% - 32px));
    padding: 0.55rem 0.75rem 0.6rem;
    border: 1px solid #c9bca5;
    border-radius: 0.5rem;
    background: rgb(255 253 248 / 92%);
    box-shadow: 0 0.5rem 1.4rem rgb(65 50 29 / 16%);
    color: var(--ink);
    font-family: var(--font-serif);
    font-weight: 400;
  }

  .masthead {
    margin: 0 0 0.35rem;
    padding-block-end: 0.25rem;
    border-block-end: 2px solid var(--ink);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-align: center;
  }

  .spread {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  .photo {
    flex: none;
    inline-size: 3.2rem;
    block-size: 3.2rem;
    padding: 0.2rem;
    border: 1px solid #d8cdb9;
    background: var(--paper-bright);
  }

  .headline {
    margin: 0;
    font-size: 1.02rem;
    font-weight: 750;
    line-height: 1.2;
  }

  .source {
    margin: 0.2rem 0 0;
    color: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: 0.7rem;
    line-height: 1.3;
  }

  /* to the reader: a caption box in the speaker's hand, a little quieter than dialogue */
  .bubble.aside {
    padding-block: 0.5rem 0.55rem;
    padding-inline: 0.85rem;
    font-size: clamp(1rem, 1.7vw, 1.18rem);
    font-style: italic;
  }

  .bubble.aside .outline .paper {
    fill: rgb(255 250 240 / 90%);
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

  .line.waiting {
    opacity: 0;
  }

  .pictures {
    display: grid;
    gap: 0.35rem;
    margin-block: 0.5rem 0.1rem;
  }

  .pictures.pair {
    grid-template-columns: 1fr 1fr;
  }

  .pictures img {
    display: block;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 1755 / 952;
    object-fit: cover;
    border: 1px solid var(--line);
    border-radius: 0.5rem;
    background: var(--paper);
  }

  .pictures.waiting,
  .choices.waiting,
  .control.waiting {
    opacity: 0;
  }

  .control {
    position: relative;
    transition: opacity 260ms ease;
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

  /* several choices with pictures: one per line, picture first */
  .choices.listed {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
  }

  .choices.listed .choice {
    display: flex;
    align-items: center;
    text-align: start;
    gap: 0.55rem;
    text-decoration-thickness: 1.5px;
  }

  .choice.chosen {
    color: var(--accent-deep);
    text-decoration-thickness: 3px;
  }

  .choice.chosen::after {
    content: ' ✓';
  }

  .glyph {
    flex: none;
    inline-size: 2.6rem;
    block-size: 1.75rem;
  }

  .glyph circle {
    fill: var(--agent-fill-red);
    fill-opacity: 0.75;
    stroke: var(--agent-stroke-blue);
    stroke-width: 2;
  }

  .glyph circle:nth-child(3n + 2) {
    fill: var(--agent-fill-blue);
    stroke: var(--agent-stroke-violet);
  }

  .glyph circle:nth-child(3n) {
    fill: var(--agent-fill-green);
    stroke: var(--agent-stroke-pink);
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
