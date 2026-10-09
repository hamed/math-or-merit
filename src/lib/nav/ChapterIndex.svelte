<script lang="ts">
  import { onMount } from 'svelte';
  import { chapters, loadFurthest, saveFurthest } from './chapters.svelte';
  import { STAGE_STATE_ATTRIBUTE } from '$lib/deferredEvents';
  import { STORY } from '$lib/content/story.gen';
  import { goToIndex, openBranch, type BranchId } from '$lib/widgets/stage/branch';

  /**
   * Where you are, and how to get anywhere (owner review 2026-09-27).
   *
   * A line of type in the corner naming the part of the story you are in: the
   * script's \section. Rest the pointer on it (or press it) and the parts open,
   * one entry each — never their scenes (owner, 2026-10-09: "the sections are
   * too fine … subsections do not show there") — then the side trips, and
   * "From the very beginning", which forgets the visit and starts at time 0.
   * Picking a part goes to its first scene at once, past any hold on the way:
   * the index is the way to a place, and the owner's way to test one.
   */

  /** The line across the viewport that decides which chapter you are "in" outside the stage. */
  const READ_LINE = 0.35;
  const STAGE = 'pair';

  let open = $state(false);
  let currentId = $state('');
  let furthestId = $state<string | null>(null);
  let shown = $state(false);
  /** The stage's step on screen, while the reader is in the stage. */
  let stageStep = $state<number | null>(null);
  let panel: HTMLElement | undefined = $state();
  let closing: number | undefined;

  const list = $derived(chapters());
  const current = $derived(list.find((c) => c.id === currentId) ?? null);
  const furthest = $derived(list.find((c) => c.id === furthestId) ?? null);
  const canResume = $derived(
    furthest !== null && current !== null && list.indexOf(furthest) > list.indexOf(current) + 1,
  );

  type Scene = (typeof STORY.scenes)[number];
  /** The script's parts (its \sections), each with its scenes, in order. */
  const parts = $derived.by(() => {
    const out: { act: string; scenes: Scene[] }[] = [];
    for (const sc of STORY.scenes) {
      const last = out[out.length - 1];
      if (last && last.act === sc.act) last.scenes.push(sc);
      else out.push({ act: sc.act, scenes: [sc] });
    }
    return out;
  });
  const story = $derived(parts.filter((p) => !p.scenes[0].sideTrip));
  const trips = $derived(parts.filter((p) => p.scenes[0].sideTrip));

  /** The scene the stage is on, by the script, and the part it belongs to. */
  const scene = $derived.by(() => {
    if (stageStep === null) return null;
    const label = STORY.steps[stageStep]?.scene;
    return STORY.scenes.find((sc) => sc.label === label) ?? null;
  });
  const part = $derived(scene ? (parts.find((p) => p.scenes.includes(scene)) ?? null) : null);

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
    const stageEl = document.querySelector<HTMLElement>('.step-stage');
    const state = document.documentElement.getAttribute(STAGE_STATE_ATTRIBUTE);
    stageStep = stageEl && state ? Number(stageEl.dataset.step ?? 0) : null;
    // the opening owns the first screen alone while it plays; after that the
    // index is always there — it is the way out, and the way to any scene
    shown = state === 'reading' || (state !== 'playing' && window.scrollY > window.innerHeight * 0.6) || open;
  }

  function goChapter(id: string): void {
    const target = list.find((c) => c.id === id);
    if (!target) return;
    open = false;
    history.replaceState(null, '', `#${id}`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function goScene(sc: Scene): void {
    open = false;
    if (sc.sideTrip) openBranch(sc.label as BranchId);
    else if (sc.step) goToIndex(STAGE, STORY.steps.findIndex((s) => s.id === sc.step));
  }

  /** Time 0: forget the visit — the stage's place, its holds, the reader's answers — and start again. */
  function fromTheStart(): void {
    try {
      for (const store of [sessionStorage, localStorage]) {
        for (const key of Object.keys(store)) if (key.startsWith('merit-or-math')) store.removeItem(key);
      }
    } catch {
      // no storage: a reload still starts the stage from the top
    }
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
    location.reload();
  }

  const hover = (on: boolean) => {
    if (closing !== undefined) window.clearTimeout(closing);
    closing = undefined;
    if (on) open = true;
    else closing = window.setTimeout(() => (open = false), 250);
  };

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
    // the stage changes state, and step, without the page scrolling
    const watch = new MutationObserver(onScroll);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: [STAGE_STATE_ATTRIBUTE] });
    const stageEl = document.querySelector('.step-stage');
    if (stageEl) watch.observe(stageEl, { attributes: true, attributeFilter: ['data-step'] });
    measure();

    // A shared link lands on its chapter: the anchor exists before we do, but
    // the pinned scenes resize the document as they measure, so land again.
    const fragment = location.hash.slice(1);
    if (fragment) setTimeout(() => goChapter(fragment), 400);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      watch.disconnect();
    };
  });
