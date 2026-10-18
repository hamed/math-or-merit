<script lang="ts">
  import { onMount } from 'svelte';
  import { chapters, loadFurthest, saveFurthest } from './chapters.svelte';
  import { STAGE_STATE_ATTRIBUTE } from '$lib/deferredEvents';
  import { STORY } from '$lib/content/story.gen';
  import { goToIndex, openBranch, type BranchId } from '$lib/widgets/stage/branch';
  import { say } from '$lib/i18n';
  import type { StoryIndexSection } from '$lib/script/compile';
  import {
    CHAPTER_INTRO_ENTER_MS,
    CHAPTER_INTRO_EXIT_EVENT,
    CHAPTER_INTRO_EXIT_MS,
  } from './chapterIntro';

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
  let introLeaving = $state(false);
  let lastMeasuredStageStep: number | null = null;
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
    if (!scene) {
      if (stageStep !== null) return null;
      return index.find((chapter) => chapter.label === `chapter:${currentId}`)?.sections[0] ?? null;
    }
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
  const chapterSteps = $derived.by(() =>
    indexChapter
      ? STORY.steps.flatMap((step, position) =>
          chapterForScene(step.scene)?.label === indexChapter.label ? [position] : [],
        )
      : [],
  );
  const storyProgress = $derived(
    stageStep !== null && chapterSteps.length > 0
      ? Math.max(0, Math.min(1, (stageStep - chapterSteps[0] + 1) / chapterSteps.length))
      : null,
  );
  const progressValue = $derived(
    storyProgress !== null && indexChapterNumber !== null ? indexChapterNumber - 1 + storyProgress : null,
  );
  const indexChapterSections = $derived(indexChapter?.sections.filter((section) => section.scenes.length > 0) ?? []);
  const indexSectionPosition = $derived(indexSection ? indexChapterSections.indexOf(indexSection) : -1);
  const progressDescription = $derived(
    indexChapter && indexSection && indexChapterNumber !== null
      ? `Chapter ${indexChapterNumber} of ${index.length}: ${say(indexChapter.key)}; section ${indexSectionPosition + 1} of ${indexChapterSections.length}: ${say(indexSection.key)}`
      : 'Story progress',
  );

  function leaveIntro(): void {
    if (!introChapterId || introLeaving) return;
    introLeaving = true;
    if (introTimer !== undefined) window.clearTimeout(introTimer);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    introTimer = window.setTimeout(() => {
      introChapterId = null;
      introLeaving = false;
      introTimer = undefined;
    }, reduced ? 0 : CHAPTER_INTRO_EXIT_MS);
  }
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
    const rawStep = stageEl ? Number(stageEl.dataset.step ?? 0) : null;
    const stageRect = stageEl?.getBoundingClientRect();
    const nextStep = stageEl && state ? Number(stageEl.dataset.step ?? 0) : null;
    stageStep = nextStep;
    const sceneLabel = rawStep === null ? null : (STORY.steps[rawStep]?.scene ?? null);
    const chapter = chapterForScene(sceneLabel);
    const introKey = nextStep === null ? undefined : STORY.steps[nextStep]?.chapterIntro;
    const intro = introKey ? index.find((entry) => entry.key === introKey) : undefined;
    if (intro && nextStep !== lastMeasuredStageStep) {
      introChapterId = intro.label;
      introLeaving = false;
      if (introTimer !== undefined) window.clearTimeout(introTimer);
      introTimer = undefined;
    } else if (
      introChapterId &&
      (!intro || !stageRect || stageRect.bottom <= 0 || stageRect.top >= window.innerHeight)
    ) leaveIntro();
    lastMeasuredStageStep = nextStep;
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
    const chapter = index.find((entry) => entry.sections.includes(section)) ?? null;
    if (chapter && list.some((mark) => chapter.label === `chapter:${mark.id}`)) {
      goIndexChapter(chapter);
      return;
    }
    const firstScene = STORY.scenes.find((sc) => sc.label === section.scenes[0]);
    if (firstScene) goScene(firstScene);
    else goIndexChapter(chapter);
  }

  function goIndexChapter(chapter: (typeof index)[number] | null): void {
    const standalone = chapter && list.find((mark) => chapter.label === `chapter:${mark.id}`);
    if (standalone) {
      goChapter(standalone.id);
      return;
    }
    const chapterIntroStep = chapter ? STORY.steps.findIndex((step) => step.chapterIntro === chapter.key) : -1;
    if (chapterIntroStep >= 0) {
      openMenu = null;
      goToIndex(STAGE, chapterIntroStep);
      return;
    }
    const firstSection = chapter?.sections.find((section) => section.scenes.length > 0);
    if (firstSection) goIndexSection(firstSection);
  }

  function goIndexTrip(id: string): void {
    const sideTrip = STORY.scenes.find((sc) => sc.label === id && sc.sideTrip);
    if (sideTrip) goScene(sideTrip);
  }

  function progressFill(chapterPosition: number): number {
    if (storyProgress === null || indexChapterNumber === null) return 0;
    if (chapterPosition < indexChapterNumber - 1) return 100;
    if (chapterPosition === indexChapterNumber - 1) return storyProgress * 100;
    return 0;
  }

  /** A scene of the stage a link can name: a chapter of the essay with the same name keeps its own. */
  const linkable = (label: string): Scene | null =>
    list.some((c) => c.id === label) ? null : (STORY.scenes.find((sc) => sc.label === label && !sc.sideTrip) ?? null);

  /** Go where a link points: a chapter, or a scene of the stage. */
  function goFragment(fragment: string): void {
    const chapter = index.find((entry) => entry.label === fragment);
    if (chapter) {
      goIndexChapter(chapter);
      return;
    }
    const sc = linkable(fragment);
    if (sc) goScene(sc);
    else goChapter(fragment);
  }

  /** Not before a link the page opened on has been followed: until then the address is the reader's. */
  let landed = false;

  /** The address bar names the scene on the stage, and lets go of it once the reader leaves the stage. */
  function followScene(): void {
    if (!landed) return;
    const step = stageStep === null ? undefined : STORY.steps[stageStep];
    const chapter = step?.chapterIntro ? index.find((entry) => entry.key === step.chapterIntro) : undefined;
    const label = step?.scene ?? null;
    const standaloneChapter = chapter && list.some((mark) => chapter.label === `chapter:${mark.id}`);
    const want = standaloneChapter ? '' : chapter ? `#${chapter.label}` : label && linkable(label) ? `#${label}` : '';
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

  function hideMenu(): void {
    if (closing !== undefined) window.clearTimeout(closing);
    closing = undefined;
    openMenu = null;
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
    const onIntroExit = () => leaveIntro();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener(CHAPTER_INTRO_EXIT_EVENT, onIntroExit);
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
      window.removeEventListener(CHAPTER_INTRO_EXIT_EVENT, onIntroExit);
      watch.disconnect();
    };
  });
