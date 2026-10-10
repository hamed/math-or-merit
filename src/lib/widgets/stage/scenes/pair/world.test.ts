import { describe, expect, it } from 'vitest';
import { FILLS, STROKES } from '../../../shared/agentStyle';
import { VEIL_COUNTS } from './veilCounts';
import { VEIL_STOPS, expectedCount, parseWorld, shade, snapLevy, veilColour, worldColour, worldLink } from './world';

describe('the ending: one dial, one colour', () => {
  it('runs from nothing to everything, the middle stop lively', () => {
    expect(VEIL_STOPS[0]).toBe(0);
    expect(VEIL_STOPS[VEIL_STOPS.length - 1]).toBe(1);
    const middle = expectedCount(VEIL_STOPS[Math.floor(VEIL_STOPS.length / 2)]);
    expect(middle).toBeGreaterThan(40);
    expect(middle).toBeLessThan(85);
  });

  it('measures one count per stop, and more still count as the levy grows', () => {
    expect(VEIL_COUNTS).toHaveLength(VEIL_STOPS.length);
    for (let i = 1; i < VEIL_COUNTS.length; i++) expect(VEIL_COUNTS[i]).toBeGreaterThan(VEIL_COUNTS[i - 1]);
  });

  it("is Blue's colour with one owner and Red's with everyone, violet between", () => {
    expect(veilColour(1)).toEqual({ fill: FILLS.blue, stroke: STROKES.blue });
    expect(veilColour(100)).toEqual({ fill: FILLS.red, stroke: STROKES.red });
    expect(veilColour(50.5)).toEqual({ fill: FILLS.violet, stroke: STROKES.violet });
  });

  it('moves one way only as more still count', () => {
    for (let c = 2; c <= 100; c++) expect(shade(c)).toBeGreaterThan(shade(c - 1));
    expect(shade(0)).toBe(0);
    expect(shade(500)).toBe(1);
  });

  it('gives a shared levy the same colour every time', () => {
    expect(worldColour(0.01)).toEqual(veilColour(expectedCount(0.01)));
    expect(worldColour(0.0099)).toEqual(worldColour(0.01));
  });
});

describe('the ending: a world travels as a link', () => {
  it('round-trips every stop', () => {
    for (const levy of VEIL_STOPS) {
      const link = worldLink('https://example.org/merit/?debug=1#gini', levy);
      expect(link).not.toContain('#');
      expect(link).toContain('debug=1');
      expect(parseWorld(new URL(link).search)).toBe(levy);
    }
  });

  it('snaps to a stop, and ignores nonsense', () => {
    expect(snapLevy(0.004)).toBe(0.003);
    expect(parseWorld('?world=0.009')).toBe(0.01);
    expect(parseWorld('')).toBeNull();
    expect(parseWorld('?world=')).toBeNull();
    expect(parseWorld('?world=abc')).toBeNull();
    expect(parseWorld('?world=-1')).toBeNull();
    expect(parseWorld('?world=2')).toBeNull();
    expect(parseWorld('?world=Infinity')).toBeNull();
  });
});
