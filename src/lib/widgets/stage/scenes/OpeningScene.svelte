<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  /**
   * Time-driven (PinScene driver="time"): lengths are seconds.
   *
   * The whole opening is paced by two numbers, so it can be tuned without
   * touching the choreography: PAUSE between arrivals, FADE for each arrival.
   * BLINK_HOLD lets the cursor sit and blink before anything types, and TYPING
   * is how long the headline takes to come out.
   *
   * Nothing here pins, so a reader who scrolls immediately just leaves it
   * behind — the length is safe to be generous with.
   */
  const BLINK_HOLD = 2;
  const TYPE_HEAD = 3.2;
  const TYPE_SRC = 0.9;
  const PAUSE = 1;
  const FADE = 2;

  export const BEATS: readonly BeatSpec[] = [
    // blink, type the headline, pause, type the source, pause
    { label: 'headline', length: BLINK_HOLD + TYPE_HEAD + PAUSE + TYPE_SRC + PAUSE },
    { label: 'merit', length: FADE + PAUSE },
    { label: 'or', length: FADE + PAUSE },
    { label: 'math', length: FADE + PAUSE },
    { label: 'qmark', length: FADE + PAUSE },
    { label: 'hint', length: FADE },
  ];

  /**
   * Title arrangements, kept for the owner's pick.
   * - stack  — one left-aligned column, the two M's on the same edge
   * - center — a centred column
   * - mono   — stack, set in the teletype's face: "Merit" and "Math?" are both
   *            five characters, so in a monospace font they are exactly the
   *            same width and the column edges line up on both sides
   * - poles  — the original opposing thirds
   */
  export type OpeningLayout = 'stack' | 'center' | 'mono' | 'poles';

  /**
   * The dated hook (research/narrative-sources.md "Elon Musk trillionaire
   * hook"): source name only, clickable, per the storyboard. The "on paper"
   * qualifier returns in the ending beat.
   */
  const HEADLINE = 'The world has its first trillionaire.';
  const SOURCE = '(Reuters)';
  const SOURCE_URL =
    'https://www.investing.com/news/stock-market-news/spacex-ipo-makes-elon-musk-worlds-first-trillionaire-4741087';
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';

  interface Props {
    /** Title arrangement — variants kept for the owner's pick. */
    layout?: OpeningLayout;
  }

  let { layout = 'stack' }: Props = $props();

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  let root: HTMLElement;
  let cursor: HTMLElement;
  let merit: HTMLElement;
  let orWord: HTMLElement;
  let math: HTMLElement;
  let qmark: HTMLElement;
  let hint: HTMLElement;

  const headlineChars = HEADLINE.split('');
  const sourceChars = SOURCE.split('');

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const chars = root.querySelectorAll<HTMLElement>('.tt-char');

      // teletype: the cursor blinks alone for BLINK_HOLD, then the headline
      // types, then it sits blinking at the end of that line for a beat before
      // the source types on the next line. The cursor position is read live
      // from the last revealed character, so the line break needs no special
      // casing.
      const headChars = root.querySelectorAll<HTMLElement>('.tt-line .tt-char');
      const srcChars = root.querySelectorAll<HTMLElement>('.tt-source .tt-char');

      const park = (c: HTMLElement | undefined) => {
        if (c) cursor.style.transform = `translate(${c.offsetLeft + c.offsetWidth}px, ${c.offsetTop}px)`;
      };

      const type = (group: NodeListOf<HTMLElement>, span: number, at: number) => {
        tl.fromTo(
          group,
          { visibility: 'hidden' },
          { visibility: 'visible', duration: 0.001, stagger: span / group.length },
          at,
        );
        const pos = { i: 0 };
        tl.to(
          pos,
          {
            i: group.length - 1,
            duration: span,
            ease: `steps(${Math.max(group.length - 1, 1)})`,
            onUpdate: () => park(group[Math.min(Math.round(pos.i), group.length - 1)]),
          },
          at,
        );
      };

      type(headChars, TYPE_HEAD, BLINK_HOLD);
      type(srcChars, TYPE_SRC, BLINK_HOLD + TYPE_HEAD + PAUSE);

      // The title arrives one word at a time, and ONLY fades — no rise, no
      // scale. The cursor keeps blinking through it: the CRT stays on.
      // '?' is its own arrival but shares Math's line box, so it holds its
      // space from the start and nothing shifts when it appears.
      for (const [el, at] of [[merit, 'merit'], [orWord, 'or'], [math, 'math'], [qmark, 'qmark']] as const) {
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: 'none' }, at);
      }

      // scroll hint arrives last and stays — the page is done talking, your move
      tl.fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: 'none' }, 'hint');
    });
  });
