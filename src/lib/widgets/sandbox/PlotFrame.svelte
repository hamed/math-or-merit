<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { ActivationEvent } from './gatedClick';

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
    onToggle?: (event: ActivationEvent) => void;
    toggleLabel?: string;
    toggleTooltip?: string;
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
    /** One-line explanation, shown when the reader hovers the title. */
    description?: string;
    /** Optional action attached to the chart title. */
    onTitle?: ((event: ActivationEvent) => void) | null;
    titleActionLabel?: string;
    /** %×% plots: one shared "0" in the corner instead of two colliding. */
    sharedZero?: boolean;
    /** Optional body click action; titles own view changes. */
    onBody?: ((event: ActivationEvent) => void) | null;
    /** Activate a position in the plot body, in fractions of its full axes. */
    onBodyPoint?: ((fx: number, fy: number, event: ActivationEvent) => void) | null;
    bodyTooltip?: string;
    onHoverChange?: ((inside: boolean) => void) | null;
    /** Pointer position over the body in plot fractions [0,1]; null on leave. */
    onBodyMove?: ((fx: number | null, fy: number | null) => void) | null;
    ariaLabel: string;
    children: Snippet<[{ xOf: (v: number) => number; yOf: (v: number) => number; frame: typeof FRAME }]>;
  }

  let {
    x,
    y,
    title,
    description = '',
    onTitle = null,
    titleActionLabel = '',
    sharedZero = false,
    onBody = null,
    onBodyPoint = null,
    bodyTooltip = '',
    onHoverChange = null,
    onBodyMove = null,
    ariaLabel,
    children,
  }: Props = $props();

  function activate(event: KeyboardEvent, handler: ((event: ActivationEvent) => void) | undefined | null): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    handler?.(event);
  }

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

  // Pointer → plot fractions. The SVG letterboxes with `meet`, so map through
  // the square the viewBox actually occupies.
  function pointAt(e: MouseEvent | PointerEvent): { fx: number; fy: number } | null {
    const svg = (e.currentTarget as SVGRectElement).ownerSVGElement;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const side = Math.min(r.width, r.height);
    if (side <= 0) return null;
    const ox = r.left + (r.width - side) / 2;
    const oy = r.top + (r.height - side) / 2;
    const fx = (((e.clientX - ox) / side) * FRAME.W - FRAME.x) / FRAME.w;
    const fy = 1 - (((e.clientY - oy) / side) * FRAME.H - FRAME.y) / FRAME.h;
    return { fx: Math.max(0, Math.min(1, fx)), fy: Math.max(0, Math.min(1, fy)) };
  }

  function moveHandler(e: PointerEvent): void {
    if (!onBodyMove) return;
    const point = pointAt(e);
    if (point) onBodyMove(point.fx, point.fy);
  }

  function bodyClick(e: MouseEvent): void {
    const point = pointAt(e);
    if (point) onBodyPoint?.(point.fx, point.fy, e);
    onBody?.(e);
  }

  function bodyKey(e: KeyboardEvent): void {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    if (onBodyPoint) onBodyPoint(0.5, 0.5, e);
    else onBody?.(e);
  }

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
  {#if onTitle}
    <text
      class="title clickable"
      x={FRAME.x}
      y={FRAME.y - 7}
      text-anchor="start"
      role="button"
      tabindex="0"
      aria-label={`${title}. ${titleActionLabel}`}
      onclick={onTitle}
      onkeydown={(event) => activate(event, onTitle)}
    >
      {title}
      <title>{description} {titleActionLabel}</title>
    </text>
  {:else}
    <text class="title" x={FRAME.x} y={FRAME.y - 7} text-anchor="start">
      {title}
      {#if description}<title>{description}</title>{/if}
    </text>
  {/if}
  <text class="axis-label" x={FRAME.x + FRAME.w} y={FRAME.H - 4} text-anchor="end">
    {x.label}{x.type === 'log' ? ' (log)' : ''}
  </text>
  <text class="axis-label rotated" x={9} y={FRAME.y + FRAME.h / 2} text-anchor="middle">
    {y.label}{y.type === 'log' ? ' (log)' : ''}
  </text>

  <!-- interaction zones; each tooltip names only its own action -->
  {#if y.onToggle}
    <rect class="hit" x="0" y={FRAME.y - 4} width={FRAME.x} height={FRAME.h + 8} onclick={y.onToggle} onkeydown={(event) => activate(event, y.onToggle)} role="button" tabindex="0" aria-label={y.toggleLabel ?? `Toggle the ${y.label} axis between log and linear`}>
      <title>{y.toggleTooltip ?? 'log ↔ linear'}</title>
    </rect>
  {/if}
  {#if x.onToggle}
    <rect class="hit" x={FRAME.x} y={baseline} width={FRAME.w} height={FRAME.H - baseline} onclick={x.onToggle} onkeydown={(event) => activate(event, x.onToggle)} role="button" tabindex="0" aria-label={x.toggleLabel ?? `Toggle the ${x.label} axis between log and linear`}>
      <title>{x.toggleTooltip ?? 'log ↔ linear'}</title>
    </rect>
  {/if}
  {#if onBody || onBodyPoint}
    <rect
      class="hit"
      x={FRAME.x}
      y={FRAME.y}
      width={FRAME.w}
      height={FRAME.h}
      onclick={bodyClick}
      onkeydown={bodyKey}
      onpointerenter={() => onHoverChange?.(true)}
      onpointerleave={() => {
        onHoverChange?.(false);
        onBodyMove?.(null, null);
      }}
      onpointermove={moveHandler}
      role="button"
      tabindex="0"
      aria-label={bodyTooltip}
    >
      {#if bodyTooltip}<title>{bodyTooltip}</title>{/if}
    </rect>
  {:else}
    <rect
      class="hit passive"
      x={FRAME.x}
      y={FRAME.y}
      width={FRAME.w}
      height={FRAME.h}
      onpointerenter={() => onHoverChange?.(true)}
      onpointerleave={() => {
        onHoverChange?.(false);
        onBodyMove?.(null, null);
      }}
      onpointermove={moveHandler}
      role="presentation"
    />
  {/if}
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

  .title.clickable {
    cursor: pointer;
  }

  .title.clickable:focus {
    outline: none;
  }

  .title.clickable:focus-visible {
    fill: var(--accent-deep);
    text-decoration: underline;
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

  .hit:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .hit.passive {
    cursor: default;
  }
</style>
