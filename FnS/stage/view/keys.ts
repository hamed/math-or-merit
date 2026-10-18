/**
 * What a key does on the page, decided here and carried out by main.ts, so it
 * can be tested without a browser. A focused button or link keeps Space and
 * Enter for itself: they press it, and its own click does the rest (review
 * 2026-10-18, N1: Space on the focused Play skipped the opening and started
 * trading, while a click unfolded the logo).
 */

/** Where the key was pressed: the console's input, a button or link, or the page itself. */
export type KeyTarget = 'console' | 'control' | 'page';
/** The opening: fonts still loading, the logo held, unfolding, or over (or never shown). */
export type OpeningState = 'waiting' | 'held' | 'unfolding' | 'none';
export type KeyAction = 'native' | 'start' | 'skip' | 'toggle-console' | 'focus-console' | 'play-pause' | 'slower' | 'faster' | 'none';

export function keyAction(key: string, target: KeyTarget, opening: OpeningState): KeyAction {
  if (target === 'console') return key === '`' ? 'toggle-console' : 'none';
  const during = opening !== 'none';
  if (during && key === 'Escape') return 'skip';
  if (target === 'control' && (key === ' ' || key === 'Enter')) return 'native';
  if (during && (key === ' ' || key === 'Enter')) return opening === 'held' ? 'start' : 'skip';
  if (key === '`') return 'toggle-console';
  if (key === '/') return 'focus-console';
  if (key === ' ') return 'play-pause';
  if (key === '[') return 'slower';
  if (key === ']') return 'faster';
  return 'none';
}
