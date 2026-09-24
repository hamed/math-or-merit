<script lang="ts">
  /**
   * The news line, typed (Scene 1). `progress` runs 0 → 1 across the headline
   * and then its source; the untyped rest keeps its space, so nothing reflows
   * while it types. "On paper" and the dated source stay attached to the
   * headline — a keep-true line in prose.md.
   */
  interface Props {
    headline: string;
    source: string;
    href: string;
    progress: number;
    /** 0 once the stage has been cleared (Scene 8). */
    shown: number;
  }

  let { headline, source, href, progress, shown }: Props = $props();

  const total = $derived(headline.length + source.length);
  const typed = $derived(Math.round(Math.min(1, Math.max(0, progress)) * total));
  const inHead = $derived(Math.min(headline.length, typed));
  const inSource = $derived(Math.max(0, typed - headline.length));
</script>

<p class="teletype" style={`opacity:${shown}`} aria-label={`${headline} ${source}`}>
  <span class="line" aria-hidden="true"
    >{headline.slice(0, inHead)}{#if typed <= headline.length}<span class="cursor"></span>{/if}<span class="rest"
      >{headline.slice(inHead)}</span
    ></span
  >
  <a class="source" {href} target="_blank" rel="noopener noreferrer" tabindex={inSource > 0 ? 0 : -1}
    ><span aria-hidden="true"
      >{source.slice(0, inSource)}{#if typed > headline.length}<span class="cursor"></span>{/if}<span class="rest"
        >{source.slice(inSource)}</span
      ></span
    ></a
  >
</p>

<style>
  .teletype {
    margin: 0;
    inline-size: fit-content;
    max-inline-size: min(38rem, 88vw);
    font-family: var(--font-mono);
    font-size: clamp(0.68rem, 2.6vw, 1.2rem);
    line-height: 1.55;
    color: var(--ink);
  }

  .line {
    display: block;
  }

  .source {
    display: block;
    color: var(--ink-soft);
    text-align: end;
    text-decoration: none;
  }

  /* underline only what has been typed — the rest is invisible, and so is its line */
  .source > span {
    text-decoration: underline;
    text-decoration-color: var(--line);
  }

  .source .rest {
    text-decoration: none;
  }

  .rest {
    visibility: hidden;
  }

  .cursor {
    display: inline-block;
    inline-size: 0.55ch;
    block-size: 1.1em;
    margin-inline-start: 1px;
    vertical-align: text-bottom;
    background: var(--accent);
    animation: blink 1.05s steps(1) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cursor {
      animation: none;
    }
  }
</style>
