<script lang="ts">
  import { onMount } from 'svelte';
  import {
    CLASSIC_AGENT_FILL,
    CLASSIC_AGENT_STROKE,
    headlineForStyle,
    headlineForZone,
    styleNoun,
    type AgentStyle,
  } from '../shared/agentStyle';
  import { svgShapePath } from '../shared/shapePath';
  import { frontPageFor, type RoomStats } from './newsroom';

  interface Props {
    /** Which paper the reader's press pass belongs to. */
    paper: 'ledger' | 'gazette';
    /** The photographed agent's display style. */
    style: AgentStyle;
    /** Classic look: the subject's only visible trait is WHERE they stood. */
    zone?: string | null;
    /** The subject's holdings and standing — the papers spin from these. */
    dollars: number;
    percentile: number;
    /** Subject center + radius in room pixels (the flash fires here). */
    pos: { x: number; y: number; r: number };
    /** Cycles headline variants across re-prints. */
    run: number;
    /** Measured room statistics. */
    stats: RoomStats;
    onClose: () => void;
    /** Guided stories can keep arrow-key page navigation on the dialog itself. */
    focusClose?: boolean;
  }

  let { paper, style, zone = null, dollars, percentile, pos, run, stats, onClose, focusClose = true }: Props = $props();

  const winnerLine = $derived(zone ? headlineForZone(zone, run) : headlineForStyle(style, run));
  const noun = $derived(zone ? `the one at the ${zone}` : styleNoun(style));
  const page = $derived(frontPageFor(paper, { noun, dollars, percentile }, stats, winnerLine, run));

  // the news beat: flash the camera → the photo flies onto the page → the
  // headline sets. One paper at a time.
  let phase = $state<'flash' | 'fly' | 'headline'>('flash');
  let flight = $state(''); // FLIP transform: from the subject to the photo slot
  let overlayEl: HTMLDivElement | undefined = $state();
  let photoEl: HTMLDivElement | undefined = $state();
  let closeEl: HTMLButtonElement | undefined = $state();

  function handleDialogKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      closeEl?.focus();
    }
  }

  onMount(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // The dialog mounts during the canvas pointerdown. Focus after that pointer
    // gesture finishes so its eventual pointerup cannot steal focus back.
    const focusFrame = requestAnimationFrame(() => (focusClose ? closeEl : overlayEl)?.focus());
    let firstFrame: number | undefined;
    let secondFrame: number | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      phase = 'headline';
    } else if (overlayEl && photoEl) {
      const o = overlayEl.getBoundingClientRect();
      const p = photoEl.getBoundingClientRect();
      const dx = pos.x - (p.left - o.left + p.width / 2);
      const dy = pos.y - (p.top - o.top + p.height / 2);
      const scale = Math.max(0.15, Math.min(1.5, (pos.r * 2) / p.width));
      flight = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(4deg)`;
      timers.push(setTimeout(() => {
        phase = 'fly';
        // next frame: release the transform so the CSS transition flies it home
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => (flight = ''));
        });
      }, 480));
      timers.push(setTimeout(() => (phase = 'headline'), 1250));
    }

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(focusFrame);
      if (firstFrame !== undefined) cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  });
</script>

<div
  bind:this={overlayEl}
  class="overlay"
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-label={`${page.paper}: ${page.text}`}
  onkeydown={handleDialogKey}
>
  <!-- the backdrop swallows the click so a "close" tap never levies an agent -->
  <button class="backdrop" type="button" tabindex="-1" aria-label="Close the news" onclick={onClose}></button>

  {#if phase === 'flash'}
    <div class="flash" style={`inset-inline-start: ${pos.x}px; inset-block-start: ${pos.y}px`} aria-hidden="true"></div>
  {/if}

  <article
    class={`page ${paper}`}
    class:composed={phase === 'headline'}
    class:hidden={phase === 'flash'}
  >
    <p class="masthead">{page.paper}</p>
    <div class="spread">
      <div
        bind:this={photoEl}
        class="polaroid"
        class:flying={phase !== 'headline'}
        style={flight ? `transform: ${flight}` : ''}
      >
        <svg viewBox="-14 -14 28 28" aria-label={`Photo of ${noun}`}>
          <path
            d={svgShapePath(zone ? 'circle' : style.shape, 10)}
            fill={zone ? CLASSIC_AGENT_FILL : style.fill}
            stroke={zone ? CLASSIC_AGENT_STROKE : style.stroke}
            stroke-width="1.6"
          />
        </svg>
        <span class="photo-caption">{paper === 'ledger' ? 'moments ago' : 'one of us'}</span>
      </div>
      <div class="copy">
        <p class="headline-text">{page.text}</p>
        <p class="headline-source">{page.source}</p>
      </div>
    </div>
  </article>

  <button bind:this={closeEl} class="close" type="button" onclick={onClose}>keep trading</button>
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

  /* the Ledger lands top-left; the Gazette answers from the bottom-right */
  .page {
    position: absolute;
    inline-size: min(24rem, 62%);
    padding-block: 0.7rem 0.7rem;
    padding-inline: 0.9rem;
    border: 1px solid #c9bca5;
    border-radius: 0.7rem;
    background: #fffdf8;
    box-shadow: 0 0.8rem 2rem rgb(65 50 29 / 18%);
    transition: opacity 0.3s ease;
  }

  .page.hidden {
    opacity: 0;
    pointer-events: none;
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

  .photo-caption {
    font-size: 0.5rem;
    font-style: italic;
    text-align: center;
    color: #756c5d;
  }

  .copy {
    min-inline-size: 0;
    opacity: 0;
    transition: opacity 0.45s ease 0.1s;
  }

  .composed .copy {
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
    min-block-size: 2.75rem;
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
