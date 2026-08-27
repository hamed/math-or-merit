/**
 * The essay's index.
 *
 * Chapters are CONTENT: each one is a `<Chapter>` marker written into the
 * prose beside the section it names, and this is only the register they sign.
 * Nothing here knows a chapter by name, so adding, renaming or reordering a
 * section is an edit to the essay and nothing else.
 */
export interface ChapterMark {
  readonly id: string;
  readonly label: string;
  readonly el: HTMLElement;
}

const marks = $state<ChapterMark[]>([]);

/** Every registered chapter, in document order. */
export function chapters(): readonly ChapterMark[] {
  return marks;
}

export function registerChapter(mark: ChapterMark): () => void {
  // Document order, not mount order: a marker added later still lands in the
  // right place, and the index never depends on how Svelte happened to mount.
  const at = marks.findIndex(
    (m) => m.el.compareDocumentPosition(mark.el) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  if (at === -1) marks.push(mark);
  else marks.splice(at, 0, mark);
  return () => {
    const i = marks.indexOf(mark);
    if (i >= 0) marks.splice(i, 1);
  };
}

const STORAGE_KEY = 'merit-or-math:furthest-chapter';

/** How far the reader has ever got, by chapter id. */
export function loadFurthest(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // private mode: the index still works, it just forgets
  }
}

export function saveFurthest(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* nothing to do — remembering is a convenience, not the feature */
  }
}
