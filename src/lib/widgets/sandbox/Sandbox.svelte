<script lang="ts" module>
  /**
   * The sandbox is the essay's one machine with every dial exposed — and the
   * seam for reuse (owner review 2026-07-13): earlier beats can become presets
   * of THIS component by hiding panels, disabling controls, and dropping to
   * the `column` layout. Configuration is data; no per-preset branches.
   */
  export interface SandboxPanels {
    histogram: boolean;
    lorenz: boolean;
    ccdf: boolean;
    time: boolean;
    phase: boolean;
    stats: boolean;
  }

  export interface SandboxControls {
    population: boolean;
    speed: boolean;
    look: boolean;
    stake: boolean;
    tax: boolean;
    clickTax: boolean;
    progressivity: boolean;
    startWealth: boolean;
    news: boolean;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import RoomCanvas from '../shared/RoomCanvas.svelte';
  import Histogram from './Histogram.svelte';
  import CcdfChart from './CcdfChart.svelte';
  import TimeSeries from './TimeSeries.svelte';
  import PhasePanel from './PhasePanel.svelte';
  import NewsFlash from './NewsFlash.svelte';
  import { createTicker } from '../shared/ticker';
  import { measureWealth, lorenzCurve } from '$lib/research';
  import { lorenzGapPath, lorenzLinePath } from '../shared/lorenzPath';
  import { FILLS, STROKES, randomStyles } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';
  import { roomPositions, radiusScale, zoneName } from '../shared/layout';
  import { countTrades, dollarsCompact, percent } from '../shared/format';
  import { SandboxWorld } from './SandboxWorld';
  import { START_DOLLARS } from '../shared/presets';

  interface Props {
    /** `full` owns the whole screen (the finale); `column` sits in the prose. */
    layout?: 'full' | 'column';
    panels?: Partial<SandboxPanels>;
    controls?: Partial<SandboxControls>;
  }

  let { layout = 'full', panels = {}, controls = {} }: Props = $props();

  const show: SandboxPanels = $derived({
    histogram: true,
    lorenz: true,
    ccdf: true,
    time: true,
    phase: true,
    stats: true,
    ...panels,
  });
  const ctl: SandboxControls = $derived({
    population: true,
    speed: true,
    look: true,
    stake: true,
    tax: true,
    clickTax: true,
    progressivity: true,
    startWealth: true,
    news: true,
    ...controls,
  });

  const LORENZ = { x: 34, y: 130, size: 104 };
  // powers of two, half/double, like a calculator (owner review 2026-07-14)
  const MIN_N = 2;
  const MAX_N = 1024;
  // mirror of roomRenderer's legacy single-family look (keep in sync)
  const CLASSIC_FILL = 'rgb(189 98 69 / 26%)';
  const CLASSIC_STROKE = '#96543c';
  const LOOKS = ['shapes', 'circles', 'classic'] as const;
  type Look = (typeof LOOKS)[number];

  let n = $state(128);
  let stake = $state(0.2);
  let taxRate = $state(0);
  let clickRate = $state(0.25);
  let startDollars = $state(START_DOLLARS);
  let speed = $state(4);
  let look = $state<Look>('shapes');
  // the look button wears a fresh palette pair on every press
  let lookSwatch = $state({ fill: FILLS.violet, stroke: STROKES.teal });

  let world = $state(makeWorld(128));
  let styles = $state(randomStyles(128));

  // display-only, as ever: the look never touches the simulation
  const displayStyles = $derived(
    look === 'classic'
      ? null
      : look === 'circles'
        ? styles.map((s) => ({ ...s, shape: 'circle' as const }))
        : styles,
  );
  let revision = $state(0);
  let running = $state(false);
  let gini = $state(0);
  let topShare = $state(0);

  let rootEl: HTMLDivElement | undefined = $state();
  let room: RoomCanvas | undefined = $state();
  let roomW = $state(0);
  let roomH = $state(0);

  let zoomed = $state<null | 'hist' | 'lorenz' | 'ccdf' | 'time' | 'phase'>(null);

  let newsOpen = $state(false);
  let newsWinner = $state(-1);
  let newsRun = $state(-1);

  function makeWorld(count: number): SandboxWorld {
    const w = new SandboxWorld({
      n: count,
      seed: Math.floor(Math.random() * 0xffff_ffff),
      startDollars,
    });
    w.taxEvery = count;
    return w;
  }

  function pushDials(): void {
    world.beta = stake;
    world.taxRate = taxRate;
  }

  function measure(): void {
    const m = measureWealth(world.wealth);
    gini = m.gini;
    topShare = m.topShare;
  }

  const lorenzPoints = $derived.by(() => {
    void revision;
    return lorenzCurve(world.wealth);
  });

  const ticker = createTicker(() => {
    pushDials();
    world.step(Math.max(1, Math.round((n / 3) * speed)));
    revision++;
    measure();
  });

  function toggle(): void {
    if (running) {
      running = false;
      ticker.stop();
    } else {
      running = true;
      ticker.start();
    }
  }

  function scalePopulation(factor: 2 | 0.5): void {
    n = Math.min(MAX_N, Math.max(MIN_N, n * factor));
    reset();
  }

  function setStartDollars(value: number): void {
    startDollars = Math.min(1_000_000, Math.max(1, Math.round(value) || START_DOLLARS));
    reset();
  }

  function reset(): void {
    running = false;
    ticker.stop();
    closeNews();
    world = makeWorld(n);
    styles = randomStyles(n);
    pushDials();
    revision++;
    measure();
  }

  function cycleLook(): void {
    look = LOOKS[(LOOKS.indexOf(look) + 1) % LOOKS.length];
    const hues = Object.keys(FILLS) as (keyof typeof FILLS)[];
    const fill = hues[Math.floor(Math.random() * hues.length)];
    const others = hues.filter((h) => h !== fill);
    const stroke = others[Math.floor(Math.random() * others.length)];
    lookSwatch = { fill: FILLS[fill], stroke: STROKES[stroke] };
  }

  function toggleZoom(plot: NonNullable<typeof zoomed>): void {
    zoomed = zoomed === plot ? null : plot;
  }

  /** The mini-game: every tap levies one agent by the click-tax dial. */
  function tapAgent(index: number): void {
    const collected = world.levyAgent(index, clickRate);
    if (collected <= 0) return;
    room?.pulse(index);
    revision++;
    measure();
  }

  function breakNews(): void {
    if (running) toggle();
    const w = world.wealth;
    let best = 0;
    for (let i = 1; i < w.length; i++) if (w[i] > w[best]) best = i;
    newsWinner = best;
    newsRun++;
    newsOpen = true;
  }

  function closeNews(): void {
    newsOpen = false;
    newsWinner = -1;
  }

  // same layout math as RoomCanvas — the flash must land on the winner
  const newsPos = $derived.by(() => {
    if (newsWinner < 0 || roomW === 0 || roomH === 0) return { x: 0, y: 0, r: 10 };
    const p = roomPositions(n, roomW, roomH)[newsWinner];
    const r = radiusScale(n, roomW, roomH) * Math.sqrt(Math.max(0, world.wealth[newsWinner]));
    return { x: p.x, y: p.y, r: Math.max(6, r) };
  });

  // classic look: the winner's only visible trait is WHERE they stood
  const newsZone = $derived(
    look === 'classic' && newsWinner >= 0 ? zoneName(newsPos.x, newsPos.y, roomW, roomH) : null,
  );

  measure();

  const trades = $derived.by(() => {
    void revision;
    return world.trades;
  });

  const totalDollars = $derived.by(() => {
    void revision;
    return world.totalDollars;
  });

  onMount(() => {
    // gentle snap: CSS proximity snap trapped fast scrolls (owner review
    // 2026-07-13) — instead, once scrolling STOPS with the sandbox nearly
    // aligned, ease it into place. Never acts mid-scroll, never blocks passing.
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const maybeSnap = () => {
      if (!rootEl || newsOpen) return;
      const top = rootEl.getBoundingClientRect().top;
      const vh = window.innerHeight;
      if (Math.abs(top) > 2 && Math.abs(top) < vh * 0.25) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        rootEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    };
    const onScroll = () => {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(maybeSnap, 160);
    };
    const useScrollEnd = 'onscrollend' in window;
    if (layout === 'full') {
      if (useScrollEnd) window.addEventListener('scrollend', maybeSnap);
      else window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      ticker.stop();
      clearTimeout(snapTimer);
      if (layout === 'full') {
        if (useScrollEnd) window.removeEventListener('scrollend', maybeSnap);
        else window.removeEventListener('scroll', onScroll);
      }
    };
  });
</script>

{#snippet plotBox(id: NonNullable<typeof zoomed>)}
  <!-- grid-area must drop when zoomed: an absolutely-positioned grid child
       with a placement resolves inset against its own AREA, not the widget -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class={`plot plot-${id}`}
    class:zoomed={zoomed === id}
    style={zoomed === id ? undefined : `grid-area: ${id}`}
    role="button"
    tabindex="0"
    title="double-click: enlarge"
    ondblclick={() => toggleZoom(id)}
    onkeydown={(e) => e.key === 'Enter' && e.target === e.currentTarget && toggleZoom(id)}
  >
    {#if zoomed === id}
      <button class="unzoom" type="button" aria-label="Shrink the plot back" onclick={() => toggleZoom(id)}>✕</button>
    {/if}
    {#if id === 'hist'}
      <Histogram wealth={world.wealth} {totalDollars} {n} {revision} {startDollars} />
    {:else if id === 'lorenz'}
      <svg viewBox="0 0 170 170" class="lorenz" role="img" aria-label={`Lorenz curve, Gini ${gini.toFixed(2)}`}>
        <path class="gap" d={lorenzGapPath(lorenzPoints, LORENZ)} />
        <line class="equal" x1={LORENZ.x} y1={LORENZ.y} x2={LORENZ.x + LORENZ.size} y2={LORENZ.y - LORENZ.size} />
        <path class="curve" d={lorenzLinePath(lorenzPoints, LORENZ)} />
        <line class="axis" x1={LORENZ.x} y1={LORENZ.y} x2={LORENZ.x + LORENZ.size} y2={LORENZ.y} />
        <line class="axis" x1={LORENZ.x} y1={LORENZ.y} x2={LORENZ.x} y2={LORENZ.y - LORENZ.size} />
        <!-- top-left of the plot is always empty (the curve lives below the
             diagonal) — the number never collides with the curve there -->
        <text class="readout" x={LORENZ.x + 6} y={LORENZ.y - LORENZ.size + 12} text-anchor="start">Gini {gini.toFixed(2)}</text>
        <text class="tick" x={LORENZ.x} y={LORENZ.y + 10} text-anchor="start">0%</text>
        <text class="tick" x={LORENZ.x + LORENZ.size} y={LORENZ.y + 10} text-anchor="end">100%</text>
        <text class="tick" x={LORENZ.x - 3} y={LORENZ.y - LORENZ.size + 6} text-anchor="end">100%</text>
        <text class="tick" x={LORENZ.x - 3} y={LORENZ.y} text-anchor="end">0%</text>
        <text class="axis-label" x={LORENZ.x + LORENZ.size / 2} y={LORENZ.y + 22} text-anchor="middle">share of people</text>
        <text class="axis-label rotated" x={LORENZ.x - 22} y={LORENZ.y - LORENZ.size / 2} text-anchor="middle">share of wealth</text>
      </svg>
    {:else if id === 'ccdf'}
      <CcdfChart wealth={world.wealth} {totalDollars} {revision} {startDollars} />
    {:else if id === 'time'}
      <TimeSeries {world} {revision} />
    {:else}
      <PhasePanel {stake} {taxRate} />
    {/if}
  </div>
{/snippet}

<div
  bind:this={rootEl}
  class="widget sandbox"
  class:full={layout === 'full'}
  aria-label="The full sandbox: every dial of the toy economy in one room"
>
  <div class="head">
    <p class="kicker">The whole machine, yours</p>
    {#if show.stats}
      <div class="stats">
        <output>{countTrades(trades)} trades</output>
        <output>holds {dollarsCompact(totalDollars)}</output>
        <output>biggest {percent(topShare)}</output>
      </div>
    {/if}
  </div>

  <div class="room-flex" bind:clientWidth={roomW} bind:clientHeight={roomH}>
    {#if roomW > 0 && roomH > 0}
      <RoomCanvas
        bind:this={room}
        wealth={world.wealth}
        {revision}
        styles={displayStyles}
        height={roomH}
        winner={newsOpen ? newsWinner : null}
        onTap={ctl.clickTax && clickRate > 0 && !newsOpen ? tapAgent : null}
        label={`A sandbox room of ${n} agents trading under your rules — tap anyone to levy them`}
      />
    {/if}
    {#if newsOpen && newsWinner >= 0}
      <NewsFlash
        style={displayStyles ? displayStyles[newsWinner] : styles[newsWinner]}
        pos={newsPos}
        run={newsRun}
        zone={newsZone}
        onClose={closeNews}
      />
    {/if}
  </div>

  {#if show.histogram}{@render plotBox('hist')}{/if}
  {#if show.lorenz}{@render plotBox('lorenz')}{/if}
  {#if show.ccdf}{@render plotBox('ccdf')}{/if}
  {#if show.time}{@render plotBox('time')}{/if}
  {#if show.phase}{@render plotBox('phase')}{/if}

  <div class="controls">
    <div class="sliders">
      {#if ctl.stake}
        <label class="dial">
          <span>stake <strong>{percent(stake)}</strong></span>
          <input type="range" min="0" max="1" step="0.01" bind:value={stake} />
        </label>
      {/if}
      {#if ctl.tax}
        <label class="dial">
          <span>tax <strong>{percent(taxRate)}</strong>/round</span>
          <input type="range" min="0" max="1" step="0.01" bind:value={taxRate} />
        </label>
      {/if}
      {#if ctl.clickTax}
        <label class="dial">
          <span>tax per click <strong>{percent(clickRate)}</strong></span>
          <input type="range" min="0" max="1" step="0.01" bind:value={clickRate} />
        </label>
      {/if}
      {#if ctl.progressivity}
        <!-- placeholder (owner review 2026-07-13): one dial, rate rising with
             log wealth, replaces the old bracket table. Dummy until wired. -->
        <label class="dial soon" title="Coming soon: the rate climbs with log wealth">
          <span>progressivity <strong>soon</strong></span>
          <input type="range" min="0" max="1" step="0.01" value={0} disabled />
        </label>
      {/if}
    </div>

    <div class="choices">
      {#if ctl.population}
        <fieldset>
          <legend>people</legend>
          <button type="button" onclick={() => scalePopulation(0.5)} disabled={n <= MIN_N} aria-label="Half the room">½</button>
          <output class="count" aria-live="polite">{n}</output>
          <button type="button" onclick={() => scalePopulation(2)} disabled={n >= MAX_N} aria-label="Double the room">×2</button>
        </fieldset>
      {/if}
      {#if ctl.speed}
        <fieldset>
          <legend>speed</legend>
          {#each [1, 4, 16] as s}
            <button type="button" class:primary={speed === s} aria-pressed={speed === s} onclick={() => (speed = s)}>{s}×</button>
          {/each}
        </fieldset>
      {/if}
      {#if ctl.look}
        <fieldset>
          <legend>look</legend>
          <button class="look" type="button" onclick={cycleLook} aria-label={`Look: ${look}. Switch.`}>
            <svg viewBox="-11 -11 22 22" aria-hidden="true">
              <path
                d={svgShapePath(look === 'shapes' ? 'square' : 'circle', 8)}
                fill={look === 'classic' ? CLASSIC_FILL : lookSwatch.fill}
                stroke={look === 'classic' ? CLASSIC_STROKE : lookSwatch.stroke}
                stroke-width="1.6"
              />
            </svg>
          </button>
        </fieldset>
      {/if}
      {#if ctl.startWealth}
        <fieldset>
          <legend>start $ each</legend>
          <input
            class="wealth-input"
            type="number"
            min="1"
            max="1000000"
            value={startDollars}
            aria-label="Starting dollars per person; changing it starts a new room"
            onchange={(e) => setStartDollars(Number(e.currentTarget.value))}
          />
        </fieldset>
      {/if}
    </div>

    <!-- the most-used buttons live at the bottom edge, easiest reach -->
    <div class="toolbar">
      <button class="primary steady" type="button" onclick={toggle}>{running ? 'Pause' : 'Run'}</button>
      <button type="button" onclick={reset} disabled={trades === 0}>New room</button>
      {#if ctl.news}
        <button type="button" onclick={breakNews} disabled={trades === 0 || newsOpen}>Break the news</button>
      {/if}
    </div>
  </div>
</div>

<style>
  /* ---- shared grid bones; `column` (the reusable preset form) is narrower ---- */
  .sandbox {
    position: relative;
    display: grid;
    gap: 0.6rem 1rem;
    max-inline-size: 60rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'head head'
      'room room'
      'phase phase'
      'hist lorenz'
      'ccdf time'
      'ctrl ctrl';
    grid-template-rows: auto minmax(16rem, 40vh);
  }

  /* ---- the finale: one full screen (owner review 2026-07-14) ----
     Landscape: a near-square 5-column grid. The room takes the top-left 3×2
     (rule of thirds); the phase composite takes the right 2×2; the bottom row
     is controls + four 1:1 plots. */
  .sandbox.full {
    inline-size: 100vw;
    max-inline-size: none;
    margin-block: 0;
    margin-inline: calc((100% - 100vw) / 2);
    block-size: 100dvh;
    min-block-size: 100dvh;
    padding-block: clamp(0.6rem, 1.6vh, 1.1rem);
    padding-inline: clamp(0.9rem, 2.5vw, 2.2rem);
    justify-content: stretch;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-template-areas:
      'head head head head head'
      'room room room phase phase'
      'room room room phase phase'
      'ctrl hist lorenz ccdf time';
    /* the bottom row sizes to its content (square plots, full controls) so
       the controls can never overflow up into the room */
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr) auto;
  }

  .sandbox.full .plot:not(.plot-phase) {
    aspect-ratio: 1;
    justify-self: center;
    inline-size: 100%;
  }

  .head {
    grid-area: head;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.3rem 1.2rem;
  }

  .head .kicker {
    margin-block: 0;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1.1rem;
    margin-inline-start: auto;
  }

  .stats output {
    font-family: var(--font-sans);
    font-variant-numeric: tabular-nums;
    font-size: 0.78rem;
    font-weight: 700;
    color: #3c352b;
  }

  .room-flex {
    grid-area: room;
    position: relative;
    min-block-size: 0;
    overflow: hidden;
  }

  /* ---- 1:1 plot boxes; double-click blows one up over the whole widget ---- */
  .plot {
    position: relative;
    display: grid;
    place-items: center;
    min-block-size: 0;
    min-inline-size: 0;
    cursor: zoom-in;
    user-select: none; /* double-click zooms; it must not select axis text */
  }

  .plot:focus-visible {
    outline: 3px solid rgb(139 63 43 / 35%);
    outline-offset: 2px;
  }

  .plot.zoomed {
    position: absolute;
    inset: 0;
    z-index: 4;
    background: var(--paper);
    cursor: zoom-out;
    padding: clamp(0.5rem, 3vmin, 2rem);
  }

  .plot > :global(svg),
  .plot > :global(div) {
    inline-size: 100%;
    block-size: 100%;
  }

  .plot.zoomed > :global(svg),
  .plot.zoomed > :global(div) {
    max-inline-size: min(94vmin, 100%);
    max-block-size: 100%;
  }

  .unzoom {
    position: absolute;
    inset-block-start: 0.5rem;
    inset-inline-end: 0.6rem;
    z-index: 1;
    min-inline-size: 2rem;
    min-block-size: 2rem;
    border: 1px solid #a99980;
    border-radius: 999px;
    background: var(--paper-bright);
    color: #3c352b;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .lorenz {
    display: block;
  }

  .lorenz .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
  }

  .lorenz .equal {
    stroke: var(--ink-mid);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .lorenz .gap {
    fill: var(--accent);
    fill-opacity: 0.12;
  }

  .lorenz .axis {
    stroke: #a99980;
    stroke-width: 1;
  }

  .lorenz .readout {
    fill: var(--accent-deep);
    font-size: 12px;
    font-weight: 700;
  }

  .lorenz .tick {
    fill: var(--ink-soft);
    font-size: 8px;
    font-variant-numeric: tabular-nums;
  }

  .lorenz .axis-label {
    fill: var(--ink-soft);
    font-size: 9px;
  }

  .lorenz .axis-label.rotated {
    transform-box: fill-box;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  /* ---- all controls in one tidy box ---- */
  .controls {
    grid-area: ctrl;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.45rem;
    min-block-size: 0;
    min-inline-size: 0;
  }

  .sliders {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.4rem 0.9rem;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  fieldset {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    border: none;
  }

  legend {
    padding: 0;
    margin-block-end: 0.25rem;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  fieldset button,
  .toolbar button {
    min-block-size: 1.9rem;
    padding-block: 0.2rem;
    padding-inline: 0.65rem;
    border: 1px solid #a99980;
    border-radius: 999px;
    background: var(--paper-bright);
    color: #3c352b;
    cursor: pointer;
    font-size: 0.74rem;
    font-weight: 650;
  }

  fieldset button:disabled,
  .toolbar button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  fieldset button.primary,
  .toolbar button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper-bright);
  }

  .count {
    min-inline-size: 2.6rem;
    text-align: center;
    font-family: var(--font-sans);
    font-variant-numeric: tabular-nums;
    font-size: 0.82rem;
    font-weight: 700;
    color: #3c352b;
  }

  /* the run button never resizes underfoot (owner review 2026-07-13) */
  button.steady {
    min-inline-size: 4.8rem;
  }

  button.look {
    display: grid;
    place-items: center;
    inline-size: 2.2rem;
    padding-inline: 0;
  }

  button.look svg {
    inline-size: 1.25rem;
    block-size: 1.25rem;
  }

  .wealth-input {
    inline-size: 5.2rem;
    min-block-size: 1.9rem;
    padding-block: 0.2rem;
    padding-inline: 0.5rem;
    border: 1px solid #a99980;
    border-radius: 0.5rem;
    background: var(--paper-bright);
    color: #3c352b;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
  }

  .dial {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-family: var(--font-sans);
    font-size: 0.68rem;
    color: var(--ink-mid);
    font-variant-numeric: tabular-nums;
  }

  .dial strong {
    font-weight: 700;
  }

  .dial input[type='range'] {
    inline-size: 100%;
    accent-color: var(--accent);
  }

  .dial.soon {
    opacity: 0.45;
  }

  /* ---- portrait: one column of near-square boxes, the room on top ---- */
  @media (orientation: portrait), (max-width: 44rem) {
    .sandbox,
    .sandbox.full {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        'head head'
        'room room'
        'phase phase'
        'hist lorenz'
        'ccdf time'
        'ctrl ctrl';
      grid-template-rows: auto minmax(30dvh, 36dvh) auto auto auto auto;
    }

    .sandbox.full {
      block-size: auto;
      min-block-size: 100dvh;
    }

    .plot {
      aspect-ratio: 1;
    }

    .plot-phase {
      justify-self: center;
      inline-size: min(100%, 62dvh);
    }

    .plot.zoomed {
      aspect-ratio: auto;
    }
  }
</style>
