<script lang="ts" module>
  import frontUrl from './coin/front.webp';
  import backUrl from './coin/back.webp';

  export type CoinFace = 'front' | 'back';

  const FACES: Record<CoinFace, string> = { front: frontUrl, back: backUrl };
</script>

<script lang="ts">
  /**
   * The canonical coin (owner review 2026-07-08; photographed 2026-08-25): one
   * fixed size per context — wealth changes coin COUNT, never coin size.
   *
   * It is a REAL coin, both faces of it: Mongol Bank, 1000 tögrög, half a gram
   * of gold, Karl Marx, 2019. That is the joke and it is worth keeping — the
   * essay's money is a coin with Marx's head on it, minted and sold as a
   * collectible. Provenance and rights: notes/research.md.
   *
   * Gold is the essay's reserved colour for money (agentStyle.ts), so the
   * photograph is NOT re-tinted the way the cast plates are; the rim stroke is
   * the only drawn mark, and it exists so the disc still reads as an edge
   * against warm paper.
   */
  interface Props {
    cx?: number;
    cy?: number;
    r?: number;
    /** Which side is up. Two coins on a table show two different faces. */
    face?: CoinFace;
  }

  let { cx = 0, cy = 0, r = 16.6, face = 'front' }: Props = $props();
</script>

<g class="coin-token" transform={`translate(${cx} ${cy})`}>
  <image
    class="face"
    href={FACES[face]}
    x={-r}
    y={-r}
    width={r * 2}
    height={r * 2}
    preserveAspectRatio="xMidYMid meet"
  />
  <circle r={r * 0.985} class="rim" />
</g>

<style>
  /* the photograph carries its own alpha outside the disc; the clip is belt
     and braces, so a source squared a pixel off never shows a corner */
  .face {
    clip-path: circle(50%);
  }

  .rim {
    fill: none;
    stroke: var(--coin-ink);
    stroke-width: 0.8;
    opacity: 0.35;
  }
</style>
