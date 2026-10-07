<script lang="ts">
  /**
   * A face, drawn from a ready drawing (draw.ts): a few paths in paint order.
   * All the work happens before, in plain code and per face only when it
   * changes; this only puts the strings on the page. The caller places it at
   * the body's centre, over the body and any coins in it.
   */
  import { GROUND, INK, WHITE, type FaceDrawing } from './draw';

  interface Props {
    drawing: FaceDrawing;
    /** The body's stroke colour: the features are drawn in it (the ink look in ink). */
    stroke: string;
    /** The body's fill, and how opaque it is drawn, for a peeker's lid. */
    fill: string;
    fillOpacity?: number;
    /** Unique per face on the page: the lids' clip is named after it. */
    uid: string;
  }

  let { drawing: d, stroke, fill, fillOpacity = 0.75, uid }: Props = $props();

  const pen = $derived(d.inked ? INK : stroke);
</script>

{#snippet marks(list: FaceDrawing['under'])}
  {#each list as m, k (k)}
    <path d={m.d} fill={m.fill || 'none'} stroke={m.stroke === 'none' ? undefined : m.stroke || stroke} stroke-width={m.width || undefined} opacity={m.opacity} />
  {/each}
{/snippet}

<g transform={d.transform || undefined} stroke-linecap="round" stroke-linejoin="round">
  {@render marks(d.under)}
  {#if d.white}<path d={d.white} fill={WHITE} />{/if}
  {#if d.clip}
    <clipPath id={uid}><path d={d.clip} /></clipPath>
    <path d={d.clipped} fill={pen} clip-path={`url(#${uid})`} />
  {/if}
  {#if d.ink}<path d={d.ink} fill={pen} />{/if}
  {#if d.lid}
    <path d={d.lid} fill={GROUND} />
    <path d={d.lid} {fill} fill-opacity={fillOpacity} />
  {/if}
  {#if d.rings}<path d={d.rings} fill="none" stroke={pen} stroke-width={d.lineWidth * 0.85} />{/if}
  {#if d.glint}<path d={d.glint} fill={WHITE} />{/if}
  {#if d.lines}<path d={d.lines} fill="none" stroke={pen} stroke-width={d.lineWidth} />{/if}
  {#if d.thin}<path d={d.thin} fill="none" stroke={pen} stroke-width={d.lineWidth * 0.7} />{/if}
  {#if d.heavy}<path d={d.heavy} fill="none" stroke={pen} stroke-width={d.lineWidth * 1.3} />{/if}
  {@render marks(d.over)}
</g>
{@render marks(d.outer)}
