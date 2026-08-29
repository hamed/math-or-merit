import { describe, expect, it } from 'vitest';
import { SteadyStateTracker } from './SteadyStateTracker';

describe('SteadyStateTracker', () => {
  it('reports only after two complete, agreeing windows', () => {
    const tracker = new SteadyStateTracker(10, 0.02);
    expect(tracker.observe({ key: 'room', rounds: 0, gini: 0.4 })).toBeNull();
    expect(tracker.observe({ key: 'room', rounds: 10, gini: 0.4 })).toBeNull();
    expect(tracker.observe({ key: 'room', rounds: 20, gini: 0.41 })).toBeCloseTo(0.41);
  });

  it('starts over when the room contract changes', () => {
    const tracker = new SteadyStateTracker(10, 0.02);
    tracker.observe({ key: 'a', rounds: 0, gini: 0.4 });
    tracker.observe({ key: 'a', rounds: 10, gini: 0.4 });
    expect(tracker.observe({ key: 'b', rounds: 10, gini: 0.4 })).toBeNull();
    expect(tracker.observe({ key: 'b', rounds: 20, gini: 0.4 })).toBeNull();
    expect(tracker.observe({ key: 'b', rounds: 30, gini: 0.4 })).toBe(0.4);
  });
});
