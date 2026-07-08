<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  /** Time-driven (PinScene driver="time"): lengths are seconds. */
  export const BEATS: readonly BeatSpec[] = [
    { label: 'headline', length: 2.6 },
    { label: 'isit', length: 0.55 },
    { label: 'merit', length: 0.75 },
    { label: 'or', length: 0.45 },
    { label: 'math', length: 0.9 },
    { label: 'hint', length: 0.9 },
  ];

  export type OpeningLayout = 'poles' | 'stack' | 'center';

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

  let { layout = 'poles' }: Props = $props();

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  let root: HTMLElement;
  let cursor: HTMLElement;
  let isIt: HTMLElement;
  let merit: HTMLElement;
  let orWord: HTMLElement;
  let math: HTMLElement;
  let hint: HTMLElement;

  const headlineChars = HEADLINE.split('');
  const sourceChars = SOURCE.split('');
  const totalChars = headlineChars.length + 2 + sourceChars.length;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const chars = root.querySelectorAll<HTMLElement>('.tt-char');

      // teletype: characters appear stepwise; the block cursor walks with them
      // (position read live from the last revealed char, so line wraps are safe)
      const typing = 2.1;
      tl.fromTo(
        chars,
        { visibility: 'hidden' },
        { visibility: 'visible', duration: 0.001, stagger: typing / totalChars },
        'headline+=0.15',
      );
      const pos = { i: 0 };
      tl.to(
        pos,
        {
          i: totalChars - 1,
          duration: typing,
          ease: `steps(${totalChars - 1})`,
          onUpdate: () => {
            const c = chars[Math.min(Math.round(pos.i), chars.length - 1)];
            if (c) cursor.style.transform = `translate(${c.offsetLeft + c.offsetWidth}px, ${c.offsetTop}px)`;
          },
        },
        'headline+=0.15',
      );

      // the title arrives one word at a time; the cursor keeps blinking (CRT stays on)
      tl.fromTo(
        isIt,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        'isit',
      );
      tl.fromTo(
        merit,
        { autoAlpha: 0, y: 26, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.65, ease: 'power2.out', transformOrigin: '0% 100%' },
        'merit',
      );
      tl.fromTo(orWord, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 'or');
      tl.fromTo(
        math,
        { autoAlpha: 0, y: 26, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out', transformOrigin: '0% 100%' },
        'math',
      );

      // scroll hint arrives last and stays — the page is done talking, your move
      tl.fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 'hint+=0.2');
    });
  });
</script>

<div bind:this={root} class={`scene-art opening layout-${layout}`} aria-label="Opening title">
  <p class="teletype" aria-label={`${HEADLINE} ${SOURCE}`}>
    <span class="tt-line" aria-hidden="true">
      {#each headlineChars as ch}<span class="tt-char">{ch}</span>{/each}<span class="tt-char">&nbsp;</span><span
        class="tt-char">&nbsp;</span></span
    ><a class="tt-source" href={SOURCE_URL} aria-label="Source: Reuters"
      >{#each sourceChars as ch}<span class="tt-char" aria-hidden="true">{ch}</span>{/each}</a
    ><span bind:this={cursor} class="tt-cursor" aria-hidden="true"></span>
  </p>

  <p bind:this={isIt} class="word is-it" aria-hidden="true">Is it</p>
  <p bind:this={merit} class="word merit" aria-hidden="true">Merit</p>
  <p bind:this={orWord} class="word or" aria-hidden="true">or</p>
  <p bind:this={math} class="word math" aria-hidden="true">Math?</p>

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
    max-inline-size: 38rem;
    font-family: var(--font-mono);
    font-size: clamp(0.85rem, 1.9vw, 1.15rem);
    color: var(--ink);
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

  /* words hidden by fromTo tweens at build, not CSS — no-JS keeps the title */
  .word {
    position: absolute;
    margin: 0;
    font-weight: 750;
    color: var(--ink-strong);
    letter-spacing: -0.045em;
    line-height: 0.95;
  }

  .is-it,
  .or {
    font-size: clamp(1.35rem, 3.1vw, 2.2rem);
    font-weight: 400;
    font-style: italic;
    letter-spacing: 0;
    color: var(--ink-mid);
  }

  .or {
    color: var(--accent);
  }

  .merit,
  .math {
    font-size: clamp(3.4rem, 10.5vw, 8rem);
  }

  /* ---- variant: poles — the two nouns anchor opposing thirds ---- */

  .layout-poles .is-it {
    inset-block-start: 29%;
    inset-inline-start: 15%;
  }

  .layout-poles .merit {
    inset-block-start: 33%;
    inset-inline-start: 15%;
  }

  /* "or" sits on Math?'s left edge exactly as "Is it" sits on Merit's —
     both anchored inline-start so the pattern holds at every width. */
  .layout-poles .or {
    inset-block-start: 56%;
    inset-inline-start: 46%;
  }

  .layout-poles .math {
    inset-block-start: 60%;
    inset-inline-start: 46%;
  }

  /* ---- variant: stack — one left-aligned poster column ---- */

  .layout-stack .is-it {
    inset-block-start: 27%;
    inset-inline-start: 15%;
  }

  .layout-stack .merit {
    inset-block-start: 31%;
    inset-inline-start: 15%;
  }

  .layout-stack .or {
    inset-block-start: 53%;
    inset-inline-start: 16%;
  }

  .layout-stack .math {
    inset-block-start: 58%;
    inset-inline-start: 15%;
  }

  /* ---- variant: center — a centered column ---- */

  .layout-center .word {
    inset-inline: 0;
    text-align: center;
  }

  .layout-center .is-it {
    inset-block-start: 26%;
  }

  .layout-center .merit {
    inset-block-start: 31%;
  }

  .layout-center .or {
    inset-block-start: 54%;
  }

  .layout-center .math {
    inset-block-start: 59%;
  }

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
