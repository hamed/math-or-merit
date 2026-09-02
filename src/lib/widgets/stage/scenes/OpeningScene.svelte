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
  const BLINK_HOLD = 0.9;
  const TYPE_HEAD = 2.2;
  const TYPE_SRC = 0.55;
  const PAUSE = 0.45;
  const FADE = 0.65;
  /** How long the reel spins before "Math" is at rest (overshoot included). */
  const SPIN = 5.4;

  export const BEATS: readonly BeatSpec[] = [
    // blink, type the headline, pause, type the source, pause
    { label: 'headline', length: BLINK_HOLD + TYPE_HEAD + PAUSE + TYPE_SRC + PAUSE },
    { label: 'merit', length: FADE + PAUSE },
    { label: 'or', length: FADE + PAUSE },
    { label: 'math', length: SPIN + PAUSE },
    { label: 'qmark', length: FADE + PAUSE },
    { label: 'hint', length: FADE },
  ];

  /** The complete cinematic opening before the reader takes over. */
  export const OPENING_SECONDS = BEATS.reduce((sum, beat) => sum + beat.length, 0);

  /**
   * The dated hook (research/narrative-sources.md "Elon Musk trillionaire
   * hook"): the dated source is clickable and the "on paper" qualifier sits
   * beside it, where it cannot disappear if a later ending changes.
   */
  const HEADLINE = 'The world has its first trillionaire.';
  const SOURCE = '(on paper · Reuters · June 14, 2026)';
  const SOURCE_URL =
    'https://www.investing.com/news/stock-market-news/spacex-ipo-makes-elon-musk-worlds-first-trillionaire-4741087';

  /**
   * The reel. Third line of the title is a slot machine: the folk explanations
   * for wealth come and go — slowly, then fast, then slowly — and it settles on
   * "Math". These are the beliefs that used to be a word cloud in its own scene
   * (archive/scenes-pre-r17/BeliefCloudScene.svelte); the spin says the same
   * thing in the title's own space, so the reader meets the question once
   * instead of twice.
   *
   * The order is the argument. It starts where the reader already stands (hard
   * work), drifts outward, and ends on the absurd — and there is no line on the
   * way down where a reasonable answer becomes a ridiculous one. The strongest
   * answers a serious person would give (family money, class) are ON the reel
   * on purpose: spinning past those and still landing on "Math" is the point,
   * and a list of only silly beliefs would be a strawman.
   *
   * "Merit" is not here: it is already sitting on the first line, and two of it
   * on screen at once reads as a bug rather than an echo. "Math" IS here — the
   * reel passes it, shows half of the word behind it, and falls back onto it.
   */
  export const SLOTS: readonly string[] = [
    'Hard work',
    'Luck',
    'Talent',
    'Family money',
    'Connections',
    'IQ',
    'Education',
    'Grit',
    'Class',
    'Timing',
    'Race',
    'Charisma',
    "God's will",
    'Genes',
    'Math',
    'Blue eyes',
  ];

  /** Where it comes to rest. What follows "Math" is what the overshoot shows. */
  export const LAND = SLOTS.indexOf('Math');

  /** How far past the detent the reel runs before it falls back, in slots.
   *  Most of the next word shows at the top of the swing — the reel visibly
   *  goes too far, then comes back. */
  const OVERSHOOT = 0.8;

  /**
   * Every slot is one title line box wide at most. "Math" and "Merit" set the
   * reference (~5 characters); anything longer is set down proportionally so
   * the reel never widens the title column or spills off the viewport.
   */
  const REF_CHARS = 5;
  const slotScale = (word: string) => Math.min(1, REF_CHARS / word.length);
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  let root: HTMLElement;
  let cursor: HTMLElement;
  let merit: HTMLElement;
  let orWord: HTMLElement;
  let reel: HTMLElement;
  let strip: HTMLElement;
  let qmark: HTMLElement;
  let credit: HTMLElement;
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
      for (const [el, at] of [[merit, 'merit'], [orWord, 'or'], [qmark, 'qmark']] as const) {
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: 'none' }, at);
      }

      // The reel. Position is an index into SLOTS, tweened rather than the
      // transform itself, so the strip is always parked on a whole-slot
      // multiple of its own measured height — no fractional-pixel drift
      // between one slot and the next, at any font size.
      const reelPos = { i: 0 };
      const parkReel = () => {
        strip.style.transform = `translateY(${-reelPos.i * reel.clientHeight}px)`;
      };
      parkReel();

      // the window is empty until its turn: a word sitting under "or" through
      // the earlier beats would give the ending away
      tl.fromTo(reel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'none' }, 'math');

      // TWO tweens, and no more. One eased curve carries the whole spin — slow
      // enough to read, faster in the middle, slow again — and runs most of a
      // slot PAST "Math", so the word behind it is showing at the top of the
      // swing. Then the reel settles the way a real one does: back past the
      // detent, out again by less, and again by less, until it stops on it.
      //
      // That second move is one elastic ease, not a hand-built chain of
      // segments: a damped oscillation is exactly what elastic.out describes,
      // and every handover between two hand-timed eases is a visible kink.
      tl.addLabel('spin', 'math');
      tl.to(
        reelPos,
        {
          i: LAND + OVERSHOOT,
          duration: SPIN * 0.7,
          ease: 'power2.inOut',
          onUpdate: parkReel,
        },
        'spin',
      );
      tl.to(
        reelPos,
        {
          i: LAND,
          duration: SPIN * 0.3,
          // amplitude and period tuned by eye: three swings you can actually see
          ease: 'elastic.out(1.8, 0.42)',
          onUpdate: parkReel,
        },
        '>',
      );

      // The signature and scroll hint arrive together: the page has named its
      // director, finished talking, and handed the next move to the reader.
      tl.fromTo(credit, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: 'none' }, 'hint');
      tl.fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: 'none' }, 'hint');
    });
  });
