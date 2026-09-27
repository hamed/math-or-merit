<script lang="ts">
  /**
   * A plot's axes drawn on the stage itself, in stage pixels, in the
   * sandbox's own style (`PlotFrame`: the same grid, axis ink and tick type),
   * so a picture the room makes reads as a proper plot (owner review
   * 2026-09-26: "they all need to be properly formatted plots"). Linear axes
   * only: the multiplying ruler keeps its own sliding marks.
   */
  import type { AxisSpec } from '../../../sandbox/PlotFrame.svelte';

  type Axis = Pick<AxisSpec, 'lo' | 'hi' | 'ticks' | 'format' | 'label'>;

  interface Props {
    frame: { x: number; y: number; w: number; h: number };
    x: Axis;
    y: Axis;
    /** Faint grid lines at every tick. */
    grid?: boolean;
    /** %×% plots: one shared "0" in the corner instead of two colliding. */
    sharedZero?: boolean;
    /** Where the x axis's label sits, below its ticks (default just under them). */
    xLabelY?: number;
    opacity?: number;
  }

  let { frame, x, y, grid = true, sharedZero = false, xLabelY, opacity = 1 }: Props = $props();

  const xOf = (v: number) => frame.x + ((v - x.lo) / (x.hi - x.lo || 1)) * frame.w;
  const yOf = (v: number) => frame.y + frame.h - ((v - y.lo) / (y.hi - y.lo || 1)) * frame.h;
  const bottom = $derived(frame.y + frame.h);
  const zeroShared = $derived(sharedZero && x.ticks[0] === 0 && y.ticks[0] === 0);
  const anchor = (px: number) => (px < frame.x + 12 ? 'start' : px > frame.x + frame.w - 14 ? 'end' : 'middle');
</script>

<g class="axes" {opacity} aria-hidden="true">
  {#if grid}
    {#each y.ticks as t (t)}
      <line class="grid" x1={frame.x} y1={yOf(t)} x2={frame.x + frame.w} y2={yOf(t)} />
    {/each}
    {#each x.ticks as t (t)}
      <line class="grid" x1={xOf(t)} y1={frame.y} x2={xOf(t)} y2={bottom} />
    {/each}
  {/if}
  <line class="axis" x1={frame.x} y1={bottom} x2={frame.x + frame.w} y2={bottom} />
  <line class="axis" x1={frame.x} y1={frame.y} x2={frame.x} y2={bottom} />
  {#each y.ticks as t (t)}
    {#if !(zeroShared && t === 0)}
      <line class="axis" x1={frame.x - 4} y1={yOf(t)} x2={frame.x} y2={yOf(t)} />
      <text class="tick" x={frame.x - 7} y={yOf(t) + 4} text-anchor="end">{y.format(t)}</text>
    {/if}
  {/each}
  {#each x.ticks as t (t)}
    {#if !(zeroShared && t === 0)}
      <line class="axis" x1={xOf(t)} y1={bottom} x2={xOf(t)} y2={bottom + 4} />
      <text class="tick" x={xOf(t)} y={bottom + 17} text-anchor={anchor(xOf(t))}>{x.format(t)}</text>
    {/if}
  {/each}
  {#if zeroShared}
    <text class="tick" x={frame.x - 7} y={bottom + 17} text-anchor="end">0</text>
  {/if}
  <text class="label" x={frame.x + frame.w} y={xLabelY ?? bottom + 34} text-anchor="end">{x.label}</text>
  <text class="label" transform={`translate(${frame.x - 42} ${frame.y + frame.h / 2}) rotate(-90)`} text-anchor="middle">{y.label}</text>
</g>

<style>
  .axis {
    stroke: #a99980;
    stroke-width: 1.2;
  }

  .grid {
    stroke: rgb(169 153 128 / 28%);
    stroke-width: 1;
  }

  .tick {
    fill: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .label {
    fill: var(--ink-soft);
    font-family: var(--font-sans);
    font-size: 12px;
    letter-spacing: 0.04em;
  }
</style>
