<script lang="ts">
  /**
   * A speech bubble over a stage (brief 4.3, A2).
   *
   * HTML, not SVG text: Farsi shaping, bidi and the Vazirmatn fallback only
   * work in HTML, and the width is MEASURED, never fixed, so a longer
   * translation grows the bubble instead of spilling out of it.
   *
   * Placement is in the stage's physical pixels, because the speakers' sides
   * are physical in every locale (A2's one exception). The words inside follow
   * the document's direction like everything else.
   */
  import type { Speaker } from './steps';

  interface Props {
    text: string;
    /** Who is speaking — sets the tail's colour and the hidden name. */
    speaker: Speaker | null;
    /** The name a screen reader says first ("Blue"). */
    name?: string;
    /** The speaker's centre and radius, in stage px. */
    anchor: { x: number; y: number; r: number };
    /** The stage, in px, so the bubble never leaves it. */
    bounds: { width: number; height: number };
    /** No pop, no bounce. */
    reduced?: boolean;
  }

  let { text, speaker, name = '', anchor, bounds, reduced = false }: Props = $props();

  const MARGIN = 12;
  const GAP = 10;
  const TAIL = 9;

  let width = $state(0);
  let height = $state(0);

  const placed = $derived.by(() => {
    const w = width || 1;
    const h = height || 1;
    const left = Math.min(Math.max(MARGIN, anchor.x - w / 2), Math.max(MARGIN, bounds.width - w - MARGIN));
    const aboveTop = anchor.y - anchor.r - GAP - TAIL - h;
    const below = aboveTop < MARGIN;
    const top = below ? anchor.y + anchor.r + GAP + TAIL : aboveTop;
    const tailX = Math.min(Math.max(anchor.x - left, 18), w - 18);
    return { left, top, below, tailX };
  });
</script>

{#key text}
  <p
    class="bubble"
    class:below={placed.below}
    class:still={reduced}
    data-speaker={speaker}
    style={`left:${placed.left}px; top:${placed.top}px; --tail-x:${placed.tailX}px;`}
    bind:clientWidth={width}
    bind:clientHeight={height}
  >
    {#if name}<span class="visually-hidden">{name}: </span>{/if}{text}
  </p>
{/key}

<style>
  .bubble {
    position: absolute;
    z-index: 3;
    margin: 0;
    inline-size: max-content;
    max-inline-size: min(24rem, calc(100vw - 24px));
    padding-block: 0.5rem;
    padding-inline: 0.85rem;
    border: 1.5px solid var(--speaker-edge, var(--line));
    border-radius: 1rem;
    color: var(--ink);
    background: var(--paper-bright);
    box-shadow: 0 1px 4px rgb(40 37 31 / 10%);
    font-family: var(--font-serif);
    font-size: clamp(0.98rem, 1.7vw, 1.14rem);
    line-height: 1.4;
    text-align: start;
    pointer-events: none;
    animation: pop 190ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  /* the tail points at whoever is speaking */
  .bubble::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    left: calc(var(--tail-x) - 8px);
    border-inline: 8px solid transparent;
    border-block-start: 9px solid var(--speaker-edge, var(--line));
  }

  .bubble.below::after {
    inset-block-start: auto;
    inset-block-end: 100%;
    border-block-start: 0;
    border-block-end: 9px solid var(--speaker-edge, var(--line));
  }

  .bubble[data-speaker='blue'] {
    --speaker-edge: rgb(157 53 51 / 55%);
  }

  .bubble[data-speaker='red'] {
    --speaker-edge: rgb(40 78 153 / 55%);
  }

  .bubble.still {
    animation: none;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.94) translateY(4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bubble {
      animation: none;
    }
  }
</style>
