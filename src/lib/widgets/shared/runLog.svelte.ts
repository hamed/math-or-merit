/**
 * Cross-widget session state, content-layer only: the reader's guess and bet
 * (Scene 12, remembered for the visit and in localStorage), and every run of
 * the stage's room, logged as it finishes.
 */

/** A finished run of the room, as the stage logs it. */
export interface LoggedRun {
  readonly seed: number;
  readonly beta: number;
  readonly trades: number;
  readonly wealth: Float64Array;
  readonly winner: number;
  readonly topShare: number;
}

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

export function logRun(run: LoggedRun): void {
  session.runs.push(run);
}
