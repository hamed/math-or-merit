import { describe, expect, it } from 'vitest';
import {
  LESSON_INITIAL_WEALTH,
  LESSON_LEVY_RATE,
  levyLessonAmounts,
  wealthAfterLevyRounds,
} from './levyLesson';

describe('levyLessonAmounts', () => {
  it('takes one percentage while larger fortunes contribute more coins', () => {
    const amounts = levyLessonAmounts();
    expect(amounts.contributions).toEqual([1, 1, 1, 5]);
    amounts.contributions.forEach((amount, i) => {
      expect(amount / amounts.initial[i]).toBe(LESSON_LEVY_RATE);
    });
  });

  it('returns equal dividends and conserves every coin', () => {
    const amounts = levyLessonAmounts();
    expect(amounts.pool).toBe(8);
    expect(amounts.dividend).toBe(2);
    expect(amounts.final).toEqual([5, 5, 5, 17]);
    expect(amounts.final.reduce((sum, value) => sum + value, 0))
      .toBe(amounts.initial.reduce((sum, value) => sum + value, 0));
  });

  it('repeated rounds conserve wealth while shrinking every deviation by three quarters', () => {
    const initialMean = LESSON_INITIAL_WEALTH.reduce((sum, value) => sum + value, 0) / LESSON_INITIAL_WEALTH.length;
    const afterOne = wealthAfterLevyRounds(1);
    const afterTwo = wealthAfterLevyRounds(2);
    expect(afterOne).toEqual([5, 5, 5, 17]);
    afterTwo.forEach((wealth, i) => {
      expect(wealth - initialMean).toBeCloseTo((afterOne[i] - initialMean) * 0.75);
    });
    expect(afterTwo.reduce((sum, value) => sum + value, 0))
      .toBeCloseTo(LESSON_INITIAL_WEALTH.reduce((sum, value) => sum + value, 0));
    expect(Math.max(...wealthAfterLevyRounds(30)) - Math.min(...wealthAfterLevyRounds(30)))
      .toBeLessThan(0.01);
  });
});
