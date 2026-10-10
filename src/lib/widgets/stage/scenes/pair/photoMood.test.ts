import { describe, expect, it } from 'vitest';
import { CONTEMPT } from '../../../shared/face/moments';
import { photoMood } from './photoMood';

describe('the paper’s photograph', () => {
  it('shows the richest with contempt, and a poor person without it, sad', () => {
    expect(photoMood(0.4, 100, true)).toBe(CONTEMPT);
    const poor = photoMood(0.001, 100, false);
    expect(poor).not.toBe(CONTEMPT);
    expect(poor.v).toBeLessThan(-0.5);
    expect(poor.d).toBeLessThan(0);
    // an equal share is plain; a comfortable one pleased
    expect(Math.abs(photoMood(0.01, 100, false).v)).toBeLessThan(1e-9);
    expect(photoMood(0.03, 100, false).v).toBeGreaterThan(0.5);
  });
});
