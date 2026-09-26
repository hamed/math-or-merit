/**
 * Scene 21's game, as numbers: the room trades live at the essay's stake; a
 * tap takes a quarter of one fortune into a pool shared back equally (a manual
 * WEALTH levy, C13); the reader keeps at least twenty effective participants
 * for thirty seconds, or the game closes after five seconds below them.
 *
 * Tuned with a robot player at this pace (2026-09-26, 20 rooms each): tapping
 * the richest every 700 ms or faster held every room; once a second won about
 * half; never tapping closed every room in about twelve seconds — a diligent
 * hand genuinely can win (design guard), a lazy one cannot.
 */
export const GAME = {
  beta: 0.5,
  perSecond: 280,
  seconds: 30,
  rate: 0.25,
  target: 20,
  closeAfterMs: 5_000,
} as const;

/** Advance real elapsed time below the participation line; any recovery resets it. */
export function nextClosureDuration(previousMs: number, effectiveParticipants: number, elapsedMs: number, minimum = 20): number {
  return effectiveParticipants < minimum ? previousMs + Math.max(0, elapsedMs) : 0;
}

export type GameResult = { readonly won: true; readonly count: number } | { readonly won: false; readonly seconds: number; readonly taps: number };
