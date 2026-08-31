import { describe, expect, it } from 'vitest';
import { EQUAL_COIN_OWNERS, pairingMetrics, transferCoin } from './participation';

describe('effective-participant coin lesson', () => {
  it('starts with four equal participants', () => {
    const result = pairingMetrics(EQUAL_COIN_OWNERS);
    expect(result.holdings).toEqual([4, 4, 4, 4]);
    expect(result.matchingPairs).toBe(64);
    expect(result.totalPairs).toBe(256);
    expect(result.effectiveParticipants).toBe(4);
  });

  it('makes two equal fortunes exactly two effective participants', () => {
    const result = pairingMetrics([...new Array(8).fill(0), ...new Array(8).fill(1)]);
    expect(result.matchingPairs).toBe(128);
    expect(result.sameOwnerChance).toBe(0.5);
    expect(result.effectiveParticipants).toBe(2);
  });

  it('reaches one when every coin has the same owner', () => {
    expect(pairingMetrics(new Array(16).fill(2)).effectiveParticipants).toBe(1);
  });

  it('moves one coin without mutating the previous room', () => {
    const moved = transferCoin(EQUAL_COIN_OWNERS, 4, 0);
    expect(EQUAL_COIN_OWNERS).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
    expect(pairingMetrics(moved).holdings).toEqual([5, 3, 4, 4]);
    expect(pairingMetrics(moved).effectiveParticipants).toBeCloseTo(256 / 66, 12);
  });
});
