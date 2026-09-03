import { DEFERRED_MOUNT_NOW_EVENT, DEFERRED_MOUNTED_EVENT } from '$lib/deferredEvents';

export const SCROLL_KEY = 'merit-or-math:reading-place:v1';

/** How long we keep reaching for the remembered place before letting the reader be. */
export const RESTORE_BUDGET_MS = 5000;

export interface ReadingPlace {
  /** A chapter anchor id: stable across layout, unlike a pixel offset. */
  readonly id: string;
  /** How far past that anchor the reader had scrolled, in pixels. */
  readonly offset: number;
  /**
   * The fragment in the URL when this place was recorded. `ChapterIndex` leaves
   * its fragment behind as the reader continues past it, so a hash on a later
   * load is only a destination request if it is not the one already sitting in
   * the address bar of the entry being reloaded.
   */
  readonly hash: string;
}

/**
 * Scenes mount as they are approached, so the document is short at load and a
 * remembered pixel offset would point at different content than it did last
 * time. A chapter anchor plus a small offset survives that growth.
 */
export function placeFor(
  anchors: readonly { readonly id: string; readonly top: number }[],
  scrollY: number,
  hash = '',
): ReadingPlace | null {
  let best: { id: string; top: number } | null = null;
  for (const anchor of anchors) {
    if (anchor.top > scrollY + 1) continue;
    if (!best || anchor.top > best.top) best = anchor;
  }
  if (!best) return null;
  return { id: best.id, offset: Math.round(scrollY - best.top), hash };
}

export function parsePlace(raw: string | null): ReadingPlace | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ReadingPlace>;
    if (typeof value.id !== 'string' || value.id.length === 0) return null;
    if (!Number.isFinite(value.offset) || value.offset! < 0) return null;
    return {
      id: value.id,
      offset: Math.round(value.offset!),
      hash: typeof value.hash === 'string' ? value.hash : '',
    };
  } catch {
    return null;
  }
}

/**
 * A hash names a destination the reader asked for, and `Chapter` already owns
 * aligning to it — so a fresh fragment navigation wins and the restore stands
 * down.
 *
 * A hash that is merely still in the address bar is a different thing. Opening
 * `/#gini` and reading on to the sandbox leaves `#gini` in the URL, and on
 * reload that stale fragment would drag the reader back to a chapter they left
 * long ago. Two things separate the cases: a reload or a back/forward step is
 * never a new destination request, and neither is a fragment identical to the
 * one recorded with the place.
 */
export function shouldRestore(
  hash: string,
  place: ReadingPlace | null,
  navigationType = 'navigate',
): boolean {
  if (place === null) return false;
  if (hash.length <= 1) return true;
  if (navigationType === 'reload' || navigationType === 'back_forward') return true;
  return hash === place.hash;
}

/** The remembered place, as far as the document currently reaches. */
export function targetFor(anchorTop: number, offset: number, documentHeight: number, viewportHeight: number): number {
  const wanted = anchorTop + offset;
  return Math.max(0, Math.min(wanted, Math.round(documentHeight - viewportHeight)));
}

/**
 * A scroll this far from where we last put the page did not come from us.
 * Sub-pixel rounding and the browser's own adjustments stay well inside it.
 */
export const READER_MOVE_PX = 4;

/**
 * The gesture listeners cannot cover the whole restore: a wheel that lands
 * before this script mounts fires into nothing. But with `scrollRestoration`
 * already manual from the previous visit, the page loads at the top — so a
 * page that has moved by the time we mount has been moved by the reader.
 *
 * Only the entry position can be judged this way. Once the walk is running,
 * ScrollTrigger scrolls the page too, and position alone can no longer tell a
 * reader from a library.
 */
export function movedBeforeMount(scrollY: number): boolean {
  return scrollY > READER_MOVE_PX;
}

/** Frames the target must hold still before we accept it as the reader's place. */
export const STABLE_FRAMES = 20;

/**
 * The walk is done once every deferred block has mounted — nothing left that
 * could move the anchor — and the target has held still for a moment after.
 */
export function hasSettled(stableFrames: number, pendingBlocks: number): boolean {
  return pendingBlocks === 0 && stableFrames >= STABLE_FRAMES;
}

