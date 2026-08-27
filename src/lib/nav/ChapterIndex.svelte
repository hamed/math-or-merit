<script lang="ts">
  import { onMount } from 'svelte';
  import { chapters, loadFurthest, saveFurthest } from './chapters.svelte';

  /**
   * Where you are, and how to leave.
   *
   * A line of type in the corner naming the section you are in; press it and
   * the index opens. It is not a progress bar — the essay's two fables are 63%
   * of its scroll and 15% of its argument, so a filling bar would say "nearly
   * done" through the whole middle. A named place says something true.
   *
   * The reason it exists is the last entry: a reader who only wants the
   * sandbox should reach it in one press, from anywhere.
   */

  /** The line across the viewport that decides which chapter you are "in". */
  const READ_LINE = 0.35;

  let open = $state(false);
  let currentId = $state('');
  let furthestId = $state<string | null>(null);
  let shown = $state(false);
  let panel: HTMLElement | undefined = $state();

  const list = $derived(chapters());
  const current = $derived(list.find((c) => c.id === currentId) ?? null);
  const furthest = $derived(list.find((c) => c.id === furthestId) ?? null);
  /** Worth offering only when they actually left something behind. */
  const canResume = $derived(
    furthest !== null && current !== null && list.indexOf(furthest) > list.indexOf(current) + 1,
  );

  function measure(): void {
    const line = window.innerHeight * READ_LINE;
    let found = '';
    for (const c of list) {
      if (c.el.getBoundingClientRect().top <= line) found = c.id;
      else break;
    }
    if (found && found !== currentId) {
      currentId = found;
      const seen = list.findIndex((c) => c.id === found);
      const had = list.findIndex((c) => c.id === furthestId);
      if (seen > had) {
        furthestId = found;
        saveFurthest(found);
      }
    }
    // The opening owns the first screen alone: a timed teletype and a title
    // that spins. Nothing slides in over it.
    shown = window.scrollY > window.innerHeight * 0.6;
  }

  function go(id: string): void {
    const target = list.find((c) => c.id === id);
    if (!target) return;
    open = false;
    history.replaceState(null, '', `#${id}`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  onMount(() => {
    furthestId = loadFurthest();

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        measure();
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        open = false;
        e.stopPropagation();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (open && panel && !panel.contains(e.target as Node)) open = false;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    measure();

    // A shared link lands on its chapter: the anchor exists before we do, but
    // the pinned scenes resize the document as they measure, so land again.
    const fragment = location.hash.slice(1);
    if (fragment) setTimeout(() => go(fragment), 400);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  });
</script>

{#if list.length > 0}
  <nav bind:this={panel} class="index" class:shown class:open aria-label="Chapters">
    <button
      class="here"
      type="button"
      aria-expanded={open}
      aria-controls="chapter-list"
      onclick={() => (open = !open)}
    >
      <span class="eyebrow">{open ? 'Jump to' : 'You are at'}</span>
      <span class="name">{current ? current.label : list[0].label}</span>
    </button>

    <ul id="chapter-list" class="list" hidden={!open}>
      {#each list as chapter (chapter.id)}
        <li>
          <button
            type="button"
            class:current={chapter.id === currentId}
            aria-current={chapter.id === currentId ? 'true' : undefined}
            onclick={() => go(chapter.id)}
          >
            {chapter.label}
          </button>
        </li>
      {/each}
      {#if canResume && furthest}
        <li class="resume">
          <button type="button" onclick={() => go(furthest.id)}>
            ↩ back to where you stopped — {furthest.label}
          </button>
        </li>
      {/if}
    </ul>
  </nav>
{/if}

<style>
  /* Frameless while idle: a line of small type on the paper, no box, no rule.
     The panel is the one place a surface is allowed, because a list of
     sixteen chapters over a moving scene is unreadable without one. */
  .index {
    position: fixed;
    z-index: 40;
    inset-block-start: 0;
    inset-inline-end: 0;
    padding-block: 0.55rem;
    padding-inline: clamp(0.7rem, 2vw, 1.2rem);
    font-family: var(--font-sans);
    text-align: end;
    opacity: 0;
    transform: translateY(-0.35rem);
    transition: opacity 0.35s ease, transform 0.35s ease;
    pointer-events: none;
  }

  .index.shown {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .here {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.05rem;
    margin-inline-start: auto;
    border: none;
    padding: 0;
    background: none;
    cursor: pointer;
    text-align: end;
  }

  /* It floats over prose on a narrow screen, so the paper comes with it —
     a halo, not a box (the same trick the captions use over art). */
  .here .eyebrow,
  .here .name {
    text-shadow:
      0 0 0.35em var(--paper),
      0 0 0.7em var(--paper),
      0 0 1.1em var(--paper);
  }

  .eyebrow {
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .name {
    max-inline-size: 12rem;
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1.2;
    color: var(--ink-mid);
    border-block-end: 1px solid transparent;
  }

  .here:hover .name,
  .here:focus-visible .name {
    color: var(--accent-deep);
    border-block-end-color: currentColor;
  }

  .list {
    max-block-size: min(70svh, 30rem);
    margin-block: 0.5rem 0;
    padding: 0.35rem;
    overflow-y: auto;
    border: 1px solid #d8cdb9;
    border-radius: 0.55rem;
    background: var(--paper-bright);
    box-shadow: 0 0.7rem 1.8rem rgb(65 50 29 / 16%);
    list-style: none;
  }

  .list button {
    inline-size: 100%;
    border: none;
    padding-block: 0.3rem;
    padding-inline: 0.55rem;
    border-radius: 0.35rem;
    background: none;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.76rem;
    text-align: end;
    cursor: pointer;
  }

  .list button:hover,
  .list button:focus-visible {
    background: rgb(189 98 69 / 12%);
    color: var(--ink-strong);
  }

  .list button.current {
    color: var(--accent-deep);
    font-weight: 700;
  }

  .resume {
    margin-block-start: 0.3rem;
    padding-block-start: 0.3rem;
    border-block-start: 1px solid #e3dac6;
  }

  .resume button {
    font-size: 0.7rem;
    font-style: italic;
    color: var(--ink-soft);
  }

  /* On a phone the essay column runs edge to edge, so the label has no margin
     to live in and the halo was not enough — it sat on the words. It becomes a
     small pill with real paper under it: chrome, deliberately, and only where
     the page leaves it nowhere else to stand. */
  @media (max-width: 40rem) {
    .index {
      padding-block: 0.4rem;
    }

    .here {
      padding-block: 0.25rem;
      padding-inline: 0.7rem;
      border: 1px solid #e3dac6;
      border-radius: 999px;
      background: var(--paper-bright);
      box-shadow: 0 0.2rem 0.7rem rgb(65 50 29 / 10%);
    }

    /* the pill is the affordance; the label alone says where you are */
    .here .eyebrow {
      display: none;
    }

    .here .name {
      text-shadow: none;
      max-inline-size: 9rem;
      font-size: 0.72rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .list {
      max-block-size: 60svh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .index {
      transition: none;
    }
  }
</style>
