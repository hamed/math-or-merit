<script lang="ts">
  /**
   * A character's line where there is no bubble — beside a widget, under a
   * chart (A6). The line is set in its speaker's colour: `--agent-stroke-blue`
   * for Blue, `--agent-stroke-red` for Red, 6.9:1 and 6.1:1 on the paper. The
   * pastel fills are never text (about 1.4:1).
   *
   * Colour is never the only cue: the name is there for a screen reader, and a
   * small circle in the speaker's own costume sits at the start of the line.
   */
  import type { Speaker } from './steps';

  interface Props {
    speaker: Speaker;
    name: string;
    text: string;
  }

  let { speaker, name, text }: Props = $props();
</script>

<p class="said" data-speaker={speaker}>
  <span class="glyph" aria-hidden="true"></span><span class="visually-hidden">{name}: </span>{text}
</p>

<style>
  .said {
    display: flex;
    align-items: baseline;
    gap: 0.5em;
    margin-block: 0.5rem;
    font-family: var(--font-serif);
    font-size: 1.05rem;
    line-height: 1.45;
    text-align: start;
  }

  .said[data-speaker='blue'] {
    color: var(--agent-stroke-blue);
    --glyph-fill: var(--agent-fill-blue);
    --glyph-edge: var(--agent-stroke-red);
  }

  .said[data-speaker='red'] {
    color: var(--agent-stroke-red);
    --glyph-fill: var(--agent-fill-red);
    --glyph-edge: var(--agent-stroke-blue);
  }

  /* the speaker's own costume, as in 4.2: Blue is a blue circle with a red
     edge, Red a red circle with a blue edge */
  .glyph {
    flex: none;
    inline-size: 0.72em;
    block-size: 0.72em;
    border: 1.5px solid var(--glyph-edge);
    border-radius: 50%;
    background: var(--glyph-fill);
    transform: translateY(0.05em);
  }
</style>
