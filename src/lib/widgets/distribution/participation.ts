export const PARTICIPATION_HOLDERS = 4;
export const PARTICIPATION_COINS = 12;

export const EQUAL_COIN_OWNERS: readonly number[] = Object.freeze(
  Array.from({ length: PARTICIPATION_COINS }, (_, coin) => Math.floor(coin / 3)),
);

export interface PairingMetrics {
  readonly holdings: readonly number[];
  readonly matchingPairs: number;
  readonly totalPairs: number;
  readonly sameOwnerChance: number;
  readonly effectiveParticipants: number;
}

/** Exact, finite coin version of 1 / Σ share². */
export function pairingMetrics(owners: readonly number[]): PairingMetrics {
  if (owners.length === 0) throw new RangeError('owners must not be empty');
  const holdings = new Array<number>(PARTICIPATION_HOLDERS).fill(0);
  for (const owner of owners) {
    if (!Number.isSafeInteger(owner) || owner < 0 || owner >= PARTICIPATION_HOLDERS) {
      throw new RangeError('every coin must belong to a displayed holder');
    }
    holdings[owner]++;
  }
  const matchingPairs = holdings.reduce((sum, count) => sum + count * count, 0);
  const totalPairs = owners.length * owners.length;
  const sameOwnerChance = matchingPairs / totalPairs;
  return {
    holdings,
    matchingPairs,
    totalPairs,
    sameOwnerChance,
    effectiveParticipants: 1 / sameOwnerChance,
  };
}

export function transferCoin(owners: readonly number[], coin: number, destination: number): number[] {
  if (!Number.isSafeInteger(coin) || coin < 0 || coin >= owners.length) throw new RangeError('coin out of range');
  if (!Number.isSafeInteger(destination) || destination < 0 || destination >= PARTICIPATION_HOLDERS) {
    throw new RangeError('destination out of range');
  }
  const next = [...owners];
  next[coin] = destination;
  return next;
}
