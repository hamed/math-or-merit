import { describe, expect, it } from 'vitest';
import { EQUAL_COIN_OWNERS, pairingMetrics, transferCoin } from './participation';

describe('effective-participant coin lesson', () => {
  it('starts with four equal participants', () => {
    const result = pairingMetrics(EQUAL_COIN_OWNERS);
    expect(result.holdings).toEqual([3, 3, 3, 3]);
    expect(result.matchingPairs).toBe(36);
    expect(result.totalPairs).toBe(144);
    expect(result.effectiveParticipants).toBe(4);
  });

  it('makes the visual 6:2:2:2 room exactly three effective participants', () => {
    const result = pairingMetrics([0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3]);
    expect(result.matchingPairs).toBe(48);
    expect(result.sameOwnerChance).toBeCloseTo(1 / 3, 12);
    expect(result.effectiveParticipants).toBeCloseTo(3, 12);
  });

  it('reaches one when every coin has the same owner', () => {
    expect(pairingMetrics(new Array(12).fill(2)).effectiveParticipants).toBe(1);
  });

  it('moves one coin without mutating the previous room', () => {
    const moved = transferCoin(EQUAL_COIN_OWNERS, 3, 0);
    expect(EQUAL_COIN_OWNERS).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
    expect(pairingMetrics(moved).holdings).toEqual([4, 2, 3, 3]);
    expect(pairingMetrics(moved).effectiveParticipants).toBeCloseTo(144 / 38, 12);
  });
});
