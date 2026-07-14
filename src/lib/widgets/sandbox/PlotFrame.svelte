<script lang="ts" module>
  import type { Snippet } from 'svelte';

  /** One axis of a framed plot. The unit lives in `label`, ticks are bare. */
  export interface AxisSpec {
    type: 'linear' | 'log';
    /** Domain. For log axes lo must be > 0. */
    lo: number;
    hi: number;
    ticks: readonly number[];
    format: (v: number) => string;
    label: string;
    /** Site convention: clicking an axis toggles its scale. */
    onToggle?: () => void;
  }

  /** Shared geometry — every sandbox plot is this exact frame. */
  export const FRAME = { W: 170, H: 170, x: 34, y: 18, w: 128, h: 118 } as const;

  let clipCounter = 0;
</script>

<script lang="ts">
  interface Props {
    x: AxisSpec;
    y: AxisSpec;
    title: string;
    /** %×% plots: one shared "0" in the corner instead of two colliding. */
    sharedZero?: boolean;
    /** Body click (cycle bins / next view). Tooltip says only what applies. */
    onBody?: (() => void) | null;
    bodyTooltip?: string;
    onHoverChange?: ((inside: boolean) => void) | null;
    ariaLabel: string;
    children: Snippet<[{ xOf: (v: number) => number; yOf: (v: number) => number; frame: typeof FRAME }]>;
  }

  let {
    x,
    y,
    title,
    sharedZero = false,
    onBody = null,
    bodyTooltip = '',
    onHoverChange = null,
    ariaLabel,
    children,
  }: Props = $props();

  const clipId = `plotclip-${++clipCounter}`;

  // coordinates clamp far outside the frame (never inside it): a 1e300 value
  // from a deliberately broken economy must not write exponent notation into
  // a path — the clip already hides everything beyond the plot anyway
  const sane = (px: number) => (Number.isFinite(px) ? Math.max(-1000, Math.min(1200, px)) : -1000);

  function scaleOf(axis: AxisSpec, span: number): (v: number) => number {
    if (axis.type === 'log') {
      const lo = Math.log10(axis.lo);
      const hi = Math.log10(axis.hi);
      return (v: number) => sane(v <= 0 ? 0 : ((Math.log10(v) - lo) / (hi - lo || 1)) * span);
    }
    return (v: number) => sane(((v - axis.lo) / (axis.hi - axis.lo || 1)) * span);
  }

  const xOf = $derived.by(() => {
    const s = scaleOf(x, FRAME.w);
    return (v: number) => FRAME.x + s(v);
  });
  const yOf = $derived.by(() => {
    const s = scaleOf(y, FRAME.h);
    return (v: number) => FRAME.y + FRAME.h - s(v);
  });

  const baseline = FRAME.y + FRAME.h;
  const zeroShared = $derived(sharedZero && x.ticks[0] === 0 && y.ticks[0] === 0);

  // edge labels anchor inward so nothing clips at the frame border
  function xAnchor(px: number): string {
    if (px < FRAME.x + 10) return 'start';
    if (px > FRAME.x + FRAME.w - 12) return 'end';
    return 'middle';
  }
</script>

<svg
  viewBox={`0 0 ${FRAME.W} ${FRAME.H}`}
  class="frame"
  role="img"
  aria-label={ariaLabel}
>
  <defs>
    <clipPath id={clipId}>
      <rect x={FRAME.x - 1} y={FRAME.y - 1} width={FRAME.w + 2} height={FRAME.h + 2} />
    </clipPath>
  </defs>

  <!-- grid -->
  {#each y.ticks as t}
    <line class="grid" x1={FRAME.x} y1={yOf(t)} x2={FRAME.x + FRAME.w} y2={yOf(t)} />
  {/each}
  {#each x.ticks as t}
    <line class="grid" x1={xOf(t)} y1={FRAME.y} x2={xOf(t)} y2={baseline} />
  {/each}

  <!-- data -->
  <g clip-path={`url(#${clipId})`}>
    {@render children({ xOf, yOf, frame: FRAME })}
  </g>

  <!-- axes over the data -->
  <line class="axis" x1={FRAME.x} y1={baseline} x2={FRAME.x + FRAME.w} y2={baseline} />
  <line class="axis" x1={FRAME.x} y1={FRAME.y} x2={FRAME.x} y2={baseline} />

  <!-- tick labels -->
  {#each y.ticks as t}
    {#if !(zeroShared && t === 0)}
      <text class="tick" x={FRAME.x - 3} y={yOf(t) + 2.5} text-anchor="end">{y.format(t)}</text>
    {/if}
  {/each}
  {#each x.ticks as t}
    {#if !(zeroShared && t === 0)}
      <text class="tick" x={xOf(t)} y={baseline + 10} text-anchor={xAnchor(xOf(t))}>{x.format(t)}</text>
    {/if}
  {/each}
  {#if zeroShared}
    <text class="tick" x={FRAME.x - 3} y={baseline + 10} text-anchor="end">0</text>
  {/if}

  <!-- title + axis labels; the unit rides the label, scale rides the suffix -->
  <text class="title" x={FRAME.x} y={FRAME.y - 7} text-anchor="start">{title}</text>
  <text class="axis-label" x={FRAME.x + FRAME.w} y={FRAME.H - 4} text-anchor="end">
    {x.label}{x.type === 'log' ? ' (log)' : ''}
  </text>
  <text class="axis-label rotated" x={9} y={FRAME.y + FRAME.h / 2} text-anchor="middle">
    {y.label}{y.type === 'log' ? ' (log)' : ''}
  </text>

  <!-- interaction zones; each tooltip names only its own action -->
  {#if y.onToggle}
    <rect class="hit" x="0" y={FRAME.y - 4} width={FRAME.x} height={FRAME.h + 8} onclick={y.onToggle} role="button" tabindex="-1" aria-label={`Toggle the ${y.label} axis between log and linear`}>
      <title>log ↔ linear</title>
    </rect>
  {/if}
  {#if x.onToggle}
    <rect class="hit" x={FRAME.x} y={baseline} width={FRAME.w} height={FRAME.H - baseline} onclick={x.onToggle} role="button" tabindex="-1" aria-label={`Toggle the ${x.label} axis between log and linear`}>
      <title>log ↔ linear</title>
    </rect>
  {/if}
  <rect
    class="hit"
    class:passive={!onBody}
    x={FRAME.x}
    y={FRAME.y}
    width={FRAME.w}
    height={FRAME.h}
    onclick={onBody ?? undefined}
    onpointerenter={() => onHoverChange?.(true)}
    onpointerleave={() => onHoverChange?.(false)}
    role={onBody ? 'button' : 'presentation'}
    tabindex="-1"
    aria-label={onBody ? bodyTooltip : undefined}
  >
    {#if onBody && bodyTooltip}<title>{bodyTooltip}</title>{/if}
  </rect>
</svg>

<style>
  .frame {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    font-family: var(--font-sans);
  }

  .axis {
    stroke: #a99980;
    stroke-width: 1;
  }

  .grid {
    stroke: rgb(169 153 128 / 28%);
    stroke-width: 0.7;
  }

  .tick {
    fill: var(--ink-soft);
    font-size: 8px;
    font-variant-numeric: tabular-nums;
  }

  .title {
    fill: var(--ink-mid);
    font-size: 9.5px;
    font-weight: 650;
    letter-spacing: 0.03em;
  }

  .axis-label {
    fill: var(--ink-soft);
    font-size: 9px;
    letter-spacing: 0.04em;
  }

  .rotated {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  .hit {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }

  .hit.passive {
    cursor: default;
  }
</style>
