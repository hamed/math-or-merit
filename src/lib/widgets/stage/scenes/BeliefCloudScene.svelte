<script lang="ts" module>
  import type { BeatSpec } from '../contract';

  export const BEATS: readonly BeatSpec[] = [
    { label: 'orisit', length: 0.8 },
    { label: 'cloud', length: 2.4 },
    { label: 'complex', length: 1.1 },
    { label: 'story', length: 1.1 },
  ];

  /**
   * Folk explanations for wealth; weight is an editorial estimate of how
   * strongly the belief circulates (drives font size only — nothing here is a
   * claim, the essay's point is that none of it enters the fair-coin room).
   */
  const BELIEFS: readonly { word: string; weight: number }[] = [
    { word: 'Hard work', weight: 1 },
    { word: 'Merit', weight: 0.95 },
    { word: 'Luck', weight: 0.9 },
    { word: 'Talent', weight: 0.85 },
    { word: 'Family money', weight: 0.78 },
    { word: 'Connections', weight: 0.74 },
    { word: 'IQ', weight: 0.7 },
    { word: 'Education', weight: 0.66 },
    { word: 'Grit', weight: 0.6 },
    { word: 'Timing', weight: 0.56 },
    { word: 'Class', weight: 0.52 },
    { word: 'Hustle', weight: 0.5 },
    { word: 'Race', weight: 0.46 },
    { word: 'Charisma', weight: 0.42 },
    { word: 'DNA', weight: 0.4 },
    { word: 'Country', weight: 0.36 },
    { word: "God's will", weight: 0.33 },
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

  // Word-cloud placement: strongest belief in the middle, the rest spiral out
  // by rank (phyllotaxis — deterministic, roughly collision-free, no library).
  // The cloud is centered low so it keeps its distance from "or is it…".
  const GOLDEN = 2.399963;
  const placed = [...BELIEFS]
    .sort((a, b) => b.weight - a.weight)
    .map((b, rank) => {
      const em = 0.85 + b.weight * 2.1;
      const angle = rank * GOLDEN + noise(rank, 21) * 0.5;
      const radius = rank === 0 ? 0 : 8.5 + 7.2 * Math.sqrt(rank);
      return {
        ...b,
        em,
        // words start life all at the same rendered size, then grow apart
        startScale: 1.15 / em,
        x: Math.min(88, Math.max(12, 50 + radius * Math.cos(angle) * 1.15)),
        y: Math.min(82, Math.max(32, 54 + radius * Math.sin(angle) * 0.62)),
        drift: 5 + noise(rank, 13) * 5,
      };
    });

  onMount(() => {
    stage?.attach(BEATS, (tl) => {
      const words = root.querySelectorAll<HTMLElement>('.belief');

      // centering via percent channels so y-drift tweens don't clobber it
      tl.set(words, { xPercent: -50, yPercent: -50 }, 0);

      tl.fromTo(orIsIt, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 'orisit+=0.1');

      // beliefs surface one by one — all born equal, then sized by how loudly
      // each is believed; the growing-apart is the beat's whole argument
      words.forEach((el, i) => {
        tl.fromTo(
          el,
          { autoAlpha: 0, scale: placed[i].startScale },
          { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' },
          `cloud+=${(((noise(i, 31) + 1) / 2) * 1.4).toFixed(3)}`,
        );
      });
      // slow deterministic drift so the cloud feels alive under scrub
      for (let i = 0; i < words.length; i++) {
        tl.to(words[i], { y: -placed[i].drift, duration: 2.1, ease: 'none' }, 'cloud+=0.3');
      }

      // it all blurs together — too many stories, no way to weigh them
      tl.to(words, { autoAlpha: 0.16, duration: 0.4 }, 'complex');
      tl.to(orIsIt, { autoAlpha: 0.16, duration: 0.4 }, 'complex');
      tl.to(words, { autoAlpha: 0.08, duration: 0.4 }, 'story');
    });
  });
</script>

<div bind:this={root} class="scene-art beliefs" aria-label="Competing explanations for wealth">
  <p bind:this={orIsIt} class="or-is-it">or is it&hellip;</p>
  {#each placed as b}
    <p
      class="belief"
      style={`inset-inline-start:${b.x.toFixed(1)}%; inset-block-start:${b.y.toFixed(1)}%; font-size:${b.em.toFixed(2)}em;`}
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
    inset-block-start: 10%;
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
    font-weight: 800;
    /* translucent ink: accidental overlaps stay readable, both words show */
    color: color-mix(in oklab, var(--ink) 78%, transparent);
    white-space: nowrap;
  }
</style>
