<script lang="ts">
  import { onMount } from 'svelte';
  import { headlineForStyle, headlineForZone, styleNoun, type AgentStyle } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';

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
    onClose: () => void;
  }

  let { style, pos, run, zone = null, onClose }: Props = $props();

  // mirror of roomRenderer's legacy single-family look (keep in sync)
  const CLASSIC_FILL = 'rgb(189 98 69 / 26%)';
  const CLASSIC_STROKE = '#96543c';

  const headline = $derived(zone ? headlineForZone(zone, run) : headlineForStyle(style, run));

  // the news beat: flash the camera → the photo flies to the front page →
  // the headline sets itself. Reduced motion jumps straight to the page.
  let phase = $state<'flash' | 'fly' | 'headline'>('flash');
  let flight = $state(''); // FLIP transform: from the winner to the photo slot
  let overlayEl: HTMLDivElement | undefined = $state();
  let photoEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      phase = 'headline';
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
    const toFly = setTimeout(() => {
      phase = 'fly';
      // next frame: release the transform so the CSS transition flies it home
      requestAnimationFrame(() => requestAnimationFrame(() => (flight = '')));
    }, 480);
    const toHeadline = setTimeout(() => (phase = 'headline'), 1250);
    return () => {
      clearTimeout(toFly);
      clearTimeout(toHeadline);
    };
  });
</script>

<div bind:this={overlayEl} class="overlay" role="dialog" aria-label={`Breaking news: ${headline.text}`}>
  <!-- the backdrop swallows the click so a "close" tap never levies an agent -->
  <button class="backdrop" type="button" aria-label="Close the news" onclick={onClose}></button>

  {#if phase === 'flash'}
    <div class="flash" style={`inset-inline-start: ${pos.x}px; inset-block-start: ${pos.y}px`} aria-hidden="true"></div>
  {/if}

  <div class="page" class:composed={phase === 'headline'} class:hidden={phase === 'flash'}>
    <p class="masthead">The Morning Ledger</p>
    <div class="spread">
      <div
        bind:this={photoEl}
        class="polaroid"
        class:flying={phase !== 'headline'}
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
        <p class="headline-text">{headline.text}</p>
        <p class="headline-source">{headline.source}</p>
      </div>
    </div>
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

  .page {
    position: absolute;
    inset-block-start: clamp(0.5rem, 4%, 1.5rem);
    inset-inline-start: 50%;
    transform: translateX(-50%);
    inline-size: min(30rem, 92%);
    padding-block: 0.9rem 0.8rem;
    padding-inline: 1.1rem;
    border: 1px solid #c9bca5;
    border-radius: 0.7rem;
    background: #fffdf8;
    box-shadow: 0 0.8rem 2rem rgb(65 50 29 / 18%);
    rotate: -0.6deg;
    transition: opacity 0.3s ease;
  }

  .page.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .masthead {
    margin-block: 0 0.5rem;
    padding-block-end: 0.35rem;
    border-block-end: 2px solid #28251f;
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #28251f;
  }

  .spread {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
  }

  .polaroid {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    inline-size: 5.2rem;
    padding: 0.35rem 0.35rem 0.45rem;
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

  .photo-caption {
    font-size: 0.52rem;
    font-style: italic;
    text-align: center;
    color: #756c5d;
  }

  .copy {
    opacity: 0;
    transition: opacity 0.45s ease 0.1s;
  }

  .composed .copy {
    opacity: 1;
  }

  .copy .headline-text {
    margin-block: 0;
    font-family: var(--font-serif);
    font-size: clamp(1.05rem, 2.6vw, 1.35rem);
    font-weight: 650;
    line-height: 1.2;
    color: #211e19;
  }

  .copy .headline-source {
    margin-block: 0.45rem 0;
    font-size: 0.74rem;
    font-style: italic;
    line-height: 1.4;
    color: #6e6659;
  }

  .close {
    display: block;
    margin-block-start: 0.7rem;
    margin-inline-start: auto;
    min-block-size: 1.9rem;
    padding-block: 0.2rem;
    padding-inline: 0.8rem;
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
