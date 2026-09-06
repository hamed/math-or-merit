import { describe, expect, it } from 'vitest';
import { nextClosureDuration } from './judge';

describe('nextClosureDuration', () => {
  it('measures real time below the line instead of animation frames', () => {
    expect(nextClosureDuration(0, 15, 1_000, 20)).toBe(1_000);
    expect(nextClosureDuration(1_000, 15, 2_500, 20)).toBe(3_500);
  });

  it('resets as soon as participation recovers', () => {
    expect(nextClosureDuration(3_900, 25, 100, 20)).toBe(0);
  });

  it('does not run backward on a malformed negative frame delta', () => {
    expect(nextClosureDuration(500, 15, -100, 20)).toBe(500);
  });
});
