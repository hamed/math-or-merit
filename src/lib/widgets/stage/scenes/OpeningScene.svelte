<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'headline', length: 1.6 },
    { label: 'isit', length: 0.6 },
    { label: 'merit', length: 0.6 },
    { label: 'or', length: 0.4 },
    { label: 'math', length: 1 },
  ];

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
      const typing = 1.15;
      tl.fromTo(
        chars,
        { visibility: 'hidden' },
        { visibility: 'visible', duration: 0.001, stagger: typing / totalChars },
        'headline+=0.1',
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
        'headline+=0.1',
      );

      // the title arrives one word at a time, rule-of-thirds
      tl.to(cursor, { autoAlpha: 0, duration: 0.15 }, 'isit');
      tl.fromTo(isIt, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 'isit+=0.1');
      tl.fromTo(merit, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 'merit');
      tl.fromTo(orWord, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 'or');
      tl.fromTo(math, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 'math');

      // scroll hint: present on the empty page, gone once the reader moves
      tl.to(hint, { autoAlpha: 0, duration: 0.2 }, 'headline+=0.3');
    });
  });
</script>

<div bind:this={root} class="scene-art opening" aria-label="Opening title">
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
    inset-block-start: 16%;
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
    font-weight: 600;
    color: var(--ink-strong);
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .is-it {
    inset-block-start: 36%;
    inset-inline-start: 30%;
    font-size: clamp(1.4rem, 3.4vw, 2.4rem);
    font-weight: 400;
    font-style: italic;
    color: var(--ink-mid);
  }

  .merit {
    inset-block-start: 43%;
    inset-inline-start: 33%;
    font-size: clamp(3.2rem, 9vw, 6.8rem);
  }

  .or {
    inset-block-start: 60%;
    inset-inline-start: 58%;
    font-size: clamp(1.3rem, 3vw, 2.2rem);
    font-weight: 400;
    font-style: italic;
    color: var(--accent);
  }

  .math {
    inset-block-start: 66%;
    inset-inline-start: 46%;
    font-size: clamp(3.2rem, 9vw, 6.8rem);
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
