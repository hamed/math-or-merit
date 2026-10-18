import { describe, expect, it } from 'vitest';
import { fitSquareRelationship } from '$lib/research/phase';
import { MAP_GINI, MAP_LEVIES, MAP_PARTICIPANTS, MAP_STAKES } from '$lib/research/sandboxOutcomeMap';

describe('sandbox outcome map', () => {
  it('covers both displayed dial endpoints with finite values and exact boundary outcomes', () => {
    expect([MAP_STAKES[0], MAP_STAKES.at(-1)]).toEqual([0, 1]);
    expect([MAP_LEVIES[0], MAP_LEVIES.at(-1)]).toEqual([0, 0.5]);
    expect(MAP_STAKES.length * MAP_LEVIES.length).toBeGreaterThan(1000);
    expect(MAP_PARTICIPANTS).toHaveLength(MAP_LEVIES.length);
    expect(MAP_GINI).toHaveLength(MAP_LEVIES.length);
    for (let row = 0; row < MAP_LEVIES.length; row++) {
      expect(MAP_PARTICIPANTS[row]).toHaveLength(MAP_STAKES.length);
      expect(MAP_GINI[row]).toHaveLength(MAP_STAKES.length);
      for (let col = 0; col < MAP_STAKES.length; col++) {
        expect(MAP_PARTICIPANTS[row][col]).toBeGreaterThanOrEqual(1);
        expect(MAP_PARTICIPANTS[row][col]).toBeLessThanOrEqual(100);
        expect(MAP_GINI[row][col]).toBeGreaterThanOrEqual(0);
        expect(MAP_GINI[row][col]).toBeLessThanOrEqual(1);
      }
      expect(MAP_PARTICIPANTS[row][0]).toBe(100);
      expect(MAP_GINI[row][0]).toBe(0);
    }
    expect(MAP_PARTICIPANTS[0][0]).toBe(100);
    expect(MAP_GINI[0][0]).toBe(0);
    for (let col = 1; col < MAP_STAKES.length; col++) {
      expect(MAP_PARTICIPANTS[0][col]).toBe(1);
      expect(MAP_GINI[0][col]).toBe(0.99);
    }
    expect(MAP_PARTICIPANTS.some((row) => row.some((value) => !Number.isInteger(value)))).toBe(true);
  });

  it('spaces the levy samples evenly on the plotted square-root scale', () => {
    const steps = MAP_LEVIES.length - 1;
    for (let row = 0; row <= steps; row++) {
      expect(Math.sqrt(MAP_LEVIES[row])).toBeCloseTo(
        Math.sqrt(0.5) * row / steps, 12,
      );
    }
  });

  it('supports a near-constant outcome along the calibrated square-law guide', () => {
    const start = MAP_STAKES.findIndex((stake) => stake >= 0.3);
    const end = MAP_STAKES.findIndex((stake) => stake > 0.8);
    const stakes = MAP_STAKES.slice(start, end);
    const fit = fitSquareRelationship(
      MAP_PARTICIPANTS.map((row) => row.slice(start, end)),
      stakes,
      MAP_LEVIES,
      50,
      'increases',
    );
    expect(fit).not.toBeNull();

    const at = (grid: readonly (readonly number[])[], col: number, levy: number): number => {
      const row = MAP_LEVIES.findIndex((upper) => upper >= levy);
      if (row === 0) return grid[0][col];
      const lower = row - 1;
      const weight = (levy - MAP_LEVIES[lower]) / (MAP_LEVIES[row] - MAP_LEVIES[lower]);
      return grid[lower][col] * (1 - weight) + grid[row][col] * weight;
    };
    const participants = stakes.map((stake, i) => at(MAP_PARTICIPANTS, start + i, fit!.c * stake * stake));
    const ginis = stakes.map((stake, i) => at(MAP_GINI, start + i, fit!.c * stake * stake));
    expect(Math.min(...participants)).toBeGreaterThan(44);
    expect(Math.max(...participants)).toBeLessThan(53);
    expect(Math.max(...ginis) - Math.min(...ginis)).toBeLessThan(0.08);
  });
});
