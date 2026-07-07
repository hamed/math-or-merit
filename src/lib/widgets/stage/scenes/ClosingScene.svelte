<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'lone', length: 1 },
    { label: 'fence', length: 1.2 },
    { label: 'headline', length: 1.2 },
    { label: 'closing', length: 1.2 },
  ];

  /** The discarded world, drifting back for the honesty bill. */
  const DISCARDED = [
    'work', 'wages', 'jobs', 'debt', 'saving', 'inheritance',
    'prices', 'skill', 'effort', 'luck', 'power', 'law',
  ];

  const HEADLINE = 'The world has its first trillionaire.';
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { noise } from '../../shared/layout';
  import { assignStyles } from '../../shared/agentStyle';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  // the room's first agent, one last time
  const agentZero = assignStyles(1)[0];

  const dust = Array.from({ length: 40 }, (_, i) => ({
    x: 40 + ((i * 61) % 89) / 89 * 400,
    y: 40 + ((i * 37) % 71) / 71 * 200,
  }));

  const words = DISCARDED.map((word, i) => ({
    word,
    x: 14 + ((i % 4) + 0.5 + noise(i, 21) * 0.4) * (72 / 4),
    y: 16 + (Math.floor(i / 4) + 0.5 + noise(i, 22) * 0.4) * (64 / 3),
  }));

  let root: HTMLElement;
  let winner: SVGCircleElement;
  let dustG: SVGGElement;
  let headlineEl: HTMLElement;

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const wordEls = root.querySelectorAll<HTMLElement>('.discard');

      // lone — the ending state: one owner, everyone else dust
      tl.fromTo(winner, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4 }, 'lone');
      tl.fromTo(dustG, { autoAlpha: 0 }, { autoAlpha: 0.7, duration: 0.4 }, 'lone+=0.2');

      // fence — everything the model threw away drifts back, faint
      tl.set(wordEls, { xPercent: -50, yPercent: -50 }, 0);
      tl.fromTo(
        wordEls,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 0.55, y: 0, duration: 0.3, stagger: { each: 0.06, from: 'random' } },
        'fence',
      );

      // headline — the opening line returns; the room dims behind it
      tl.to([winner, dustG], { autoAlpha: 0.18, duration: 0.35 }, 'headline');
      tl.to(wordEls, { autoAlpha: 0.12, duration: 0.35 }, 'headline');
      tl.fromTo(headlineEl, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 'headline+=0.15');

      // closing — just the paper and the last line (the caption carries it)
      tl.to(headlineEl, { autoAlpha: 0.25, duration: 0.4 }, 'closing');
      tl.to([winner, dustG], { autoAlpha: 0, duration: 0.4 }, 'closing');
      tl.to(wordEls, { autoAlpha: 0, duration: 0.4 }, 'closing');
    });
  });
</script>

<div bind:this={root} class="scene-art closing-scene" aria-label="The finished room, the discarded details, and the headline again">
  <svg viewBox="0 0 480 280" role="img">
    <g bind:this={dustG} class="dust">
      {#each dust as d}
        <rect x={d.x} y={d.y} width="2.2" height="2.2" />
      {/each}
    </g>
    <circle
      bind:this={winner}
      class="winner"
      cx="240"
      cy="140"
      r="72"
      style={`fill:${agentZero.fill}; stroke:${agentZero.stroke};`}
    />
  </svg>

  {#each words as w}
    <p class="discard" style={`inset-inline-start:${w.x}%; inset-block-start:${w.y}%;`}>{w.word}</p>
  {/each}

  <p bind:this={headlineEl} class="headline-echo">
    {HEADLINE}<span class="qualifier"> — on paper, anyway.</span>
  </p>
</div>

<style>
  .closing-scene {
    inline-size: 100%;
    block-size: 100%;
  }

  .winner {
    fill-opacity: 0.75;
    stroke-width: 2.4;
  }

  .dust rect {
    fill: rgb(60 53 43 / 45%);
  }

  .discard {
    position: absolute;
    margin: 0;
    font-family: var(--font-sans);
    font-size: clamp(0.85rem, 1.8vw, 1.15rem);
    font-weight: 600;
    color: var(--ink-mid);
    white-space: nowrap;
  }

  .headline-echo {
    position: absolute;
    inset-block-start: 42%;
    inset-inline: 0;
    margin: 0;
    padding-inline: 1rem;
    text-align: center;
    font-family: var(--font-mono);
    font-size: clamp(1rem, 2.4vw, 1.5rem);
    color: var(--ink-strong);
  }

  .headline-echo .qualifier {
    color: var(--ink-soft);
    font-style: italic;
  }
</style>