</script>

<nav
  bind:this={panel}
  class="index"
  class:shown
  class:open
  aria-label="Scenes"
  onpointerenter={(e) => e.pointerType === 'mouse' && hover(true)}
  onpointerleave={(e) => e.pointerType === 'mouse' && hover(false)}
>
  <button class="here" type="button" aria-expanded={open} aria-controls="scene-list" onclick={() => (open = !open)}>
    <span class="eyebrow">{open ? 'Jump to' : 'You are in'}</span>
    <span class="name">{part ? part.act : current ? current.label : (STORY.scenes[0]?.act ?? '')}</span>
  </button>

  <ul id="scene-list" class="list" hidden={!open}>
    <li class="start">
      <button type="button" onclick={fromTheStart}>⟲ From the very beginning</button>
    </li>
    {#each story as p, k (p.act + p.scenes[0].label)}
      <li>
        <button
          type="button"
          class="part"
          class:current={p === part}
          aria-current={p === part ? 'true' : undefined}
          onclick={() => goScene(p.scenes[0])}
        >
          <span class="number">{k + 1}</span>{p.act}
        </button>
      </li>
    {/each}
    {#if trips.length}
      <li class="heading">Side trips</li>
      {#each trips as p (p.act + p.scenes[0].label)}
        <li>
          <button
            type="button"
            class="part"
            class:current={p === part}
            aria-current={p === part ? 'true' : undefined}
            onclick={() => goScene(p.scenes[0])}
          >
            <span class="number">{p.scenes[0].number}</span>{p.act}
          </button>
        </li>
      {/each}
    {/if}
    {#if canResume && furthest}
      <li class="resume">
        <button type="button" onclick={() => goChapter(furthest.id)}>
          ↩ back to where you stopped — {furthest.label}
        </button>
      </li>
    {/if}
  </ul>
</nav>

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
  }

  /* shown once the opening has played; before that, only under the pointer —
     the opening keeps its first screen, and the way to any scene is still there */
  .index.shown,
  .index:hover,
  .index:focus-within,
  .index.open {
    opacity: 1;
    transform: none;
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
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .name {
    max-inline-size: 16rem;
    font-size: 0.92rem;
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
    min-inline-size: 17rem;
    max-block-size: min(78svh, 40rem);
    margin-block: 0.55rem 0;
    padding: 0.5rem;
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
    padding-block: 0.45rem;
    padding-inline: 0.75rem;
    border-radius: 0.45rem;
    background: none;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.98rem;
    line-height: 1.25;
    text-align: start;
    cursor: pointer;
  }

  .list button.part {
    display: flex;
    align-items: baseline;
    gap: 0.7rem;
  }

  .list button:hover,
  .list button:focus-visible {
    background: rgb(189 98 69 / 12%);
    color: var(--ink-strong);
  }

  .list button.current {
    background: rgb(189 98 69 / 9%);
    color: var(--accent-deep);
    font-weight: 700;
  }

  .heading {
    margin-block: 0.7rem 0.15rem;
    padding-block-start: 0.55rem;
    padding-inline: 0.75rem;
    border-block-start: 1px solid #e3dac6;
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .number {
    min-inline-size: 1.5em;
    color: var(--ink-soft);
    font-size: 0.82em;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  .start {
    margin-block-end: 0.2rem;
    padding-block-end: 0.3rem;
    border-block-end: 1px solid #e3dac6;
  }

  .start button {
    font-weight: 650;
  }

  .resume {
    margin-block-start: 0.3rem;
    padding-block-start: 0.3rem;
    border-block-start: 1px solid #e3dac6;
  }

  .resume button {
    font-size: 0.82rem;
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
      max-inline-size: 12rem;
      font-size: 0.82rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .list {
      min-inline-size: min(17rem, calc(100vw - 1.5rem));
      max-block-size: 70svh;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .index {
      transition: none;
    }
  }
</style>
