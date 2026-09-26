import { describe, expect, it } from 'vitest';
import { fitSquareRelationship } from '$lib/research';
import { MAP_LEVIES, MAP_PARTICIPANTS, MAP_STAKES } from './outcomeMap';

describe('the outcome map (Scene 24)', () => {
  it('has one measured square for every stake and levy, each between one and a hundred', () => {
    expect(MAP_PARTICIPANTS).toHaveLength(MAP_LEVIES.length);
    for (const row of MAP_PARTICIPANTS) {
      expect(row).toHaveLength(MAP_STAKES.length);
      for (const v of row) expect(v >= 1 && v <= 100).toBe(true);
    }
  });

  it('keeps more counting with a bigger levy, and fewer with a bigger stake', () => {
    const last = MAP_LEVIES.length - 1;
    for (let ix = 0; ix < MAP_STAKES.length; ix++) expect(MAP_PARTICIPANTS[last][ix]).toBeGreaterThan(MAP_PARTICIPANTS[0][ix]);
    for (let iy = 0; iy < MAP_LEVIES.length; iy++) expect(MAP_PARTICIPANTS[iy][0]).toBeGreaterThanOrEqual(MAP_PARTICIPANTS[iy][MAP_STAKES.length - 1]);
  });

  it('bears out what Red says: double the stake, about four times the levy, for half still counting', () => {
    const fit = fitSquareRelationship(MAP_PARTICIPANTS, MAP_STAKES, MAP_LEVIES, 50, 'increases');
    expect(fit).not.toBeNull();
    const at = (stake: number) => fit!.crossings.find((c) => Math.abs(c.beta - stake) < 1e-9)!.tax;
    const ratio = at(0.4) / at(0.2);
    expect(ratio).toBeGreaterThan(3);
    expect(ratio).toBeLessThan(5.5);
  });
});
