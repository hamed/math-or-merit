import type { LoggedRun } from '../shared/runLog.svelte';

export type WinnerChange = 'first' | 'same' | 'different';

export interface RevealInterpretation {
  readonly latest: LoggedRun;
  readonly winnerChange: WinnerChange;
}

/** Describe only outcomes the reader has actually produced. */
export function interpretRuns(runs: readonly LoggedRun[]): RevealInterpretation | null {
  if (runs.length === 0) return null;
  const latest = runs[runs.length - 1];
  if (runs.length === 1) return { latest, winnerChange: 'first' };
  const previous = runs[runs.length - 2];
  return {
    latest,
    winnerChange: previous.winner === latest.winner ? 'same' : 'different',
  };
}
