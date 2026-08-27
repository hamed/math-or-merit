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
    gtax: boolean;
    gstake: boolean;
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
  import PhaseMap from './PhaseMap.svelte';
  import GiniCurve from './GiniCurve.svelte';
  import LorenzPlot from './LorenzPlot.svelte';
  import NewsFlash from './NewsFlash.svelte';
  import StopSlider, { MONEY_STOPS, PEOPLE_STOPS, RATE_STOPS } from './StopSlider.svelte';
  import { collectStats, roomStatsSource } from './newsroom';
  import { addMeasurement, clearPhaseData, exportCsv, importCsv, loadPhaseData } from './phaseGrid.svelte';
  import { createTicker } from '../shared/ticker';
  import { FILLS, STROKES, randomStyles } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';
  import { roomPositions, radiusScale, zoneName } from '../shared/layout';
  import { countTrades, dollarsCompact, percent } from '../shared/format';
  import { SandboxWorld, measureToy } from './SandboxWorld';
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
    gtax: true,
    gstake: true,
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

  const MIN_N = 2;
  const MAX_N = 2048;
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
  /** Raw number inputs, unclamped — negative taxes welcome. */
  let expert = $state(false);
  /** What a room click does: levy the agent, or photograph them. */
  let game = $state<'tax' | 'press'>('tax');
  /** Whose press pass the reader carries. */
  let paper = $state<'ledger' | 'gazette'>('ledger');
  /** The watchdog tripped: wealth went non-finite. A badge of honor. */
  let broke = $state(false);
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

  let zoomed = $state<null | 'hist' | 'lorenz' | 'ccdf' | 'time' | 'phase' | 'gtax' | 'gstake'>(null);

  // hovering the phase map previews other cross-sections
  let probeStake = $state<number | null>(null);
  let probeTax = $state<number | null>(null);

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

  /** "0.1%", "25%", "99.9%" — as many digits as the stop needs. */
  const rateLabel = (v: number) => `${Number((v * 100).toPrecision(4))}%`;

  function pushDials(): void {
    world.beta = stake;
    world.taxRate = taxRate;
  }

  function measure(): void {
    const m = measureToy(world.wealth);
    gini = m.gini;
    topShare = m.topShare;
  }

  /**
   * The steady-state solidifier (owner review 2026-07-15): a run wanders,
   * then settles. We average Gini over 50-round windows; once two consecutive
   * windows agree within 0.015 the point is PAST its transient, and every
   * further window solidifies one measurement into the shared phase record.
   * Changing any dial (or the room) starts the watch over.
   */
  const WINDOW_ROUNDS = 50;
  const STABLE_EPS = 0.015;
  let mKey = '';
  let mAccG = 0;
  let mAccR = 0;
  let mLastRound = 0;
  let mMeans: number[] = [];

  function trackSteadyState(): void {
    if (broke || !Number.isFinite(gini)) return;
    const key = `${stake}|${taxRate}|${n}`;
    if (key !== mKey) {
      mKey = key;
      mAccG = 0;
      mAccR = 0;
      mMeans = [];
      mLastRound = world.rounds;
      return;
    }
    const dr = world.rounds - mLastRound;
    if (dr <= 0) return;
    mLastRound = world.rounds;
    mAccG += gini * dr;
    mAccR += dr;
    if (mAccR < WINDOW_ROUNDS) return;
    const mean = mAccG / mAccR;
    mAccG = 0;
    mAccR = 0;
    mMeans.push(mean);
    const k = mMeans.length;
    if (k >= 2 && Math.abs(mMeans[k - 1] - mMeans[k - 2]) < STABLE_EPS) {
      addMeasurement(stake, taxRate, n, mean);
    }
  }

  const ticker = createTicker(() => {
    pushDials();
    world.step(Math.max(1, Math.round((n / 3) * speed)));
    revision++;
    measure();
    // the watchdog: expert dials may blow the math up — freeze the wreck and
    // say so, instead of a silently dead room (owner review 2026-07-14)
    for (let i = 0; i < world.wealth.length; i++) {
      if (!Number.isFinite(world.wealth[i])) {
        broke = true;
        running = false;
        ticker.stop();
        return;
      }
    }
    trackSteadyState();
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

  function setPopulation(count: number): void {
    n = Math.min(MAX_N, Math.max(MIN_N, Math.round(count)));
    reset();
  }

  function setStartDollars(value: number): void {
    if (Number.isFinite(value) && value > 0) startDollars = value;
    reset();
  }

  function reset(): void {
    running = false;
    broke = false;
    mKey = '';
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

  /** Room clicks: the tax game levies; the press game takes a photo. */
  function tapAgent(index: number): void {
    if (game === 'press') {
      photograph(index);
      return;
    }
    const collected = world.levyAgent(index, clickRate);
    if (collected === 0) return;
    room?.pulse(index);
    revision++;
    measure();
  }

  function photograph(index: number): void {
    if (running) toggle();
    newsWinner = index;
    newsRun++;
    newsOpen = true;
  }

  function breakNews(): void {
    if (running) toggle();
    const w = world.wealth;
    let pick = 0;
    for (let i = 1; i < w.length; i++) {
      if (paper === 'ledger' ? w[i] > w[pick] : w[i] < w[pick]) pick = i;
    }
    newsWinner = pick;
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

  // where the photographed agent stands in the room
  const newsStanding = $derived.by(() => {
    if (newsWinner < 0) return { dollars: 0, percentile: 0 };
    const mine = world.wealth[newsWinner];
    let poorer = 0;
    for (let i = 0; i < world.wealth.length; i++) if (world.wealth[i] < mine) poorer++;
    return { dollars: world.dollarsOf(newsWinner), percentile: poorer / n };
  });

  measure();

  const trades = $derived.by(() => {
    void revision;
    return world.trades;
  });

  const roundCount = $derived.by(() => {
    void revision;
    return world.rounds;
  });

  const totalDollars = $derived.by(() => {
    void revision;
    return world.totalDollars;
  });

  let csvInput: HTMLInputElement | undefined = $state();

  function downloadCsv(): void {
    const blob = new Blob([exportCsv()], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'merit-or-math-phase-points.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function uploadCsv(e: Event): Promise<void> {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) importCsv(await file.text());
    if (csvInput) csvInput.value = '';
  }

  onMount(() => {
    loadPhaseData(); // a returning reader keeps their measured map

    /**
     * Gentle snap: once scrolling STOPS with the sandbox nearly aligned, ease
     * it into place.
     *
     * It must know an ARRIVING reader from a LEAVING one. The first version
     * did not, and it was a trap: any rest inside a quarter-viewport of the
     * top got pulled back to the top, so a 120px wheel step could never get
     * out and the ending was unreachable by ordinary scrolling (measured
     * 2026-08-27: the scroll position oscillated +4/-4px forever).
     *
     * So: snap only in the direction the reader is already travelling — down
     * onto a sandbox that is still below them, or up onto one still above —
     * and never twice in a row without leaving the zone in between.
     */
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    let lastY = window.scrollY;
    let direction = 0;
    let armed = true;
    const ZONE = 0.25;

    const maybeSnap = () => {
      if (!rootEl || newsOpen) return;
      const top = rootEl.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const zone = vh * ZONE;
      if (Math.abs(top) >= zone) {
        armed = true; // left the zone: the next arrival may snap again
        return;
      }
      if (!armed || Math.abs(top) <= 2) return;
      // approaching from above (top > 0) only counts while scrolling DOWN;
      // approaching from below (top < 0) only while scrolling UP
      if (!((direction > 0 && top > 0) || (direction < 0 && top < 0))) return;
      armed = false;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rootEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    const trackDirection = () => {
      const y = window.scrollY;
      if (y !== lastY) direction = y > lastY ? 1 : -1;
      lastY = y;
    };
    const onScroll = () => {
      trackDirection();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(maybeSnap, 160);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (newsOpen) closeNews();
      else if (zoomed) zoomed = null;
    };
    window.addEventListener('keydown', onKey);

    const useScrollEnd = 'onscrollend' in window;
    if (layout === 'full') {
      // direction has to be sampled DURING the scroll either way; scrollend
      // only says that it finished.
      window.addEventListener('scroll', trackDirection, { passive: true });
      if (useScrollEnd) window.addEventListener('scrollend', maybeSnap);
      else window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      ticker.stop();
      clearTimeout(snapTimer);
      if (layout === 'full') {
        window.removeEventListener('scroll', trackDirection);
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
      <LorenzPlot wealth={world.wealth} {gini} {revision} />
    {:else if id === 'ccdf'}
      <CcdfChart wealth={world.wealth} {totalDollars} {revision} {startDollars} />
    {:else if id === 'time'}
      <TimeSeries {world} {revision} />
    {:else if id === 'gtax'}
      <GiniCurve axis="tax" {stake} {taxRate} {n} {probeStake} {probeTax} />
    {:else if id === 'gstake'}
      <GiniCurve axis="stake" {stake} {taxRate} {n} {probeStake} {probeTax} />
    {:else}
      <PhaseMap
        {stake}
        {taxRate}
        {n}
        liveGini={gini}
        onProbe={(ps, pt) => {
          probeStake = ps;
          probeTax = pt;
        }}
      />
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
        <output>{countTrades(roundCount)} rounds</output>
        <output>holds {dollarsCompact(totalDollars)}</output>
        <output>biggest {Number.isFinite(topShare) ? percent(topShare) : '—'}</output>
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
    {#if broke}
      <div class="broke" role="alert">
        <p class="broke-head">THE ECONOMY BROKE</p>
        <p class="broke-sub">Wealth stopped being a number. Whatever you dialed in, physics has filed a complaint.</p>
        <button class="primary" type="button" onclick={reset}>Start a new room</button>
      </div>
    {/if}
    {#if newsOpen && newsWinner >= 0}
      <NewsFlash
        {paper}
        style={displayStyles ? displayStyles[newsWinner] : styles[newsWinner]}
        pos={newsPos}
        run={newsRun}
        zone={newsZone}
        dollars={newsStanding.dollars}
        percentile={newsStanding.percentile}
        stats={collectStats(roomStatsSource(world), gini, topShare)}
        onClose={closeNews}
      />
    {/if}
  </div>

  {#if show.histogram}{@render plotBox('hist')}{/if}
  {#if show.lorenz}{@render plotBox('lorenz')}{/if}
  {#if show.ccdf}{@render plotBox('ccdf')}{/if}
  {#if show.time}{@render plotBox('time')}{/if}
  {#if show.gtax}{@render plotBox('gtax')}{/if}
  {#if show.gstake}{@render plotBox('gstake')}{/if}
  {#if show.phase}{@render plotBox('phase')}{/if}

  <!-- dials in order of importance (owner review 2026-07-15) -->
  <div class="controls">
    <div class="sliders" class:expert>
      {#if ctl.stake}
        <StopSlider label="stake" bind:value={stake} stops={RATE_STOPS} format={rateLabel} {expert} />
      {/if}
      {#if ctl.tax}
        <StopSlider label="tax /round" bind:value={taxRate} stops={RATE_STOPS} format={rateLabel} {expert} />
      {/if}
      {#if ctl.population}
        <StopSlider label="people" value={n} stops={PEOPLE_STOPS} format={(v) => String(Math.round(v))} {expert} onChange={setPopulation} />
      {/if}
      {#if ctl.startWealth}
        <StopSlider
          label="start $ each"
          bind:value={startDollars}
          stops={MONEY_STOPS}
          format={dollarsCompact}
          {expert}
          onChange={setStartDollars}
        />
      {/if}
      {#if ctl.clickTax}
        <StopSlider label="tax per click" bind:value={clickRate} stops={RATE_STOPS} format={rateLabel} {expert} />
      {/if}
      {#if ctl.progressivity}
        <!-- placeholder (owner review 2026-07-13): one dial, rate rising with
             log wealth, replaces the old bracket table. Dummy until wired. -->
        <StopSlider label="progressivity" value={0} stops={RATE_STOPS} format={() => 'soon'} {expert} disabled />
      {/if}
    </div>
  </div>

  <!-- everything that is NOT a control: actions, game modes, cosmetics -->
  <div class="keypad">
    <div class="btn-grid">
      {#if ctl.clickTax || ctl.news}
        <fieldset>
          <legend>on click</legend>
          {#each [['tax', 'tax'], ['press', '📸']] as [id, label]}
            <button
              type="button"
              class:primary={game === id}
              aria-pressed={game === id}
              title={id === 'tax' ? 'Clicking an agent levies them' : 'Clicking an agent photographs them for the front page'}
              onclick={() => (game = id as typeof game)}
            >{label}</button>
          {/each}
        </fieldset>
        <fieldset>
          <legend>press pass</legend>
          <button
            type="button"
            title={paper === 'ledger' ? 'The Morning Ledger: markets, winners, and other role models' : 'The People’s Gazette: actual people, actual arithmetic'}
            onclick={() => (paper = paper === 'ledger' ? 'gazette' : 'ledger')}
          >{paper === 'ledger' ? 'Ledger 🎩' : 'Gazette 📣'}</button>
        </fieldset>
      {/if}
      {#if ctl.speed}
        <fieldset class="span2">
          <legend>speed</legend>
          {#each [1, 4, 16] as s}
            <button type="button" class:primary={speed === s} aria-pressed={speed === s} onclick={() => (speed = s)}>{s}×</button>
          {/each}
        </fieldset>
      {/if}
      <fieldset>
        <legend>look · inputs</legend>
        {#if ctl.look}
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
        {/if}
        <button
          type="button"
          class:primary={expert}
          aria-pressed={expert}
          title="Raw numbers accept anything — negative tax included"
          onclick={() => (expert = !expert)}
        >{expert ? 'dials' : '123'}</button>
      </fieldset>
      <fieldset>
        <legend>map data</legend>
        <button type="button" title="Download your measured phase points as CSV" onclick={downloadCsv}>⤓</button>
        <button type="button" title="Merge a CSV of measured phase points" onclick={() => csvInput?.click()}>⤒</button>
        <button
          type="button"
          title="Forget every measured point"
          onclick={() => window.confirm('Wipe every measured phase point?') && clearPhaseData()}
        >wipe</button>
        <input bind:this={csvInput} type="file" accept=".csv,text/csv" class="visually-hidden" onchange={uploadCsv} />
      </fieldset>
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
      'gtax phase'
      'lorenz gstake'
      'hist ccdf'
      'time ctrl'
      'kbd kbd';
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
    /* svh, not dvh: the smallest viewport is the one that is always visible, so
       the finale fits whether or not a mobile browser's toolbars are showing. */
    block-size: 100svh;
    min-block-size: 100svh;

    /* This one is exactly a screen tall, so it snaps to the TOP of the screen
       and cancels the scroll padding that every other snap point wants — with
       the padding left in, the sandbox rests a strip too low and loses its own
       bottom row of plots. */
    /* Scrolled to by `maybeSnap` below, not by CSS snap. The negative margin
       cancels the page's scroll padding: this one is exactly a screen tall, so
       with the padding left in it rests a strip low and loses its bottom row. */
    scroll-margin-block: calc(-1 * var(--snap-pad)) 0;
    padding-block: clamp(0.6rem, 1.6vh, 1.1rem);
    padding-inline: clamp(0.9rem, 2.5vw, 2.2rem);
    justify-content: stretch;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-template-areas:
      'head head head head head'
      'room room room gtax phase'
      'room room room lorenz gstake'
      'ctrl kbd hist ccdf time';
    /* the bottom row sizes to its content (square plots, full controls) so
       the controls can never overflow up into the room */
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr) auto;
  }

  .sandbox.full .plot {
    justify-self: center;
    inline-size: 100%;
  }

  /* bottom-row plots size themselves square; the controls row follows suit */
  .sandbox.full .plot-hist,
  .sandbox.full .plot-ccdf,
  .sandbox.full .plot-time {
    aspect-ratio: 1;
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

  .broke {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 1rem;
    text-align: center;
    background: rgb(40 37 31 / 20%);
    font-family: var(--font-sans);
  }

  .broke-head {
    margin: 0;
    font-size: clamp(1.2rem, 3vw, 1.8rem);
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--accent-deep);
    text-shadow: 0 1px 0 var(--paper-bright);
  }

  .broke-sub {
    margin: 0;
    max-inline-size: 26rem;
    font-size: 0.85rem;
    color: #2e2a23;
  }

  .broke button {
    margin-block-start: 0.4rem;
    min-block-size: 2.2rem;
    padding-inline: 1rem;
    border: 1px solid var(--accent);
    border-radius: 999px;
    background: var(--accent);
    color: var(--paper-bright);
    font-weight: 650;
    cursor: pointer;
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
    aspect-ratio: auto; /* a zoomed square plot must fill, and center, the widget */
    justify-self: stretch;
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
    gap: 0.3rem;
  }

  /* expert: raw inputs pack a two-column grid, no wider than the dials */
  .sliders.expert {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.3rem 0.5rem;
  }

  .keypad {
    grid-area: kbd;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.4rem;
    min-block-size: 0;
    min-inline-size: 0;
  }

  .btn-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem 0.9rem;
    align-items: end;
  }

  .btn-grid .span2 {
    grid-column: span 2;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
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



  /* ---- portrait: one column of near-square boxes, the room on top ---- */
  @media (orientation: portrait), (max-width: 44rem) {
    .sandbox,
    .sandbox.full {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        'head head'
        'room room'
        'gtax phase'
        'lorenz gstake'
        'hist ccdf'
        'time ctrl'
        'kbd kbd';
      grid-template-rows: auto minmax(30dvh, 36dvh) auto auto auto auto auto;
    }

    .sandbox.full {
      block-size: auto;
      min-block-size: 100dvh;
    }

    .plot {
      aspect-ratio: 1;
    }

    .plot.zoomed {
      aspect-ratio: auto;
    }
  }
</style>
