import { describe, expect, it } from 'vitest';
import { plottedOutcome, outcomeReading } from './plottedOutcome';

describe('plotted outcomes', () => {
  it('aligns each room’s exact equality and one-owner limits', () => {
    for (const n of [2, 8, 100, 2048]) {
      expect(plottedOutcome('effectiveParticipants', n, n)).toBe(1);
      expect(plottedOutcome('effectiveParticipants', 1, n)).toBe(0);
      expect(plottedOutcome('gini', 0, n)).toBe(0);
      expect(plottedOutcome('gini', 1 - 1 / n, n)).toBeCloseTo(1 - 1 / n);
    }
  });

  it('preserves fractional participant measurements', () => {
    expect(plottedOutcome('effectiveParticipants', 1.3, 2)).toBeCloseTo(0.3);
    expect(outcomeReading('effectiveParticipants', 1.3, 2)).toBe('30%');
    expect(outcomeReading('gini', 0.5, 2)).toBe('0.5');
  });
});
