<script lang="ts">
  import { logBins, toDollars } from '../distribution/binning';
  import { dollarsCompact } from './format';
  import { DUST_DOLLARS } from './presets';

  /** Compact log-decade histogram — the sidebar companion chart. */
  interface Props {
    wealth: ArrayLike<number>;
    startDollars: number;
    /** Bump to re-read a mutating wealth array (RoomCanvas convention). */
    revision?: number;
  }

  let { wealth, startDollars, revision = 0 }: Props = $props();

  const W = 148;
  const H = 78;
  const BASE = H - 14;

  const bins = $derived.by(() => {
    void revision;
    return logBins(toDollars(wealth, startDollars), DUST_DOLLARS);
  });
  const n = $derived(wealth.length);

  // stepped log-y so the dust wall never crushes the tail (storyboard p8)
  const yOf = (count: number) => ((BASE - 10) * Math.log10(count + 1)) / Math.log10(n + 1);
</script>

<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Log-scale histogram: ${bins.dustCount} near zero`}>
  {#each [{ count: bins.dustCount, dust: true }, ...bins.counts.map((count) => ({ count, dust: false }))] as bar, s}
    {@const slotW = W / (bins.counts.length + 1)}
    {@const h = bar.count > 0 ? Math.max(1.6, yOf(bar.count)) : 0}
    <rect class="bar" class:dust={bar.dust} x={s * slotW + 1.5} y={BASE - h} width={slotW - 3} height={h} />
  {/each}
  <line class="axis" x1="0" y1={BASE} x2={W} y2={BASE} />
  <text class="tick" x="1" y={H - 3} text-anchor="start">≈0</text>
  <text class="tick" x={W - 1} y={H - 3} text-anchor="end">{dollarsCompact(bins.edges[bins.edges.length - 1])}</text>
</svg>

<style>
  svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .bar {
    fill: rgb(189 98 69 / 55%);
    stroke: #96543c;
    stroke-width: 0.8;
  }

  .bar.dust {
    fill: rgb(110 85 62 / 38%);
    stroke: #8a7a64;
    stroke-dasharray: 3 2.4;
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1;
  }

  .tick {
    fill: #756c5d;
    font-size: 9px;
    font-variant-numeric: tabular-nums;
  }
</style>
