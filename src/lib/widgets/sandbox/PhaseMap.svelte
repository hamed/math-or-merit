<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { phaseData, pointsFor } from './phaseGrid.svelte';
  import { PHASE_RAMPS, rampColor } from '../shared/presets';
  import { niceLinearTicks, percentNumber } from './ticks';
  import { percent } from '../shared/format';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Current dials, both in [0, 1] — the crosshair lives on the map. */
    stake: number;
    taxRate: number;
    /** Room size: measured points are finite-size, shown per-n only. */
    n: number;
    /** The live room's instantaneous Gini — the wandering, unsolidified dot. */
    liveGini: number;
    /** Hover probe: fractions over the map, for previewing cross-sections. */
    onProbe?: ((stake: number | null, tax: number | null) => void) | null;
  }

  let { stake, taxRate, n, liveGini, onProbe = null }: Props = $props();

  let rampIdx = $state(0);
  // display styles for the measured points — a body click cycles them so the
  // owner (and readers) can compare: solid cells / count-sized dots / shade
  const MODES = ['cells', 'dots', 'shade'] as const;
  let modeIdx = $state(0);
  const mode = $derived(MODES[modeIdx]);

  const ramp = $derived(PHASE_RAMPS[rampIdx]);
  const cs = $derived(Math.min(1, Math.max(0, stake)));
  const ct = $derived(Math.min(1, Math.max(0, taxRate)));

  let probe = $state<{ s: number; t: number } | null>(null);

  const cycleRamp = gatedClick(() => (rampIdx = (rampIdx + 1) % PHASE_RAMPS.length));
  const cycleMode = gatedClick(() => (modeIdx = (modeIdx + 1) % MODES.length));

  const points = $derived.by(() => {
    void phaseData.version;
    return pointsFor(n);
  });

  // shade mode: nearest measured point colors its neighborhood — regions
  // grow organically as the reader's data accumulates
  const FINE = 55;
  const REACH = 0.13;
  const shadeUrl = $derived.by(() => {
    if (mode !== 'shade' || points.length === 0) return '';
    const canvas = document.createElement('canvas');
    canvas.width = FINE;
    canvas.height = FINE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const img = ctx.createImageData(FINE, FINE);
    for (let py = 0; py < FINE; py++) {
      for (let px = 0; px < FINE; px++) {
        const sx = px / (FINE - 1);
        const ty = 1 - py / (FINE - 1);
        let best: { d: number; g: number } | null = null;
        for (const p of points) {
          const d = Math.hypot(p.stake - sx, p.tax - ty);
          if (d <= REACH && (!best || d < best.d)) best = { d, g: p.gini };
        }
        const at = (py * FINE + px) * 4;
        if (!best) {
          img.data[at + 3] = 0;
          continue;
        }
        const hex = rampColor(ramp, Math.max(0, Math.min(1, best.g)));
        img.data[at] = parseInt(hex.slice(1, 3), 16);
        img.data[at + 1] = parseInt(hex.slice(3, 5), 16);
        img.data[at + 2] = parseInt(hex.slice(5, 7), 16);
        img.data[at + 3] = 235;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  });

  const axisTicks = niceLinearTicks(0, 1);
  const xAxis: AxisSpec = $derived({
    type: 'linear',
    lo: 0,
    hi: 1,
    ticks: axisTicks,
    format: percentNumber,
    label: 'stake %',
  });
  const yAxis: AxisSpec = $derived({
    type: 'linear',
    lo: 0,
    hi: 1,
    ticks: axisTicks,
    format: percentNumber,
    label: 'tax %',
  });

  function handleMove(fx: number | null, fy: number | null): void {
    probe = fx === null || fy === null ? null : { s: fx, t: fy };
    onProbe?.(fx, fy);
  }
</script>

<div class="map-box">
  <PlotFrame
    x={xAxis}
    y={yAxis}
    title={`measured worlds — n=${n}`}
    description="Each mark is a steady state YOUR runs measured: stake across, tax up, color = settled Gini. Hover to preview cross-sections; click to change the drawing style."
    sharedZero
    onBody={cycleMode}
    bodyTooltip={`drawn as ${mode} — click for the next style`}
    onBodyMove={handleMove}
    ariaLabel={`Phase map of ${points.length} measured settings for rooms of ${n}. Your dials sit at ${percent(stake)} stake and ${percent(taxRate)} tax; dashed lines mark the cross-sections.`}
  >
    {#snippet children({ xOf, yOf, frame })}
      {#if points.length === 0}
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 - 5} text-anchor="middle">nothing is given —</text>
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 + 6} text-anchor="middle">every settled run paints its point</text>
      {:else if mode === 'shade' && shadeUrl}
        <image href={shadeUrl} x={frame.x} y={frame.y} width={frame.w} height={frame.h} preserveAspectRatio="none" />
      {:else if mode === 'cells'}
        {#each points as p (p.stake + '|' + p.tax)}
          <rect
            class="cell"
            x={xOf(p.stake) - 5.5}
            y={yOf(p.tax) - 5.5}
            width="11"
            height="11"
            fill={rampColor(ramp, Math.max(0, Math.min(1, p.gini)))}
          >
            <title>stake {percent(p.stake)} · tax {percent(p.tax)} → Gini {p.gini.toFixed(2)} ({p.count}×)</title>
          </rect>
        {/each}
      {:else}
        {#each points as p (p.stake + '|' + p.tax)}
          <circle
            class="dot"
            cx={xOf(p.stake)}
            cy={yOf(p.tax)}
            r={3 + Math.min(3, Math.log2(p.count + 1))}
            fill={rampColor(ramp, Math.max(0, Math.min(1, p.gini)))}
          >
            <title>stake {percent(p.stake)} · tax {percent(p.tax)} → Gini {p.gini.toFixed(2)} ({p.count}×)</title>
          </circle>
        {/each}
      {/if}

      <!-- the dial cross-sections the two Gini plots are cut along -->
      <line class="section" x1={frame.x} y1={yOf(ct)} x2={frame.x + frame.w} y2={yOf(ct)} />
      <line class="section" x1={xOf(cs)} y1={frame.y} x2={xOf(cs)} y2={frame.y + frame.h} />

      <!-- hover probe: a second, lighter cross — previews the cuts -->
      {#if probe}
        <line class="probe" x1={frame.x} y1={yOf(probe.t)} x2={frame.x + frame.w} y2={yOf(probe.t)} />
        <line class="probe" x1={xOf(probe.s)} y1={frame.y} x2={xOf(probe.s)} y2={frame.y + frame.h} />
      {/if}

      <!-- the live room: an unsolidified, wandering reading at your dials -->
      {#if Number.isFinite(liveGini)}
        <circle class="live" cx={xOf(cs)} cy={yOf(ct)} r="4.4" fill={rampColor(ramp, Math.max(0, Math.min(1, liveGini)))} />
      {/if}
      <circle class="marker" cx={xOf(cs)} cy={yOf(ct)} r="4.4" />
    {/snippet}
  </PlotFrame>

  <!-- Gini colorbar on the right; a click cycles the colormap -->
  <button
    class="colorbar"
    type="button"
    onclick={cycleRamp}
    aria-label="Gini color scale, 0 at the bottom to 1 at the top; activate for the next colormap"
    title="colormap"
  >
    <span class="bar" style={`background: linear-gradient(to top, ${ramp.join(', ')})`}></span>
    <span class="bar-ticks" aria-hidden="true">
      <span>1</span>
      <span>0.5</span>
      <span>0</span>
    </span>
  </button>
</div>

<style>
  /* The colorbar is positioned OUT of flow on purpose. As a flex sibling it ate
     horizontal space, so this plot rendered narrower than the other five and
     its axes, fonts and title no longer lined up with them. Now the svg fills
     the cell exactly like every sibling and the bar sits in the gutter beside
     it. */
  .map-box {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
  }

  .map-box > :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }

  .cell,
  .dot {
    stroke: rgb(60 53 43 / 30%);
    stroke-width: 0.5;
  }

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
    pointer-events: none;
  }

  .probe {
    stroke: var(--accent-deep);
    stroke-width: 0.9;
    stroke-dasharray: 1.5 2.5;
    opacity: 0.8;
    pointer-events: none;
  }

  .live {
    opacity: 0.75;
    animation: breathe 1.6s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes breathe {
    0%,
    100% {
      opacity: 0.45;
    }

    50% {
      opacity: 0.85;
    }
  }

  .marker {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.4;
    pointer-events: none;
  }

  .empty {
    fill: var(--ink-soft);
    font-size: 8.5px;
    font-family: var(--font-sans);
  }

  .colorbar {
    position: absolute;
    /* Sits in the plot's own right margin by default. Only where there is room
       does it move out into the grid gutter — a negative offset at phone widths
       pushed the page into horizontal overflow. */
    inset-inline-end: 0;
    inset-block-start: 50%;
    translate: 0 -50%;
    display: flex;
    justify-content: end;
    align-items: stretch;
    gap: 0.1rem;
    min-inline-size: 2.75rem;
    block-size: 52%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  @media (min-width: 60rem) {
    .colorbar {
      inset-inline-end: -1.15rem;
    }
  }

  /* No room for the numbers beside the bar on a phone; the button keeps its
     aria-label, so the scale is still described. */
  @media (max-width: 60rem) {
    .bar-ticks {
      display: none;
    }
  }

  .colorbar:focus-visible {
    outline: 2px solid rgb(139 63 43 / 45%);
  }

  .bar {
    inline-size: 0.38rem;
    border-radius: 2px;
    border: 1px solid rgb(60 53 43 / 25%);
  }

  .bar-ticks {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-family: var(--font-sans);
    font-size: 0.45rem;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .live {
      animation: none;
    }
  }
</style>
