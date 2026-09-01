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
