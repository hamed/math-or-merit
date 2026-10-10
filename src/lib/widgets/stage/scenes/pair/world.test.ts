import { describe, expect, it } from 'vitest';
import { measureWealth } from '$lib/research';
import { FILLS, STROKES } from '../../../shared/agentStyle';
import { KEEPERS, SHARERS, VEIL_N, VEIL_STOPS, levyShade, outcome, parseWorld, scatter, shadeColour, snapLevy, worldColour, worldLink } from './world';

describe('the ending: one dial, three boxes', () => {
  it('ends the dial where the levy saturates: nearly one owner at none, nearly everyone at the last stop', () => {
    expect(VEIL_STOPS[0]).toBe(0);
    expect(measureWealth(outcome(0)).effectiveParticipants).toBeLessThan(3);
    expect(measureWealth(outcome(VEIL_STOPS[VEIL_STOPS.length - 1])).effectiveParticipants).toBeGreaterThan(0.9 * VEIL_N);
  });

  it('opens the room up as the levy grows, and shows the same room for the same levy', () => {
    const counts = VEIL_STOPS.map((l) => measureWealth(outcome(l)).effectiveParticipants);
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1] - 0.5);
    expect(outcome(0.01)).toBe(outcome(0.0099));
    const total = outcome(0.01).reduce((t, x) => t + x, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it('holds the same total in both limits', () => {
    expect(KEEPERS.reduce((t, x) => t + x, 0)).toBeCloseTo(1, 12);
    expect(SHARERS.reduce((t, x) => t + x, 0)).toBeCloseTo(1, 12);
    expect(Math.max(...KEEPERS)).toBeGreaterThan(0.9);
  });

  it("is pure Blue's at no levy and pure Red's at the last stop, violet between", () => {
    expect(worldColour(0)).toEqual({ fill: FILLS.blue, stroke: STROKES.blue });
    expect(worldColour(VEIL_STOPS[VEIL_STOPS.length - 1])).toEqual({ fill: FILLS.red, stroke: STROKES.red });
    expect(shadeColour(0.5)).toEqual({ fill: FILLS.violet, stroke: STROKES.violet });
    for (let i = 1; i < VEIL_STOPS.length; i++) expect(levyShade(VEIL_STOPS[i])).toBeGreaterThan(levyShade(VEIL_STOPS[i - 1]));
  });

  it('scatters a box with hardly any overlap, and inside it', () => {
    const size = 300;
    const unit = size * 0.07;
    for (const shares of [KEEPERS, SHARERS, Array.from(outcome(0.01))]) {
      const radii = shares.map((s) => Math.max(1, unit * Math.sqrt(s * VEIL_N)));
      const p = scatter(radii, size);
      for (let i = 0; i < p.length; i++) {
        expect(p[i].x - radii[i]).toBeGreaterThanOrEqual(-0.01);
        expect(p[i].x + radii[i]).toBeLessThanOrEqual(size + 0.01);
        for (let j = i + 1; j < p.length; j++) expect(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y)).toBeGreaterThan((radii[i] + radii[j]) * 0.9);
      }
    }
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
    expect(snapLevy(0.004)).toBe(0.005);
    expect(parseWorld('?world=0.009')).toBe(0.01);
    expect(parseWorld('?world=0.5')).toBe(0.1);
    expect(parseWorld('')).toBeNull();
    expect(parseWorld('?world=')).toBeNull();
    expect(parseWorld('?world=abc')).toBeNull();
    expect(parseWorld('?world=-1')).toBeNull();
    expect(parseWorld('?world=2')).toBeNull();
    expect(parseWorld('?world=Infinity')).toBeNull();
  });
});
