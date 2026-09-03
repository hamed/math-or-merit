<script lang="ts">
  import { percent } from '../shared/format';
  import { assignStyles, headlineForStyle, styleNoun } from '../shared/agentStyle';
  import { session } from '../shared/runLog.svelte';
  import { ROOM_N } from '../shared/presets';
  import { svgShapePath } from '../shared/shapePath';

  const styles = assignStyles(ROOM_N);
  const latest = $derived(session.runs.length === 0 ? null : session.runs[session.runs.length - 1]);
  const runNumber = $derived(Math.max(0, session.runs.length - 1));
  const style = $derived(latest === null ? null : (styles[latest.winner] ?? null));
  const headline = $derived(style === null ? null : headlineForStyle(style, runNumber));
</script>

<div class="story" data-winner-story aria-live="polite">
  {#if latest && style && headline}
    <article aria-label={`The Morning Ledger: ${headline.text}`}>
      <p class="masthead">The Morning Ledger</p>
      <div class="spread">
        <svg viewBox="-14 -14 28 28" role="img" aria-label={`Portrait of ${styleNoun(style)}`}>
          <path
            d={svgShapePath(style.shape, 10)}
            fill={style.fill}
            stroke={style.stroke}
            stroke-width="1.6"
          />
        </svg>
        <div>
          <blockquote>“{headline.text}”</blockquote>
          <p class="deck">{headline.source}</p>
        </div>
      </div>
    </article>
    <p class="receipt">
      The evidence underneath the story: <strong>{percent(latest.topShare)}</strong> of all wealth after
      {latest.trades.toLocaleString('en-US')} trades.
    </p>
  {:else}
    <p class="empty">No front page yet. Run the room first.</p>
  {/if}
</div>

<style>
  .story {
    margin-block: 1.5rem 2rem;
  }

  article {
    max-inline-size: 38rem;
    margin-inline: auto;
    padding-block: clamp(0.9rem, 3vw, 1.35rem);
    padding-inline: clamp(1rem, 4vw, 1.6rem);
    border: 1px solid #c9bca5;
    border-radius: 0.45rem;
    background: #fffdf8;
    box-shadow: 0 0.8rem 2rem rgb(65 50 29 / 12%);
    rotate: -0.35deg;
  }

  .masthead {
    margin: 0 0 0.8rem;
    padding-block-end: 0.45rem;
    border-block-end: 3px double #28251f;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .spread {
    display: grid;
    grid-template-columns: clamp(4.5rem, 18vw, 7rem) 1fr;
    gap: clamp(0.8rem, 3vw, 1.4rem);
    align-items: center;
  }

  svg {
    inline-size: 100%;
    padding: 0.45rem;
    border: 1px solid #d8cdb9;
    background: var(--paper);
  }

  blockquote {
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.15rem, 4vw, 1.75rem);
    font-weight: 750;
    line-height: 1.04;
    text-wrap: balance;
  }

  .deck {
    margin: 0.55rem 0 0;
    color: var(--ink-soft);
    font-size: clamp(0.72rem, 2.3vw, 0.9rem);
    line-height: 1.35;
  }

  .receipt,
  .empty {
    max-inline-size: 38rem;
    margin-block: 0.75rem 0;
    margin-inline: auto;
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.45;
    text-align: center;
  }

  @media (max-width: 30rem) {
    .spread {
      grid-template-columns: 4.25rem 1fr;
    }

    blockquote {
      font-size: 1.08rem;
    }
  }
</style>
