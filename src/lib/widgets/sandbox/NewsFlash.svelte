<script lang="ts">
  import { onMount } from 'svelte';
  import { headlineForStyle, headlineForZone, styleNoun, type AgentStyle } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';
  import { gazettePage, ledgerPage, type RoomStats } from './newsroom';

  interface Props {
    /** The winner's display style — the photo and the headline wear it. */
    style: AgentStyle;
    /** Winner center + radius in room pixels (the flash fires here). */
    pos: { x: number; y: number; r: number };
    /** Cycles the headline variants across re-prints. */
    run: number;
    /**
     * Classic (uniform) look: the winner has no visible traits, so the paper
     * celebrates WHERE they stood instead (owner review 2026-07-14).
     */
    zone?: string | null;
    /** Measured room statistics — each paper spins them its own way. */
    stats: RoomStats;
    onClose: () => void;
  }

  let { style, pos, run, zone = null, stats, onClose }: Props = $props();

  // mirror of roomRenderer's legacy single-family look (keep in sync)
  const CLASSIC_FILL = 'rgb(189 98 69 / 26%)';
  const CLASSIC_STROKE = '#96543c';

  const winnerLine = $derived(zone ? headlineForZone(zone, run) : headlineForStyle(style, run));
  const ledger = $derived(ledgerPage(stats, winnerLine, run));
  const gazette = $derived(gazettePage(stats, run));

  // the poorest circle drawn to honest area scale against the richest
  const smallR = $derived(
    Math.max(1.4, 13 / Math.sqrt(Math.max(1, Math.min(stats.ratioTopBottom, 10_000)))),
  );

  // the news beat: flash the camera → the photo flies to the Ledger → the
  // headline sets → the Gazette lands with the other side of the story.
  let phase = $state<'flash' | 'fly' | 'headline' | 'second'>('flash');
  let flight = $state(''); // FLIP transform: from the winner to the photo slot
  let overlayEl: HTMLDivElement | undefined = $state();
  let photoEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      phase = 'second';
      return;
    }
    if (overlayEl && photoEl) {
      const o = overlayEl.getBoundingClientRect();
      const p = photoEl.getBoundingClientRect();
      const dx = pos.x - (p.left - o.left + p.width / 2);
      const dy = pos.y - (p.top - o.top + p.height / 2);
      const scale = Math.max(0.15, Math.min(1.5, (pos.r * 2) / p.width));
      flight = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(4deg)`;
    }
    const timers = [
      setTimeout(() => {
        phase = 'fly';
        // next frame: release the transform so the CSS transition flies it home
        requestAnimationFrame(() => requestAnimationFrame(() => (flight = '')));
      }, 480),
      setTimeout(() => (phase = 'headline'), 1250),
      setTimeout(() => (phase = 'second'), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  });
</script>

<div bind:this={overlayEl} class="overlay" role="dialog" aria-label={`Two front pages: ${ledger.text} — and — ${gazette.text}`}>
  <!-- the backdrop swallows the click so a "close" tap never levies an agent -->
  <button class="backdrop" type="button" aria-label="Close the news" onclick={onClose}></button>

  {#if phase === 'flash'}
    <div class="flash" style={`inset-inline-start: ${pos.x}px; inset-block-start: ${pos.y}px`} aria-hidden="true"></div>
  {/if}

  <div class="pages" class:hidden={phase === 'flash'}>
    <article class="page ledger" class:composed={phase === 'headline' || phase === 'second'}>
      <p class="masthead">{ledger.paper}</p>
      <div class="spread">
        <div
          bind:this={photoEl}
          class="polaroid"
          class:flying={phase === 'fly' || phase === 'flash'}
          style={flight ? `transform: ${flight}` : ''}
        >
          <svg viewBox="-14 -14 28 28" aria-label={`Photo of the winner: ${zone ? `the one at the ${zone}` : styleNoun(style)}`}>
            <path
              d={svgShapePath(zone ? 'circle' : style.shape, 10)}
              fill={zone ? CLASSIC_FILL : style.fill}
              stroke={zone ? CLASSIC_STROKE : style.stroke}
              stroke-width="1.6"
            />
          </svg>
          <span class="photo-caption">the winner, moments ago</span>
        </div>
        <div class="copy">
          <p class="headline-text">{ledger.text}</p>
          <p class="headline-source">{ledger.source}</p>
        </div>
      </div>
    </article>

    <article class="page gazette" class:composed={phase === 'second'}>
      <p class="masthead">{gazette.paper}</p>
      <div class="spread">
        <div class="stat-graphic" aria-hidden="true">
          <svg viewBox="0 0 44 34">
            <circle cx="16" cy="16" r="13" class="rich" />
            <circle cx="34" cy={29 - smallR} r={smallR} class="poor" />
          </svg>
          <span class="photo-caption">richest · poorest, to scale</span>
        </div>
        <div class="copy">
          <p class="headline-text">{gazette.text}</p>
          <p class="headline-source">{gazette.source}</p>
        </div>
      </div>
    </article>

    <button class="close" type="button" onclick={onClose}>keep trading</button>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    font-family: var(--font-sans);
  }

  .backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    background: rgb(40 37 31 / 14%);
    cursor: pointer;
  }

  .flash {
    position: absolute;
    inline-size: 14rem;
    block-size: 14rem;
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(255 252 240 / 95%) 0%, rgb(255 252 240 / 55%) 35%, transparent 70%);
    pointer-events: none;
    animation: pop 0.48s ease-out forwards;
  }

  @keyframes pop {
    0% {
      opacity: 0;
      scale: 0.3;
    }

    25% {
      opacity: 1;
      scale: 1;
    }

    100% {
      opacity: 0;
      scale: 1.15;
    }
  }

  /* two papers on the same desk: the Ledger lands top-left, the Gazette
     answers from the bottom-right (owner review 2026-07-14) */
  .pages {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .pages.hidden {
    opacity: 0;
  }

  .page {
    position: absolute;
    inline-size: min(24rem, 62%);
    padding-block: 0.7rem 0.7rem;
    padding-inline: 0.9rem;
    border: 1px solid #c9bca5;
    border-radius: 0.7rem;
    background: #fffdf8;
    box-shadow: 0 0.8rem 2rem rgb(65 50 29 / 18%);
    pointer-events: auto;
  }

  .page.ledger {
    inset-block-start: 4%;
    inset-inline-start: 3%;
    rotate: -0.7deg;
  }

  .page.gazette {
    inset-block-end: 4%;
    inset-inline-end: 3%;
    rotate: 0.8deg;
    opacity: 0;
    transform: translate(14px, 14px);
    transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.15);
  }

  .page.gazette.composed {
    opacity: 1;
    transform: none;
  }

  .masthead {
    margin-block: 0 0.45rem;
    padding-block-end: 0.3rem;
    border-block-end: 2px solid #28251f;
    font-size: 0.62rem;
    font-weight: 750;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #28251f;
  }

  .gazette .masthead {
    border-block-end-style: double;
    border-block-end-width: 3px;
  }

  .spread {
    display: flex;
    gap: 0.7rem;
    align-items: flex-start;
  }

  .polaroid {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    inline-size: 4.4rem;
    padding: 0.3rem 0.3rem 0.35rem;
    background: #fff;
    border: 1px solid #d8cdb6;
    box-shadow: 0 0.3rem 0.9rem rgb(65 50 29 / 22%);
    rotate: -2.5deg;
    transition: transform 0.65s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  .polaroid.flying {
    z-index: 1;
  }

  .polaroid svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
    background: var(--paper);
  }

  .stat-graphic {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    inline-size: 4.4rem;
    padding: 0.3rem;
    background: var(--paper);
    border: 1px solid #d8cdb6;
  }

  .stat-graphic svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }

  .stat-graphic .rich {
    fill: rgb(189 98 69 / 45%);
    stroke: #8b3f2b;
    stroke-width: 1;
  }

  .stat-graphic .poor {
    fill: rgb(110 85 62 / 45%);
    stroke: #4d493f;
    stroke-width: 0.8;
  }

  .photo-caption {
    font-size: 0.5rem;
    font-style: italic;
    text-align: center;
    color: #756c5d;
  }

  .copy {
    min-inline-size: 0;
  }

  .ledger .copy {
    opacity: 0;
    transition: opacity 0.45s ease 0.1s;
  }

  .ledger.composed .copy {
    opacity: 1;
  }

  .headline-text {
    margin-block: 0;
    font-family: var(--font-serif);
    font-size: clamp(0.95rem, 2.2vw, 1.2rem);
    font-weight: 650;
    line-height: 1.18;
    color: #211e19;
  }

  .headline-source {
    margin-block: 0.35rem 0;
    font-size: 0.68rem;
    font-style: italic;
    line-height: 1.35;
    color: #6e6659;
  }

  .close {
    position: absolute;
    inset-block-start: 4%;
    inset-inline-end: 3%;
    pointer-events: auto;
    min-block-size: 1.9rem;
    padding-block: 0.2rem;
    padding-inline: 0.85rem;
    border: 1px solid #a99980;
    border-radius: 999px;
    background: var(--paper-bright);
    color: #3c352b;
    font-size: 0.74rem;
    font-weight: 650;
    cursor: pointer;
  }

  .close:hover {
    border-color: #7a3f2b;
    color: #7a3f2b;
  }

  @media (prefers-reduced-motion: reduce) {
    .flash {
      display: none;
    }
  }
</style>