/**
 * A reload deep in the essay would otherwise drop the reader into an earlier
 * scene: the browser restores scroll against a document whose deferred scenes
 * have not mounted, so the offset it restores points somewhere else entirely.
 * We take restoration over and remember a chapter anchor instead of a pixel.
 * On the way back we ask every deferred block to mount at once — walking down
 * the page instead would outrun the mounting and leave scenes behind, which is
 * the same short document in a different disguise — then aim at the anchor and
 * keep correcting until nothing is left that could move it.
 *
 * Any deliberate move by the reader ends the walk at once — the rule `Chapter`
 * follows, for the same reason.
 */
export function installScrollRestore(): () => void {
  let place: ReadingPlace | null = null;
  try {
    place = parsePlace(sessionStorage.getItem(SCROLL_KEY));
  } catch {
    // Private mode or blocked storage: nothing to restore, nothing to save.
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  let restoring = shouldRestore(location.hash, place, navigationType());

  // With `scrollRestoration` already manual from the previous visit, the page
  // loads at the top. Anything below it means the reader moved before this
  // script mounted — a wheel or a scrollbar drag during load — and that
  // decision outranks the remembered place.
  if (restoring && movedBeforeMount(window.scrollY)) restoring = false;
  const deadline = performance.now() + RESTORE_BUDGET_MS;
  let walking = 0;
  let writing = 0;
  let previousTarget = -1;
  let stableFrames = 0;

  /** 'reload' and 'back_forward' both mean the reader is returning, not arriving. */
  function navigationType(): string {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return entry?.type ?? 'navigate';
  }

  const anchors = () =>
    [...document.querySelectorAll<HTMLElement>('.chapter-anchor')].map((el) => ({
      id: el.id,
      top: Math.round(el.getBoundingClientRect().top + window.scrollY),
    }));

  const remember = () => {
    // While walking toward the remembered place we are the ones scrolling.
    // Recording those intermediate positions would overwrite the destination.
    if (restoring || writing) return;
    writing = requestAnimationFrame(() => {
      writing = 0;
      const next = placeFor(anchors(), window.scrollY, location.hash);
      try {
        if (next) sessionStorage.setItem(SCROLL_KEY, JSON.stringify(next));
      } catch {
        // Full quota: the reader simply starts at the top next time.
      }
    });
  };

  const step = () => {
    if (!restoring || !place) return;
    if (performance.now() > deadline) return release();
    const anchor = document.getElementById(place.id);
    if (!anchor) return; // its chapter has not rendered yet; keep walking
    const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
    const target = targetFor(anchorTop, place.offset, document.documentElement.scrollHeight, window.innerHeight);
    if (Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target);
    stableFrames = target === previousTarget ? stableFrames + 1 : 0;
    previousTarget = target;
    if (hasSettled(stableFrames, document.querySelectorAll('[data-deferred]').length)) release();
  };

  /**
   * Every scene that mounts above the remembered anchor pushes it further down,
   * so arriving once is not enough: the walk keeps re-reading the anchor's live
   * position until it stops moving, then lets go. It costs nothing while the
   * target holds still, because it only scrolls when the target actually moves.
   */
  const walk = () => {
    step();
    if (restoring) walking = requestAnimationFrame(walk);
  };

  function release(): void {
    if (!restoring) return;
    restoring = false;
    if (walking) cancelAnimationFrame(walking);
    walking = 0;
    document.removeEventListener(DEFERRED_MOUNTED_EVENT, step);
  }

  const releaseOnGesture = () => release();

  if (restoring) {
    // Aim only once the page can reach its real height: deferred scenes above
    // the anchor decide where the anchor ends up.
    document.dispatchEvent(new CustomEvent(DEFERRED_MOUNT_NOW_EVENT));
    walk();
    document.addEventListener(DEFERRED_MOUNTED_EVENT, step);
    window.addEventListener('wheel', releaseOnGesture, { once: true, passive: true });
    window.addEventListener('touchstart', releaseOnGesture, { once: true, passive: true });
    window.addEventListener('pointerdown', releaseOnGesture, { once: true, passive: true });
    window.addEventListener('keydown', releaseOnGesture, { once: true });
  }

  window.addEventListener('scroll', remember, { passive: true });
  window.addEventListener('pagehide', remember);

  return () => {
    release();
    if (writing) cancelAnimationFrame(writing);
    window.removeEventListener('scroll', remember);
    window.removeEventListener('pagehide', remember);
    window.removeEventListener('wheel', releaseOnGesture);
    window.removeEventListener('touchstart', releaseOnGesture);
    window.removeEventListener('pointerdown', releaseOnGesture);
    window.removeEventListener('keydown', releaseOnGesture);
  };
}