</script>

<div bind:this={root} class="scene-art opening" aria-label="Opening title">
  <p class="teletype" aria-label={`${HEADLINE} ${SOURCE}`}>
    <span class="tt-line" aria-hidden="true">
      {#each headlineChars as ch}<span class="tt-char">{ch}</span>{/each}</span
    ><a class="tt-source" href={SOURCE_URL} aria-label="Source: Reuters, June 14, 2026"
      >{#each sourceChars as ch}<span class="tt-char" aria-hidden="true">{ch}</span>{/each}</a
    ><span bind:this={cursor} class="tt-cursor" aria-hidden="true"></span>
  </p>

  <div class="title" aria-hidden="true">
    <p bind:this={merit} class="word merit">Merit</p>
    <p bind:this={orWord} class="word or">or</p>
    <p class="word math">
      <span bind:this={reel} class="reel"
        ><span class="reel-sizer" aria-hidden="true">Math</span
        ><span bind:this={strip} class="reel-strip">
          {#each SLOTS as word}
            <span class="reel-slot"
              ><span style={`font-size:${slotScale(word).toFixed(3)}em;`}>{word}</span></span
            >
          {/each}
        </span></span
      ><span bind:this={qmark} class="qmark">?</span>
    </p>
  </div>

  <a
    bind:this={credit}
    class="credit"
    href="https://github.com/hamed"
    target="_blank"
    rel="author noreferrer"
  >Created &amp; directed by Hamed</a>

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
    font-size: clamp(0.68rem, 3.3vw, 1.35rem);
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
     arrival moves nothing. The row is a flex line so the clipped reel window
     and the '?' are the same height and start on the same edge — an
     overflow-hidden inline box baselines on its bottom margin edge, which
     would drop the '?' below the word it belongs to. */
  .math {
    display: flex;
    align-items: stretch;
  }

  /* One slot tall, and it clips — this is the machine's window. It clips only
     top and bottom (clip-path, not overflow): the window is exactly as wide as
     "Math" so the '?' sits against the word it belongs to, and the longer
     beliefs are free to run past that width while they spin. */
  .reel {
    position: relative;
    display: block;
    clip-path: inset(0 -100vw);
    /* One slot, in TITLE ems — the slots themselves are set at their own
       reduced sizes, so they must not measure their height in their own em or
       a long word would make a short slot and the travel would go ragged. */
    --slot-h: 1.2em;
    block-size: var(--slot-h);
  }

  /* holds the window's width — "Math" and nothing else */
  .reel-sizer {
    display: block;
    block-size: var(--slot-h);
    visibility: hidden;
  }

  .reel-strip {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: block;
    /* transform driven by the timeline; will-change keeps the fast middle of
       the spin on its own layer instead of repainting the title each frame */
    will-change: transform;
  }

  /* Every slot is one window tall REGARDLESS of how small its word is set, so
     the strip's travel is a constant multiple of the window height and long
     words do not shift the cadence. The slot itself therefore stays at the
     title's size and only the word inside it is scaled down — a custom
     property is substituted where it is USED, so `1.2em` on a shrunken slot
     would have measured a shrunken slot. */
  .reel-slot {
    display: flex;
    align-items: center;
    block-size: var(--slot-h);
    line-height: 1.2;
    white-space: nowrap;
  }

  .qmark {
    display: block;
  }

  .title {
    inset-block-start: 16%;
    inset-inline-start: 12%;
    align-items: start;
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

  .credit {
    position: absolute;
    inset-block-end: 6%;
    inset-inline-end: clamp(1rem, 8%, 6rem);
    margin: 0;
    font-family: var(--font-mono);
    font-size: clamp(0.72rem, 1.8vw, 0.95rem);
    color: var(--ink-soft);
    text-decoration-color: var(--line);
  }

  @media (max-width: 520px) and (orientation: portrait) {
    .credit {
      /* The scroll arrow owns the bottom centre on a narrow screen. */
      inset-block-end: calc(6% + 2.5rem);
    }
  }

  @media (max-height: 560px) and (orientation: landscape) {
    .teletype {
      inset-block-start: 4%;
      font-size: clamp(0.65rem, 2.1vw, 1rem);
    }

    .title {
      inset-block-start: 24%;
    }

    .merit,
    .or,
    .math {
      font-size: clamp(2.8rem, 15svh, 4.5rem);
    }
  }

  @keyframes hint-bob {
    50% {
      transform: translateY(6px);
    }
  }
</style>