</script>

<div bind:this={root} class={`scene-art opening layout-${layout}`} aria-label="Opening title">
  <p class="teletype" aria-label={`${HEADLINE} ${SOURCE}`}>
    <span class="tt-line" aria-hidden="true">
      {#each headlineChars as ch}<span class="tt-char">{ch}</span>{/each}</span
    ><a class="tt-source" href={SOURCE_URL} aria-label="Source: Reuters"
      >{#each sourceChars as ch}<span class="tt-char" aria-hidden="true">{ch}</span>{/each}</a
    ><span bind:this={cursor} class="tt-cursor" aria-hidden="true"></span>
  </p>

  <div class="title" aria-hidden="true">
    <p bind:this={merit} class="word merit">Merit</p>
    <p bind:this={orWord} class="word or">or</p>
    <p class="word math"><span bind:this={math}>Math</span><span bind:this={qmark}>?</span></p>
  </div>

  <div bind:this={hint} class="hint" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="26" height="26">
      <path d="M 5 9 L 12 16 L 19 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </div>
</div>

<style>
  .opening {
    inline-size: 100%;
    block-size: 100%;
  }

  .teletype {
    position: absolute;
    inset-block-start: 7%;
    inset-inline-start: clamp(1rem, 8%, 6rem);
    margin: 0;
    /* fit-content so the block is exactly as wide as the headline line; the
       source then aligns to the headline's far edge rather than to some
       arbitrary column. text-align: end keeps that correct under RTL. */
    inline-size: fit-content;
    max-inline-size: min(38rem, 84vw);
    font-family: var(--font-mono);
    font-size: clamp(0.95rem, 2.2vw, 1.35rem);
    color: var(--ink);
  }

  /* headline on its line, source on the next, pushed to the opposite edge */
  .tt-line {
    display: block;
  }

  .tt-source {
    display: block;
    text-align: end;
  }

  /* chars hidden by the timeline at build, not by CSS — no-JS keeps the text */
  .tt-char {
    white-space: pre;
  }

  .tt-source :global(.tt-char),
  .tt-source {
    color: var(--ink-soft);
    text-decoration-color: var(--line);
  }

  .tt-cursor {
    position: absolute;
    inset-block-start: 0.1em;
    inset-inline-start: 0;
    inline-size: 0.6ch;
    block-size: 1.15em;
    background: var(--accent);
    animation: tt-blink 1.05s steps(1) infinite;
  }

  @keyframes tt-blink {
    50% {
      opacity: 0.15;
    }
  }

  /* words hidden by fromTo tweens at build, not CSS — no-JS keeps the title.
     NOT absolutely positioned: .title is the flex column that places them, and
     an absolute child would drop out of it and stack them all at one point. */
  .word {
    margin: 0;
    font-weight: 750;
    color: var(--ink-strong);
    letter-spacing: -0.045em;
    /* Must not go below 1. A line-height under 1 makes the line box SHORTER
       than the glyphs, so ascenders and descenders spill out and neighbouring
       words collide — and box measurements still report a positive gap, which
       hides it. This face's glyphs measure ~1.14em tall, so the line box has to
       clear that before any gap is added. */
    line-height: 1.2;
  }

  /* All three words are one size and one weight, so the O sits on the same
     axis as the two M's and the column reads M-O-M. */
  .merit,
  .or,
  .math {
    font-size: clamp(4rem, 13vw, 10rem);
  }

  .or {
    color: var(--accent);
  }

  /* One column: a shared inline edge and an even gap between all three, at any
     size. Percentage tops per word could not hold both. */
  .title {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 0.04em;
  }

  /* '?' shares Math's line box and holds its width from the start, so its
     arrival moves nothing. */
  .math span {
    visibility: inherit;
  }

  .layout-stack .title,
  .layout-mono .title,
  .layout-poles .title {
    inset-block-start: 16%;
    inset-inline-start: 12%;
    align-items: start;
  }

  .layout-center .title {
    inset-block-start: 16%;
    inset-inline: 0;
    align-items: center;
  }

  /* ---- variant: mono — five characters each, so the column is flush both
     sides and the title shares the teletype's face ---- */

  /* ---- variant: center — a centered column ---- */




  .hint {
    position: absolute;
    inset-block-end: 6%;
    inset-inline: 0;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    animation: hint-bob 2.2s ease-in-out infinite;
  }

  @keyframes hint-bob {
    50% {
      transform: translateY(6px);
    }
  }
</style>
