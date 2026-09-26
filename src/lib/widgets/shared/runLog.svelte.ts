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

/** A small picture of each outcome: the radii of six people in a room, largest first. */
export const PREDICTION_PICTURES: Readonly<Record<PredictionId, readonly number[]>> = {
  equal: [8, 8, 8, 8, 8, 8],
  spread: [10, 9, 8, 8, 7, 6],
  split: [13, 12, 11, 5, 4, 3],
  giant: [24, 4, 3, 2.5, 2, 1.5],
};

/** What the reader would stake on their guess (v3 Scene 15). Words live in prose.md. */
export const BETS = ['coffee', 'lunch', 'vacation', 'percent'] as const;
export type BetId = (typeof BETS)[number];

export const PREDICTION_KEY = 'merit-or-math.prediction';
export const BET_KEY = 'merit-or-math.bet';

export const session = $state({
  prediction: null as PredictionId | null,
  bet: null as BetId | null,
  runs: [] as LoggedRun[],
});

/** The reader's guess and bet, back from a previous visit (localStorage; private mode forgets). */
export function recallAnswers(): void {
  try {
    const prediction = localStorage.getItem(PREDICTION_KEY);
    if (session.prediction === null && PREDICTIONS.some((p) => p.id === prediction)) {
      session.prediction = prediction as PredictionId;
    }
    const bet = localStorage.getItem(BET_KEY);
    if (session.bet === null && (BETS as readonly string[]).includes(bet ?? '')) session.bet = bet as BetId;
  } catch {
    // private mode: the answers live for this visit only
  }
}

export function answer(kind: 'prediction', id: PredictionId): void;
export function answer(kind: 'bet', id: BetId): void;
export function answer(kind: 'prediction' | 'bet', id: string): void {
  if (kind === 'prediction') session.prediction = id as PredictionId;
  else session.bet = id as BetId;
  try {
    localStorage.setItem(kind === 'prediction' ? PREDICTION_KEY : BET_KEY, id);
  } catch {
    // private mode: the answer still lives for this visit
  }
}

export function predictionLabel(id: PredictionId | null): string | null {
  return PREDICTIONS.find((p) => p.id === id)?.label ?? null;
}

export function logRun(run: LoggedRun): void {
  session.runs.push(run);
}

export function latestRun(): LoggedRun | null {
  return session.runs.length === 0 ? null : session.runs[session.runs.length - 1];
}
