/**
 * Cross-widget session state, content-layer only. The reveal and re-run
 * widgets log finished rooms here; Chapter III reads the latest one so the
 * histogram is built from "the people you just watched". The reader's
 * prediction (beat 10) is quoted back after the reveal.
 */
import type { LoggedRun } from './roomRun';

export type { LoggedRun };

export const PREDICTIONS = [
  { id: 'equal', label: 'Still roughly equal' },
  { id: 'spread', label: 'A gentle spread' },
  { id: 'split', label: 'A split: some rich, some poor' },
  { id: 'giant', label: 'One giant, the rest near nothing' },
] as const;

export type PredictionId = (typeof PREDICTIONS)[number]['id'];

export const session = $state({
  prediction: null as PredictionId | null,
  runs: [] as LoggedRun[],
});

export function predictionLabel(id: PredictionId | null): string | null {
  return PREDICTIONS.find((p) => p.id === id)?.label ?? null;
}

export function logRun(run: LoggedRun): void {
  session.runs.push(run);
}

/** Undo only the room currently at the end of the guided story. */
export function unlogRun(seed: number): boolean {
  const latest = session.runs[session.runs.length - 1];
  if (!latest || latest.seed !== seed) return false;
  session.runs.pop();
  return true;
}

export function latestRun(): LoggedRun | null {
  return session.runs.length === 0 ? null : session.runs[session.runs.length - 1];
}
