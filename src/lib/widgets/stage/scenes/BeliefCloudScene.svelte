<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'orisit', length: 0.8 },
    { label: 'cloud', length: 1.5 },
    { label: 'complex', length: 1 },
  ];

  /**
   * Folk explanations for wealth; weight is an editorial estimate of how
   * strongly the belief circulates (drives font size only — nothing here is a
   * claim, the essay's point is that none of it enters the fair-coin room).
   */
  const BELIEFS: readonly { word: string; weight: number }[] = [
    { word: 'Hard work', weight: 1 },
    { word: 'Luck', weight: 0.92 },
    { word: 'IQ', weight: 0.78 },
    { word: 'Family', weight: 0.74 },
    { word: 'Connections', weight: 0.7 },
    { word: 'DNA', weight: 0.6 },
    { word: 'Timing', weight: 0.56 },
    { word: 'Class', weight: 0.52 },
    { word: 'Race', weight: 0.5 },
    { word: 'Country', weight: 0.46 },
    { word: 'Religion', weight: 0.4 },
    { word: 'EQ', weight: 0.38 },
    { word: 'Skin color', weight: 0.36 },
    { word: 'Blue eyes', weight: 0.3 },
  ];
</script>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { STAGE_CONTEXT, type StageContext } from '../contract';
  import { noise } from '../../shared/layout';

  const stage = getContext<StageContext | undefined>(STAGE_CONTEXT);

  let root: HTMLElement;
  let orIsIt: HTMLElement;

  // Deterministic scattered layout: coarse grid + hash jitter, stable forever.
  const placed = BELIEFS.map((b, i) => {
    const cols = 4;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...b,
      x: 15 + (col + 0.5 + noise(i, 11) * 0.36) * (70 / cols),
      y: 20 + (row + 0.5 + noise(i, 12) * 0.4) * (62 / Math.ceil(BELIEFS.length / cols)),
      drift: 6 + noise(i, 13) * 5,
    };
  });

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const words = root.querySelectorAll<HTMLElement>('.belief');

      // centering via percent channels so y-drift tweens don't clobber it
      tl.set(words, { xPercent: -50, yPercent: -50 }, 0);

      tl.fromTo(orIsIt, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 'orisit+=0.1');

      // beliefs surface one by one, scattered, sized by how loudly they are believed
      tl.fromTo(
        words,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.3, stagger: { each: 1.1 / BELIEFS.length, from: 'random' } },
        'cloud',
      );
      // slow deterministic drift so the cloud feels alive under scrub
      for (let i = 0; i < words.length; i++) {
        tl.to(words[i], { y: -placed[i].drift, duration: 1.6, ease: 'none' }, 'cloud+=0.3');
      }

      // it all blurs together — too many stories, no way to weigh them
      tl.to(words, { autoAlpha: 0.28, duration: 0.4 }, 'complex');
      tl.to(orIsIt, { autoAlpha: 0.28, duration: 0.4 }, 'complex');
    });
  });
</script>

<div bind:this={root} class="scene-art beliefs" aria-label="Competing explanations for wealth">
  <p bind:this={orIsIt} class="or-is-it">or is it&hellip;</p>
  {#each placed as b}
    <p
      class="belief"
      style={`inset-inline-start:${b.x}%; inset-block-start:${b.y}%; font-size:${(0.9 + b.weight * 1.9).toFixed(2)}em;`}
    >
      {b.word}
    </p>
  {/each}
</div>

<style>
  .beliefs {
    inline-size: 100%;
    block-size: 100%;
    font-size: clamp(0.8rem, 1.7vw, 1.15rem);
  }

  .or-is-it {
    position: absolute;
    inset-block-start: 12%;
    inset-inline-start: clamp(1rem, 8%, 6rem);
    margin: 0;
    font-size: clamp(1.5rem, 3.4vw, 2.4rem);
    font-style: italic;
    color: var(--ink-mid);
  }

  .belief {
    position: absolute;
    margin: 0;
    font-family: var(--font-sans);
    font-weight: 650;
    color: var(--ink);
    white-space: nowrap;
  }
</style>
