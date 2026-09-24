<script lang="ts">
  /**
   * One title word, arriving through a slot reel (brief 4.5).
   *
   * `position` is a float index into `words`, driven by the scene: 0 shows the
   * first word; the reel runs two words past its answer and comes back to rest
   * on it. The strip moves in em, so it needs no measuring at any size, and a
   * long word is set smaller rather than widening the title.
   */
  interface Props {
    words: readonly string[];
    /** Index of the word the reel lands on — the one the title says. */
    answer: number;
    position: number;
    /** 0 before the reel arrives; 1 once it is on stage. */
    shown: number;
  }

  let { words, answer, position, shown }: Props = $props();

  const reference = $derived(Math.max(5, words[answer]?.length ?? 5));
  const scale = (word: string) => Math.min(1, reference / Math.max(1, word.length));
</script>

<span class="reel" style={`opacity:${shown}`} aria-hidden="true">
  <span class="sizer">{words[answer]}</span>
  <span class="strip" style={`transform: translateY(${(-position * 1.2).toFixed(4)}em)`}>
    {#each words as word, i (i)}
      <span class="slot"><span style={`font-size:${scale(word).toFixed(3)}em`}>{word}</span></span>
    {/each}
  </span>
</span>

<style>
  .reel {
    position: relative;
    display: inline-block;
    block-size: 1.2em;
    overflow: hidden;
    vertical-align: bottom;
  }

  /* holds the answer's width, so the title does not jump when it lands */
  .sizer {
    visibility: hidden;
    white-space: nowrap;
  }

  .strip {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    will-change: transform;
  }

  .slot {
    display: flex;
    align-items: center;
    justify-content: center;
    block-size: 1.2em;
    white-space: nowrap;
    line-height: 1.2;
  }
</style>
