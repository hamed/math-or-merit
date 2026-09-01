import { describe, expect, it } from 'vitest';
import { LESSON_LEVY_RATE, levyLessonAmounts } from './levyLesson';

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
});
