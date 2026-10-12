/** The chapter card enters with its step and exits after the reader scrolls on. */
export const CHAPTER_INTRO_ENTER_MS = 520;
export const CHAPTER_INTRO_EXIT_MS = 420;
export const CHAPTER_INTRO_EXIT_EVENT = 'merit-or-math:chapter-intro-exit';

export function chapterIntroExitDuration(reduced: boolean): number {
  return reduced ? 0 : CHAPTER_INTRO_EXIT_MS;
}
