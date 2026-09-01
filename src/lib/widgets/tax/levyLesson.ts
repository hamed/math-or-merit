export const LESSON_LEVY_RATE = 0.25;
export const LESSON_INITIAL_WEALTH = [4, 4, 4, 20] as const;

export interface LevyLessonAmounts {
  initial: readonly number[];
  contributions: readonly number[];
  afterLevy: readonly number[];
  pool: number;
  dividend: number;
  final: readonly number[];
}

export function levyLessonAmounts(): LevyLessonAmounts {
  const initial = [...LESSON_INITIAL_WEALTH];
  const contributions = initial.map((wealth) => wealth * LESSON_LEVY_RATE);
  const afterLevy = initial.map((wealth, i) => wealth - contributions[i]);
  const pool = contributions.reduce((sum, value) => sum + value, 0);
  const dividend = pool / initial.length;
  const final = afterLevy.map((wealth) => wealth + dividend);
  return { initial, contributions, afterLevy, pool, dividend, final };
}

/** Repeated proportional levy plus equal return; round 0 is the initial room. */
export function wealthAfterLevyRounds(rounds: number): readonly number[] {
  const mean = LESSON_INITIAL_WEALTH.reduce((sum, value) => sum + value, 0) / LESSON_INITIAL_WEALTH.length;
  const remaining = (1 - LESSON_LEVY_RATE) ** Math.max(0, Math.floor(rounds));
  return LESSON_INITIAL_WEALTH.map((wealth) => mean + (wealth - mean) * remaining);
}
