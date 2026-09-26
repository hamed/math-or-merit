<script lang="ts">
  /**
   * One title word, arriving through a slot reel (brief 4.5).
   *
   * `position` is a float index into `words`, driven by the scene: 0 shows the
   * first word; the reel runs two words past its answer and comes back to rest
   * on it. The strip moves in em, so it needs no measuring to turn.
   *
   * Every word starts where the answer starts (owner review 2026-09-26: left
   * aligned, never cropped). A word longer than the answer runs on past it —
   * the "?" has not arrived yet — and is set smaller only if it would otherwise
   * run off the stage: `room` is how far it may reach, and each word's natural
   * width is measured, not guessed from its letters.
   */
  import { onMount } from 'svelte';

  interface Props {
    words: readonly string[];
    /** Index of the word the reel lands on — the one the title says. */
    answer: number;
    position: number;
    /** 0 before the reel arrives; 1 once it is on stage. */
    shown: number;
    /** How far a word may reach from the reel's start, in the reel's own px. */
    room?: number;
  }

  let { words, answer, position, shown, room = Infinity }: Props = $props();

  let box: HTMLSpanElement;
  const measures: HTMLSpanElement[] = [];
  let natural = $state<number[]>([]);

  function measure(): void {
    natural = measures.map((m) => m?.getBoundingClientRect().width ?? 0);
  }

  const scale = (i: number) => (natural[i] > 0 && Number.isFinite(room) ? Math.min(1, room / natural[i]) : 1);

  onMount(() => {
    measure();
    // the title's size follows the viewport, and the face may still be loading
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  });
</script>

<span class="reel" style={`opacity:${shown}`} aria-hidden="true" bind:this={box}>
  <span class="sizer">{words[answer]}</span>
  <span class="measure">
    {#each words as word, i (i)}<span bind:this={measures[i]}>{word}</span>{/each}
  </span>
  <span class="strip" style={`transform: translateY(${(-position * 1.2).toFixed(4)}em)`}>
    {#each words as word, i (i)}
      <span class="slot"><span style={`font-size:${scale(i).toFixed(3)}em`}>{word}</span></span>
    {/each}
  </span>
</span>

<style>
  .reel {
    position: relative;
    display: inline-block;
    block-size: 1.2em;
    /* clipped above and below, the reel window; never at the sides */
    overflow-x: visible;
    overflow-y: clip;
    vertical-align: bottom;
  }

  /* holds the answer's width, so the title does not jump when it lands */
  .sizer {
    visibility: hidden;
    white-space: nowrap;
  }

  .measure {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    visibility: hidden;
    white-space: nowrap;
    pointer-events: none;
  }

  .strip {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    will-change: transform;
  }

  /* a plain line box, so a word set smaller still sits on the title's baseline */
  .slot {
    display: block;
    block-size: 1.2em;
    white-space: nowrap;
    line-height: 1.2;
  }
</style>
