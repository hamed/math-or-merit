export interface LorenzPoint {
  readonly populationShare: number;
  readonly wealthShare: number;
}

export interface WealthMetrics {
  readonly totalWealth: number;
  readonly gini: number;
  readonly topShare: number;
  readonly wealthFloor: number;
  readonly effectiveParticipants: number;
}

function sortedWealth(wealth: ArrayLike<number>): number[] {
  if (wealth.length === 0) {
    throw new RangeError('wealth must contain at least one value');
  }

  const values = Array.from(wealth);
  for (const value of values) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError('wealth values must be finite and non-negative');
    }
  }
  values.sort((a, b) => a - b);
  return values;
}

export function totalWealth(wealth: ArrayLike<number>): number {
  let total = 0;
  for (let i = 0; i < wealth.length; i++) total += wealth[i];
  return total;
}

export function giniCoefficient(wealth: ArrayLike<number>): number {
  const values = sortedWealth(wealth);
  const total = totalWealth(values);
  if (total === 0) return 0;

  let weighted = 0;
  const n = values.length;
  for (let i = 0; i < n; i++) {
    weighted += (2 * (i + 1) - n - 1) * values[i];
  }
  const result = weighted / (n * total);
  if (Math.abs(result) < Number.EPSILON * n) return 0;
  return Math.max(0, Math.min(1, result));
}

export function topWealthShare(wealth: ArrayLike<number>, count = 1): number {
  const values = sortedWealth(wealth);
  if (!Number.isSafeInteger(count) || count < 1 || count > values.length) {
    throw new RangeError('count must be an integer between 1 and the population size');
  }
  const total = totalWealth(values);
  if (total === 0) return 0;

  let top = 0;
  for (let i = values.length - count; i < values.length; i++) top += values[i];
  return top / total;
}

export function effectiveParticipantCount(wealth: ArrayLike<number>): number {
  const values = sortedWealth(wealth);
  const total = totalWealth(values);
  if (total === 0) return 0;

  let squaredShares = 0;
  for (const value of values) squaredShares += (value / total) ** 2;
  return 1 / squaredShares;
}

export function lorenzCurve(wealth: ArrayLike<number>): LorenzPoint[] {
  const values = sortedWealth(wealth);
  const total = totalWealth(values);
  const points: LorenzPoint[] = [{ populationShare: 0, wealthShare: 0 }];
  let cumulative = 0;

  for (let i = 0; i < values.length; i++) {
    cumulative += values[i];
    points.push({
      populationShare: (i + 1) / values.length,
      wealthShare: total === 0 ? 0 : cumulative / total,
    });
  }
  return points;
}

export function measureWealth(wealth: ArrayLike<number>): WealthMetrics {
  const values = sortedWealth(wealth);
  return {
    totalWealth: totalWealth(values),
    gini: giniCoefficient(values),
    topShare: topWealthShare(values),
    wealthFloor: values[0],
    effectiveParticipants: effectiveParticipantCount(values),
  };
}

export function quantile(values: readonly number[], probability: number): number {
  if (values.length === 0) throw new RangeError('values must not be empty');
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('probability must be between 0 and 1');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
}