</script>

{#if introChapter}
  <div
    class="chapter-intro"
    class:leaving={introLeaving}
    role="status"
    aria-live="polite"
    style={`--chapter-intro-enter-ms:${CHAPTER_INTRO_ENTER_MS}ms;--chapter-intro-exit-ms:${CHAPTER_INTRO_EXIT_MS}ms`}
  >
    <div class="chapter-intro-copy">
      <span class="chapter-intro-number">Chapter {introNumber}</span>
      <span class="chapter-intro-rule" aria-hidden="true"></span>
      <span class="chapter-intro-title">{say(introChapter.key)}</span>
    </div>
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
  >
    <div class="nav-row" aria-label="Chapter navigation">
      <button
        class="nav-arrow chapter-arrow"
        type="button"
        aria-label={previousChapter ? `Previous chapter: ${say(previousChapter.key)}` : 'No previous chapter'}
        title={previousChapter ? `Previous chapter: ${say(previousChapter.key)}` : 'No previous chapter'}
        onpointerenter={(e) => e.pointerType === 'mouse' && hideMenu()}
        onfocusin={hideMenu}
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
        onpointerenter={(e) => e.pointerType === 'mouse' && showMenu('chapters')}
        onfocusin={() => showMenu('chapters')}
        onclick={() => showMenu('chapters')}
      >
        {locationName}
      </button>
      <button
        class="nav-arrow chapter-arrow"
        type="button"
        aria-label={nextChapter ? `Next chapter: ${say(nextChapter.key)}` : 'No next chapter'}
        title={nextChapter ? `Next chapter: ${say(nextChapter.key)}` : 'No next chapter'}
        onpointerenter={(e) => e.pointerType === 'mouse' && hideMenu()}
        onfocusin={hideMenu}
        disabled={!nextChapter}
        onclick={() => goIndexChapter(nextChapter)}
      >
        ⏭
      </button>
    </div>
  </div>

  <div
    class="nav-group section-control"
  >
    <div class="nav-row" aria-label="Section navigation">
      <button
        class="nav-arrow section-arrow"
        type="button"
        aria-label={previousSection ? `Previous section: ${say(previousSection.key)}` : 'No previous section'}
        title={previousSection ? `Previous section: ${say(previousSection.key)}` : 'No previous section'}
        onpointerenter={(e) => e.pointerType === 'mouse' && hideMenu()}
        onfocusin={hideMenu}
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
        onpointerenter={(e) => e.pointerType === 'mouse' && indexChapter && showMenu('sections')}
        onfocusin={() => indexChapter && showMenu('sections')}
        onclick={() => showMenu('sections')}
      >
        {indexSection ? say(indexSection.key) : ''}
      </button>
      <button
        class="nav-arrow section-arrow"
        type="button"
        aria-label={nextSection ? `Next section: ${say(nextSection.key)}` : 'No next section'}
        title={nextSection ? `Next section: ${say(nextSection.key)}` : 'No next section'}
        onpointerenter={(e) => e.pointerType === 'mouse' && hideMenu()}
        onfocusin={hideMenu}
        disabled={!nextSection}
        onclick={() => nextSection && goIndexSection(nextSection)}
      >
        ›
      </button>
    </div>
  </div>

  {#if progressValue !== null && indexChapterNumber !== null}
    <div
      class="story-progress"
      role="progressbar"
      aria-label="Story progress"
      aria-valuemin={0}
      aria-valuemax={index.length}
      aria-valuenow={progressValue}
      aria-valuetext={progressDescription}
    >
      {#each index as chapter, k (chapter.label)}
        <span
          class="progress-segment"
          class:complete={k < indexChapterNumber - 1}
          class:current={k === indexChapterNumber - 1}
          style:--fill={`${progressFill(k)}%`}
        ></span>
      {/each}
    </div>
  {/if}

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
    --nav-row-height: 1.62rem;
    --nav-top-inset: 0.16rem;
    position: fixed;
    z-index: 40;
    inset-block-start: 0;
    inset-inline-end: 0;
    box-sizing: border-box;
    inline-size: min(16rem, calc(100vw - 1rem));
    padding-block: 0.2rem;
    padding-inline: 0.4rem;
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
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.08rem;
    inline-size: 100%;
    block-size: var(--nav-row-height);
    border-radius: 0.4rem;
    transition: background-color 0.16s ease;
  }

  .story-progress {
    display: flex;
    gap: 0.1rem;
    inline-size: 4rem;
    block-size: 0.1rem;
    margin: 0.06rem auto 0;
  }

  .progress-segment {
    position: relative;
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    border-radius: 999px;
    background: rgb(86 69 47 / 16%);
  }

  .progress-segment::after {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: var(--fill);
    border-radius: inherit;
    background: var(--ink-soft);
    content: '';
  }

  .progress-segment.current::after {
    background: var(--accent-deep);
  }

  .nav-group:hover .nav-row,
  .nav-group:focus-within .nav-row {
    background: rgb(255 255 255 / 24%);
  }

  .nav-label {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
    flex: 0 1 auto;
    inline-size: max-content;
    max-inline-size: calc(100% - 2.9rem);
    block-size: 1.5rem;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    padding-inline: 0.1rem;
    background: transparent;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.86rem;
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
    font-family: var(--font-sans);
    color: var(--ink-soft);
    font-size: 0.72rem;
    font-weight: 600;
  }

  .nav-arrow {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    flex: 0 0 1.35rem;
    inline-size: 1.35rem;
    block-size: 1.45rem;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    padding: 0;
    background: transparent;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.95rem;
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
    font-size: 0.9rem;
  }

  .chapter-name {
    font-family: var(--font-serif);
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .section-arrow {
    font-size: 1.15rem;
  }

  .list {
    position: absolute;
    z-index: 45;
    inset-block-start: calc(100% + 0.15rem);
    inset-inline-end: clamp(0.7rem, 2vw, 1.2rem);
    inline-size: min(15rem, calc(100vw - 1rem));
    box-sizing: border-box;
    max-block-size: min(75svh, 36rem);
    margin: 0;
    padding: 0.25rem;
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
    padding-block: 0.27rem;
    padding-inline: 0.5rem;
    border-radius: 0.45rem;
    background: none;
    color: var(--ink-mid);
    font-family: inherit;
    font-size: 0.86rem;
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
    z-index: 60;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-block-start: clamp(4.75rem, 14svh, 10rem);
    padding-inline: clamp(1rem, 4vw, 3rem);
    isolation: isolate;
    pointer-events: auto;
    text-align: center;
    touch-action: pan-y;
    animation: chapter-intro-enter var(--chapter-intro-enter-ms) ease-out both;
  }

  @keyframes chapter-intro-enter {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes chapter-intro-exit {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .chapter-intro::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--paper) 94%, transparent) 0%,
      color-mix(in srgb, var(--paper) 88%, transparent) 38%,
      color-mix(in srgb, var(--paper) 76%, transparent) 72%,
      color-mix(in srgb, var(--paper) 64%, transparent) 100%
    );
    content: '';
  }

  .chapter-intro-copy {
    position: relative;
    inline-size: min(100%, 52rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.75rem, 2vh, 1.25rem);
    animation: chapter-intro-copy-enter var(--chapter-intro-enter-ms) ease-out both;
  }

  .chapter-intro.leaving {
    animation: chapter-intro-exit var(--chapter-intro-exit-ms) ease-in both;
  }

  .chapter-intro.leaving .chapter-intro-copy {
    animation: chapter-intro-copy-exit var(--chapter-intro-exit-ms) ease-in both;
  }

  @keyframes chapter-intro-copy-enter {
    from { opacity: 0; transform: translateY(0.45rem); }
    to { opacity: 1; transform: none; }
  }

  @keyframes chapter-intro-copy-exit {
    from { opacity: 1; transform: none; }
    to { opacity: 0; transform: translateY(-0.2rem); }
  }

  .chapter-intro-number {
    color: var(--accent-deep);
    font-family: var(--font-sans);
    font-size: clamp(0.8rem, 1.15vw, 1rem);
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .chapter-intro-rule {
    inline-size: clamp(2.5rem, 6vw, 4rem);
    block-size: 1px;
    background: var(--accent);
  }

  .chapter-intro-title {
    color: var(--ink-strong);
    font-family: var(--font-serif);
    font-size: clamp(2.7rem, 8.8vw, 7.4rem);
    font-weight: 600;
    letter-spacing: -0.055em;
    line-height: 0.9;
    text-wrap: balance;
  }

  .list .section-link {
    padding-inline-start: 0.7rem;
    font-size: 0.78rem;
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
    font-size: 0.7rem;
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
    font-size: 0.78rem;
    font-style: italic;
    color: var(--ink-soft);
  }

  /* Keep the same centered rows on a phone, with smaller, stable arrow slots. */
  @media (max-width: 40rem) {
    .index {
      inline-size: min(16rem, calc(100vw - 0.75rem));
      --nav-row-height: 1.58rem;
      --nav-top-inset: 0.14rem;
      padding-block: 0.18rem;
      padding-inline: 0.35rem;
    }

    .nav-row {
      gap: 0.08rem;
      block-size: var(--nav-row-height);
    }

    .nav-label {
      max-inline-size: calc(100% - 3.2rem);
      block-size: 1.46rem;
    }

    .nav-arrow {
      flex-basis: 1.5rem;
      inline-size: 1.5rem;
      block-size: 1.42rem;
    }

    .chapter-arrow {
      font-size: 0.84rem;
    }

    .section-arrow {
      font-size: 1.05rem;
    }

    .chapter-name {
      font-size: 0.8rem;
    }

    .section-name {
      font-size: 0.7rem;
    }

    .list {
      inline-size: min(15rem, calc(100vw - 0.8rem));
      max-block-size: 70svh;
      inset-inline-end: 0.4rem;
    }

    .index.chapter-menu-open .list {
      inline-size: calc(100% - 0.8rem);
    }

    .chapter-intro {
      padding-block-start: clamp(4.75rem, 14svh, 10rem);
      padding-inline: 1rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .index {
      transition: none;
    }

    .chapter-intro,
    .chapter-intro::before,
    .chapter-intro-copy {
      animation: none;
    }
  }
</style>
