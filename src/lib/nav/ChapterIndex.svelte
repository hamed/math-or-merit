<script lang="ts">
  import { onMount } from 'svelte';
  import { chapters, loadFurthest, saveFurthest } from './chapters.svelte';
  import { STAGE_STATE_ATTRIBUTE } from '$lib/deferredEvents';
  import { STORY } from '$lib/content/story.gen';
  import { goToIndex, openBranch, type BranchId } from '$lib/widgets/stage/branch';
  import { say } from '$lib/i18n';
  import type { StoryIndexSection } from '$lib/script/compile';

  /** The chapter index is authored by the script: chapters contain index sections, which target scenes. */

  /** The line across the viewport that decides which chapter you are "in" outside the stage. */
  const READ_LINE = 0.35;
  const STAGE = 'pair';

  type OpenMenu = 'chapters' | 'sections' | null;
  let openMenu = $state<OpenMenu>(null);
  let currentId = $state('');
  let furthestId = $state<string | null>(null);
  let shown = $state(false);
  let introChapterId = $state<string | null>(null);
  let lastIntroChapterId: string | null = null;
  let introTimer: number | undefined;
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
  const index = $derived(STORY.index);
  const introChapter = $derived(index.find((chapter) => chapter.label === introChapterId) ?? null);
  const introNumber = $derived(introChapter ? index.indexOf(introChapter) + 1 : 0);

  function chapterForScene(label: string | null): (typeof index)[number] | undefined {
    if (!label) return undefined;
    return index.find((chapter) =>
      chapter.sections.some(
        (section) => section.scenes.includes(label) || section.sideTrips.some((trip) => trip.id === label),
      ),
    );
  }

  /** The scene the stage is on, used to locate its chapter and index section. */
  const scene = $derived.by(() => {
    if (stageStep === null) return null;
    const label = STORY.steps[stageStep]?.scene;
    return STORY.scenes.find((sc) => sc.label === label) ?? null;
  });
  const indexSection = $derived.by(() => {
    if (!scene) return null;
    return index
      .flatMap((chapter) => chapter.sections)
      .find(
        (section) =>
          section.scenes.includes(scene.label) || section.sideTrips.some((trip) => trip.id === scene.label),
      ) ?? null;
  });
  const indexChapter = $derived.by(() => {
    if (!indexSection) return null;
    return index.find((chapter) => chapter.sections.includes(indexSection)) ?? null;
  });
  const indexChapterNumber = $derived(indexChapter ? index.indexOf(indexChapter) + 1 : null);
  const indexChapterSections = $derived(indexChapter?.sections.filter((section) => section.scenes.length > 0) ?? []);
  const indexSectionPosition = $derived(indexSection ? indexChapterSections.indexOf(indexSection) : -1);
  const previousSection = $derived(
    indexSectionPosition > 0 ? indexChapterSections[indexSectionPosition - 1] : null,
  );
  const nextSection = $derived(
    indexSectionPosition >= 0 ? (indexChapterSections[indexSectionPosition + 1] ?? null) : null,
  );
  const previousChapter = $derived(
    indexChapterNumber === null
      ? null
      : (index.slice(0, indexChapterNumber - 1).reverse().find((chapter) =>
          chapter.sections.some((section) => section.scenes.length > 0),
        ) ?? null),
  );
  const nextChapter = $derived(
    indexChapterNumber === null
      ? null
      : (index.slice(indexChapterNumber).find((chapter) =>
          chapter.sections.some((section) => section.scenes.length > 0),
        ) ?? null),
  );
  const locationName = $derived.by(() => {
    if (indexChapter) return say(indexChapter.key);
    if (stageStep !== null) return '';
    if (current) return current.label;
    return index[0] ? say(index[0].key) : '';
  });

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
    const nextStep = stageEl && state ? Number(stageEl.dataset.step ?? 0) : null;
    stageStep = nextStep;
    const sceneLabel = nextStep === null ? null : (STORY.steps[nextStep]?.scene ?? null);
    const chapter = chapterForScene(sceneLabel);
    const firstScene = chapter?.sections.find((section) => section.scenes.length)?.scenes[0];
    if (chapter && sceneLabel === firstScene && lastIntroChapterId !== chapter.label) {
      lastIntroChapterId = chapter.label;
      introChapterId = chapter.label;
      if (introTimer !== undefined) window.clearTimeout(introTimer);
      introTimer = window.setTimeout(() => {
        introChapterId = null;
        introTimer = undefined;
      }, 6000);
    }
    followScene();
    // the opening owns the first screen alone while it plays; after that the
    // index is always there — it is the way out, and the way to any scene
    const inIndexedChapter = chapter !== undefined;
    const outsideStage = nextStep === null;
    shown =
      (state === 'reading' && (outsideStage || inIndexedChapter)) ||
      (state !== 'playing' && outsideStage && window.scrollY > window.innerHeight * 0.6) ||
      openMenu !== null;
  }

  function goChapter(id: string): void {
    const target = list.find((c) => c.id === id);
    if (!target) return;
    openMenu = null;
    history.replaceState(null, '', `#${id}`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function goScene(sc: Scene): void {
    openMenu = null;
    if (sc.sideTrip) openBranch(sc.label as BranchId);
    else if (sc.step) goToIndex(STAGE, STORY.steps.findIndex((s) => s.id === sc.step));
  }

  function goIndexSection(section: StoryIndexSection): void {
    const firstScene = STORY.scenes.find((sc) => sc.label === section.scenes[0]);
    if (firstScene) goScene(firstScene);
  }

  function goIndexChapter(chapter: (typeof index)[number] | null): void {
    const firstSection = chapter?.sections.find((section) => section.scenes.length > 0);
    if (firstSection) goIndexSection(firstSection);
  }

  function goIndexTrip(id: string): void {
    const sideTrip = STORY.scenes.find((sc) => sc.label === id && sc.sideTrip);
    if (sideTrip) goScene(sideTrip);
  }

  /** A scene of the stage a link can name: a chapter of the essay with the same name keeps its own. */
  const linkable = (label: string): Scene | null =>
    list.some((c) => c.id === label) ? null : (STORY.scenes.find((sc) => sc.label === label && !sc.sideTrip) ?? null);

  /** Go where a link points: a chapter, or a scene of the stage. */
  function goFragment(fragment: string): void {
    const sc = linkable(fragment);
    if (sc) goScene(sc);
    else goChapter(fragment);
  }

  /** Not before a link the page opened on has been followed: until then the address is the reader's. */
  let landed = false;

  /** The address bar names the scene on the stage, and lets go of it once the reader leaves the stage. */
  function followScene(): void {
    if (!landed) return;
    const label = stageStep === null ? null : (STORY.steps[stageStep]?.scene ?? null);
    const want = label && linkable(label) ? `#${label}` : '';
    if (want === location.hash) return;
    // a chapter's own address stays until the stage takes over again
    if (!want && !linkable(location.hash.slice(1))) return;
    history.replaceState(history.state, '', want || location.pathname + location.search);
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

  function showMenu(menu: Exclude<OpenMenu, null>): void {
    if (closing !== undefined) window.clearTimeout(closing);
    closing = undefined;
    openMenu = menu;
  }

  function deferMenuClose(): void {
    if (closing !== undefined) window.clearTimeout(closing);
    closing = window.setTimeout(() => {
      openMenu = null;
      closing = undefined;
    }, 180);
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
      if (e.key === 'Escape' && openMenu !== null) {
        openMenu = null;
        if (closing !== undefined) window.clearTimeout(closing);
        closing = undefined;
        e.stopPropagation();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (openMenu !== null && panel && !panel.contains(e.target as Node)) {
        openMenu = null;
        if (closing !== undefined) window.clearTimeout(closing);
        closing = undefined;
      }
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

    // A shared link lands on its chapter or its scene: the anchor exists before
    // we do, but the pinned scenes resize the document as they measure, so land again.
    const fragment = location.hash.slice(1);
    // a reader coming back (a reload, Back) is put back on their own step, not the scene's first
    const [visit] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const returning = visit?.type === 'reload' || visit?.type === 'back_forward';
    const landing = window.setTimeout(
      () => {
        if (fragment && !(returning && linkable(fragment))) goFragment(fragment);
        landed = true;
      },
      fragment ? 400 : 0,
    );
    // a link followed inside the page, or an address typed in
    const onHash = () => {
      const to = location.hash.slice(1);
      if (to) goFragment(to);
    };
    window.addEventListener('hashchange', onHash);

    return () => {
      window.clearTimeout(landing);
      if (introTimer !== undefined) window.clearTimeout(introTimer);
      if (closing !== undefined) window.clearTimeout(closing);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      watch.disconnect();
    };
  });
</script>

{#if introChapter}
  <div class="chapter-intro" role="status" aria-live="polite">
    <span class="chapter-intro-number">Chapter {introNumber}</span>
    <span class="chapter-intro-title">{say(introChapter.key)}</span>
  </div>
{/if}

<nav
  bind:this={panel}
  class="index"
  class:shown
  class:open={openMenu !== null}
  class:chapter-menu-open={openMenu === 'chapters'}
  class:section-menu-open={openMenu === 'sections'}
  aria-label="Chapter index"
  onpointerleave={(e) => e.pointerType === 'mouse' && deferMenuClose()}
  onfocusout={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && deferMenuClose()}
>
  <div
    class="nav-group chapter-control"
    onpointerenter={(e) => e.pointerType === 'mouse' && showMenu('chapters')}
    onfocusin={() => showMenu('chapters')}
  >
    <div class="nav-row" aria-label="Chapter navigation">
      <button
        class="nav-arrow chapter-arrow"
        type="button"
        aria-label={previousChapter ? `Previous chapter: ${say(previousChapter.key)}` : 'No previous chapter'}
        title={previousChapter ? `Previous chapter: ${say(previousChapter.key)}` : 'No previous chapter'}
        disabled={!previousChapter}
        onclick={() => goIndexChapter(previousChapter)}
      >
        ⏮
      </button>
      <button
        class="nav-label chapter-name"
        type="button"
        aria-expanded={openMenu === 'chapters'}
        aria-controls="nav-menu"
        onclick={() => showMenu('chapters')}
      >
        {locationName}
      </button>
      <button
        class="nav-arrow chapter-arrow"
        type="button"
        aria-label={nextChapter ? `Next chapter: ${say(nextChapter.key)}` : 'No next chapter'}
        title={nextChapter ? `Next chapter: ${say(nextChapter.key)}` : 'No next chapter'}
        disabled={!nextChapter}
        onclick={() => goIndexChapter(nextChapter)}
      >
        ⏭
      </button>
    </div>
  </div>

  <div
    class="nav-group section-control"
    onpointerenter={(e) => e.pointerType === 'mouse' && indexChapter && showMenu('sections')}
    onfocusin={() => indexChapter && showMenu('sections')}
  >
    <div class="nav-row" aria-label="Section navigation">
      <button
        class="nav-arrow section-arrow"
        type="button"
        aria-label={previousSection ? `Previous section: ${say(previousSection.key)}` : 'No previous section'}
        title={previousSection ? `Previous section: ${say(previousSection.key)}` : 'No previous section'}
        disabled={!previousSection}
        onclick={() => previousSection && goIndexSection(previousSection)}
      >
        ‹
      </button>
      <button
        class="nav-label section-name"
        type="button"
        aria-expanded={openMenu === 'sections'}
        aria-controls="nav-menu"
        disabled={!indexChapter}
        onclick={() => showMenu('sections')}
      >
        {indexSection ? say(indexSection.key) : ''}
      </button>
      <button
        class="nav-arrow section-arrow"
        type="button"
        aria-label={nextSection ? `Next section: ${say(nextSection.key)}` : 'No next section'}
        title={nextSection ? `Next section: ${say(nextSection.key)}` : 'No next section'}
        disabled={!nextSection}
        onclick={() => nextSection && goIndexSection(nextSection)}
      >
        ›
      </button>
    </div>
  </div>

  <div id="nav-menu" class="list menu" hidden={openMenu === null}>
    {#if openMenu === 'chapters'}
      <ul class="chapters" aria-label="Chapters">
        {#each index as chapter, k (chapter.label)}
          <li>
            <button
              type="button"
              class="menu-link chapter-link"
              class:current={chapter === indexChapter}
              aria-current={chapter === indexChapter ? 'true' : undefined}
              onclick={() => goIndexChapter(chapter)}
            >
              <span class="number">{k + 1}</span>
              <span>{say(chapter.key)}</span>
            </button>
          </li>
        {/each}
      </ul>
      <div class="start">
        <button type="button" onclick={fromTheStart}>⟲ From the very beginning</button>
      </div>
      {#if canResume && furthest}
        <div class="resume">
          <button type="button" onclick={() => goChapter(furthest.id)}>
            ↩ back to where you stopped — {furthest.label}
          </button>
        </div>
      {/if}
    {:else if openMenu === 'sections'}
      <ul class="sections-list" aria-label={indexChapter ? `Sections in ${say(indexChapter.key)}` : 'Sections'}>
        {#each indexChapter?.sections ?? [] as section (section.label)}
          <li>
            <a
              href={`#${section.scenes[0] ?? section.sideTrips[0]?.id ?? ''}`}
              class="section-link"
              class:current={section === indexSection}
              aria-current={section === indexSection ? 'true' : undefined}
              onclick={(e) => {
                e.preventDefault();
                if (section.scenes.length) goIndexSection(section);
                else if (section.sideTrips[0]) goIndexTrip(section.sideTrips[0].id);
              }}
            >
              {say(section.key)}
            </a>
            {#if section.sideTrips.length}
              <ul class="section-trips">
                {#each section.sideTrips as trip (trip.id)}
                  <li>
                    <a
                      href={`#${trip.id}`}
                      class="side-trip-link"
                      onclick={(e) => {
                        e.preventDefault();
                        goIndexTrip(trip.id);
                      }}
                    >
                      {say(trip.key)}
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</nav>

<style>
  /* The two centered rows share a fixed width; their menus overlay below them
     so opening a list never changes the navigator's size. */
  .index {
    --nav-row-height: 2.15rem;
    --nav-top-inset: 0.3rem;
    position: fixed;
    z-index: 40;
    inset-block-start: 0;
    inset-inline-end: 0;
    box-sizing: border-box;
    inline-size: min(20rem, calc(100vw - 1.5rem));
    padding-block: 0.3rem;
    padding-inline: 0.5rem;
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

  .nav-group {
    inline-size: 100%;
  }

  .nav-row {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) 2rem;
    align-items: center;
    gap: 0.2rem;
    inline-size: 100%;
    block-size: var(--nav-row-height);
    border-radius: 0.4rem;
    transition: background-color 0.16s ease;
  }

  .nav-group:hover .nav-row,
  .nav-group:focus-within .nav-row {
    background: rgb(255 255 255 / 24%);
  }

  .nav-label {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
    inline-size: 100%;
    block-size: 1.9rem;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    padding-inline: 0.1rem;
    background: transparent;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.92rem;
    font-weight: 650;
    line-height: 1.2;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    text-shadow:
      0 0 0.35em var(--paper),
      0 0 0.7em var(--paper),
      0 0 1.1em var(--paper);
  }

  .nav-label:hover:not(:disabled),
  .nav-label:focus-visible {
    border-color: #e3dac6;
    background: var(--paper-bright);
    color: var(--accent-deep);
  }

  .nav-label:disabled {
    cursor: default;
  }

  .section-name {
    color: var(--ink-soft);
    font-size: 0.78rem;
    font-weight: 600;
  }

  .nav-arrow {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    inline-size: 2rem;
    block-size: 1.9rem;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    padding: 0;
    background: transparent;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 1.05rem;
    font-weight: 650;
    line-height: 1;
    cursor: pointer;
  }

  .nav-arrow:hover:not(:disabled),
  .nav-arrow:focus-visible {
    border-color: #e3dac6;
    background: var(--paper-bright);
    color: var(--accent-deep);
  }

  .nav-arrow:disabled {
    color: var(--ink-soft);
    opacity: 0.35;
    cursor: default;
  }

  .chapter-arrow {
    font-size: 0.98rem;
  }

  .section-arrow {
    font-size: 1.3rem;
  }

  .list {
    position: absolute;
    z-index: 45;
    inset-block-start: calc(100% + 0.15rem);
    inset-inline-end: clamp(0.7rem, 2vw, 1.2rem);
    inline-size: min(16rem, calc(100vw - 1rem));
    box-sizing: border-box;
    max-block-size: min(75svh, 36rem);
    margin: 0;
    padding: 0.3rem;
    overflow-y: auto;
    border: 1px solid #d8cdb9;
    border-radius: 0.55rem;
    background: var(--paper-bright);
    box-shadow: 0 0.7rem 1.8rem rgb(65 50 29 / 16%);
    list-style: none;
  }

  .index.chapter-menu-open .list {
    inset-block-start: calc(var(--nav-row-height) + var(--nav-top-inset) + 0.15rem);
    inline-size: calc(100% - 1rem);
  }

  .index.chapter-menu-open .section-control {
    pointer-events: none;
  }

  .chapters {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .list button,
  .list a {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    border: none;
    padding-block: 0.32rem;
    padding-inline: 0.55rem;
    border-radius: 0.45rem;
    background: none;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.92rem;
    line-height: 1.2;
    text-align: start;
    text-decoration: none;
    cursor: pointer;
  }

  .list .chapter-link {
    display: flex;
    align-items: baseline;
    justify-content: flex-start;
    gap: 0.7rem;
    font-weight: 650;
  }

  .sections-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .chapter-intro {
    position: fixed;
    z-index: 39;
    inset-block-start: clamp(1rem, 2.5vh, 1.8rem);
    inset-inline: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
    pointer-events: none;
    text-align: center;
    animation: chapter-intro-life 6s ease both;
  }

  .chapter-intro-number {
    color: var(--ink-soft);
    font-size: clamp(0.8rem, 1.1vw, 1rem);
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    text-shadow: 0 0 0.7em var(--paper), 0 0 1.1em var(--paper);
  }

  .chapter-intro-title {
    color: var(--ink-mid);
    font-family: var(--font-sans);
    font-size: clamp(1.55rem, 3vw, 2.45rem);
    font-weight: 700;
    line-height: 1.1;
    text-wrap: balance;
    text-shadow: 0 0 0.7em var(--paper), 0 0 1.1em var(--paper);
  }

  @keyframes chapter-intro-life {
    0% { opacity: 0; transform: translateY(-0.55rem); }
    10%, 84% { opacity: 1; transform: none; }
    100% { opacity: 0; transform: translateY(-0.2rem); }
  }

  .list .section-link {
    padding-inline-start: 0.7rem;
    font-size: 0.84rem;
  }

  .section-trips {
    margin-block: 0.05rem 0.15rem;
    margin-inline-start: 0.8rem;
    padding-inline-start: 0.35rem;
    border-inline-start: 1px dotted #d8cdb9;
    list-style: none;
  }

  .list .side-trip-link {
    padding-block: 0.22rem;
    padding-inline-start: 0.55rem;
    font-size: 0.74rem;
    color: var(--ink-soft);
  }

  .list button:hover,
  .list button:focus-visible,
  .list a:hover,
  .list a:focus-visible {
    background: rgb(189 98 69 / 12%);
    color: var(--ink-strong);
  }

  .list .current {
    background: rgb(189 98 69 / 9%);
    color: var(--accent-deep);
    font-weight: 700;
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
    margin-block-start: 0.12rem;
    padding-block-start: 0.22rem;
    border-block-start: 1px solid #e3dac6;
  }

  .start button {
    font-weight: 650;
  }

  .resume {
    margin-block-start: 0.2rem;
    padding-block-start: 0.22rem;
    border-block-start: 1px solid #e3dac6;
  }

  .resume button {
    font-size: 0.82rem;
    font-style: italic;
    color: var(--ink-soft);
  }

  /* Keep the same centered rows on a phone, with smaller, stable arrow slots. */
  @media (max-width: 40rem) {
    .index {
      inline-size: min(20rem, calc(100vw - 1rem));
      --nav-row-height: 2.05rem;
      --nav-top-inset: 0.25rem;
      padding-block: 0.25rem;
      padding-inline: 0.4rem;
    }

    .nav-row {
      grid-template-columns: 1.9rem minmax(0, 1fr) 1.9rem;
      gap: 0.15rem;
      block-size: var(--nav-row-height);
    }

    .nav-arrow {
      inline-size: 1.9rem;
      block-size: 1.8rem;
    }

    .chapter-arrow {
      font-size: 0.9rem;
    }

    .section-arrow {
      font-size: 1.3rem;
    }

    .chapter-name {
      font-size: 0.82rem;
    }

    .section-name {
      font-size: 0.72rem;
    }

    .list {
      inline-size: min(16rem, calc(100vw - 0.8rem));
      max-block-size: 70svh;
      inset-inline-end: 0.4rem;
    }

    .index.chapter-menu-open .list {
      inline-size: calc(100% - 0.8rem);
    }

    .chapter-intro {
      inset-block-start: 0.8rem;
      inset-inline: 3.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .index {
      transition: none;
    }

    .chapter-intro {
      animation: none;
    }
  }
</style>
