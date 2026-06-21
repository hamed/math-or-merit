export interface ProgressiveBracket {
  readonly above: number;
  readonly rate: number;
}

function validateRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new RangeError('rates must be between 0 and 1');
}

function redistributeEqually(wealth: Float64Array, revenue: number): void {
  const dividend = revenue / wealth.length;
  for (let i = 0; i < wealth.length; i++) wealth[i] += dividend;
}

function collectLiabilities(
  wealth: Float64Array,
  liabilities: Float64Array,
  budget = Number.POSITIVE_INFINITY,
): number {
  const totalLiability = liabilities.reduce((sum, value) => sum + value, 0);
  const revenue = Math.min(budget, totalLiability);
  const scale = totalLiability === 0 ? 0 : revenue / totalLiability;
  for (let i = 0; i < wealth.length; i++) wealth[i] -= liabilities[i] * scale;
  redistributeEqually(wealth, revenue);
  return revenue;
}

export function applyTargetedWealthLevy(wealth: Float64Array, target: number, rate: number): number {
  if (!Number.isSafeInteger(target) || target < 0 || target >= wealth.length) throw new RangeError('target is out of range');
  validateRate(rate);
  const revenue = wealth[target] * rate;
  wealth[target] -= revenue;
  redistributeEqually(wealth, revenue);
  return revenue;
}

export function applyFlatWealthLevy(wealth: Float64Array, rate: number, exemption = 0): number {
  validateRate(rate);
  if (!Number.isFinite(exemption) || exemption < 0) throw new RangeError('exemption must be non-negative');
  const liabilities = new Float64Array(wealth.length);
  for (let i = 0; i < wealth.length; i++) {
    liabilities[i] = Math.max(0, wealth[i] - exemption) * rate;
  }
  return collectLiabilities(wealth, liabilities);
}

export function applyProgressiveWealthLevy(wealth: Float64Array, brackets: readonly ProgressiveBracket[]): number {
  if (brackets.length === 0) throw new RangeError('brackets must not be empty');
  const sorted = [...brackets].sort((a, b) => a.above - b.above);
  for (let i = 0; i < sorted.length; i++) {
    validateRate(sorted[i].rate);
    if (!Number.isFinite(sorted[i].above) || sorted[i].above < 0 || (i > 0 && sorted[i].above === sorted[i - 1].above)) {
      throw new RangeError('bracket thresholds must be distinct and non-negative');
    }
  }

  const liabilities = new Float64Array(wealth.length);
  for (let i = 0; i < wealth.length; i++) {
    const original = wealth[i];
    let levy = 0;
    for (let j = 0; j < sorted.length; j++) {
      const lower = sorted[j].above;
      const upper = sorted[j + 1]?.above ?? Number.POSITIVE_INFINITY;
      levy += Math.max(0, Math.min(original, upper) - lower) * sorted[j].rate;
    }
    liabilities[i] = levy;
  }
  return collectLiabilities(wealth, liabilities);
}

function validateBudget(budget: number): void {
  if (!Number.isFinite(budget) || budget < 0) throw new RangeError('budget must be finite and non-negative');
}

export function applyTargetedWealthBudget(wealth: Float64Array, target: number, budget: number): number {
  if (!Number.isSafeInteger(target) || target < 0 || target >= wealth.length) throw new RangeError('target is out of range');
  validateBudget(budget);
  const liabilities = new Float64Array(wealth.length);
  liabilities[target] = wealth[target];
  return collectLiabilities(wealth, liabilities, budget);
}

export function applyFlatWealthBudget(wealth: Float64Array, budget: number, exemption = 0): number {
  validateBudget(budget);
  if (!Number.isFinite(exemption) || exemption < 0) throw new RangeError('exemption must be non-negative');
  const liabilities = new Float64Array(wealth.length);
  for (let i = 0; i < wealth.length; i++) liabilities[i] = Math.max(0, wealth[i] - exemption);
  return collectLiabilities(wealth, liabilities, budget);
}

export function applyProgressiveWealthBudget(
  wealth: Float64Array,
  budget: number,
  brackets: readonly ProgressiveBracket[],
): number {
  validateBudget(budget);
  if (brackets.length === 0) throw new RangeError('brackets must not be empty');
  const sorted = [...brackets].sort((a, b) => a.above - b.above);
  for (let i = 0; i < sorted.length; i++) {
    validateRate(sorted[i].rate);
    if (!Number.isFinite(sorted[i].above) || sorted[i].above < 0 || (i > 0 && sorted[i].above === sorted[i - 1].above)) {
      throw new RangeError('bracket thresholds must be distinct and non-negative');
    }
  }
  const liabilities = new Float64Array(wealth.length);
  for (let i = 0; i < wealth.length; i++) {
    for (let j = 0; j < sorted.length; j++) {
      const lower = sorted[j].above;
      const upper = sorted[j + 1]?.above ?? Number.POSITIVE_INFINITY;
      liabilities[i] += Math.max(0, Math.min(wealth[i], upper) - lower) * sorted[j].rate;
    }
  }
  return collectLiabilities(wealth, liabilities, budget);
}
