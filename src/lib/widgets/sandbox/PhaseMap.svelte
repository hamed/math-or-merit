<script lang="ts">
  import PlotFrame, { type AxisSpec } from './PlotFrame.svelte';
  import { phaseStore, sampleGrid } from './phaseGrid.svelte';
  import { PHASE_RAMPS, rampColor } from '../shared/presets';
  import { niceLinearTicks, percentNumber } from './ticks';
  import { percent } from '../shared/format';
  import { gatedClick } from './gatedClick';

  interface Props {
    /** Current dials, both in [0, 1] — the crosshair lives on the map. */
    stake: number;
    taxRate: number;
  }

  let { stake, taxRate }: Props = $props();

  let rampIdx = $state(0);

  const ramp = $derived(PHASE_RAMPS[rampIdx]);
  const cs = $derived(Math.min(1, Math.max(0, stake)));
  const ct = $derived(Math.min(1, Math.max(0, taxRate)));

  const cycleRamp = gatedClick(() => (rampIdx = (rampIdx + 1) % PHASE_RAMPS.length));

  // measured 11×11 grid, upsampled bilinearly to a smooth backdrop — the
  // display interpolates, the VALUES stay simulated (essay honesty rule)
  const FINE = 55;
  const mapUrl = $derived.by(() => {
    const grid = phaseStore.grid;
    if (!grid) return '';
    const canvas = document.createElement('canvas');
    canvas.width = FINE;
    canvas.height = FINE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const img = ctx.createImageData(FINE, FINE);
    for (let py = 0; py < FINE; py++) {
      for (let px = 0; px < FINE; px++) {
        const g = sampleGrid(grid, px / (FINE - 1), 1 - py / (FINE - 1));
        const at = (py * FINE + px) * 4;
        if (Number.isNaN(g)) {
          img.data[at + 3] = 0;
          continue;
        }
        const hex = rampColor(ramp, g);
        img.data[at] = parseInt(hex.slice(1, 3), 16);
        img.data[at + 1] = parseInt(hex.slice(3, 5), 16);
        img.data[at + 2] = parseInt(hex.slice(5, 7), 16);
        img.data[at + 3] = 255;
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
</script>

<div class="map-box">
  <PlotFrame
    x={xAxis}
    y={yAxis}
    title="every possible world"
    sharedZero
    ariaLabel={`Phase map, stake and tax both 0 to 100%, smooth-shaded from the measured grid. Your dials sit at ${percent(stake)} stake and ${percent(taxRate)} tax; dashed lines mark the cross-sections.`}
  >
    {#snippet children({ xOf, yOf, frame })}
      {#if mapUrl}
        <image
          href={mapUrl}
          x={frame.x}
          y={frame.y}
          width={frame.w}
          height={frame.h}
          preserveAspectRatio="none"
        />
      {:else}
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 - 5} text-anchor="middle">nothing is given —</text>
        <text class="empty" x={frame.x + frame.w / 2} y={frame.y + frame.h / 2 + 6} text-anchor="middle">press Run and it gets measured</text>
      {/if}
      <!-- the cross-sections the two Gini plots are cut along -->
      <line class="section" x1={frame.x} y1={yOf(ct)} x2={frame.x + frame.w} y2={yOf(ct)} />
      <line class="section" x1={xOf(cs)} y1={frame.y} x2={xOf(cs)} y2={frame.y + frame.h} />
      <circle class="marker" cx={xOf(cs)} cy={yOf(ct)} r="4" />
      <circle class="marker-core" cx={xOf(cs)} cy={yOf(ct)} r="1.6" />
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
  .map-box {
    display: flex;
    align-items: stretch;
    gap: 0.15rem;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
  }

  .map-box > :global(svg) {
    flex: 1;
    min-inline-size: 0;
  }

  .section {
    stroke: var(--ink);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.55;
  }

  .marker {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.4;
  }

  .marker-core {
    fill: var(--ink);
  }

  .empty {
    fill: var(--ink-soft);
    font-size: 8.5px;
    font-family: var(--font-sans);
  }

  .colorbar {
    display: flex;
    align-items: stretch;
    gap: 0.1rem;
    align-self: center;
    block-size: 52%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
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
</style>
