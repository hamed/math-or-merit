import type { OutcomeMapMetric } from './phaseGrid.svelte';

/** Participation uses room-specific endpoints; Gini keeps its standard value. */
export function plottedOutcome(metric: OutcomeMapMetric, value: number, n: number): number {
  if (!Number.isFinite(value) || !Number.isSafeInteger(n) || n < 2) return NaN;
  const plotted = metric === 'gini' ? value : (value - 1) / (n - 1);
  return Math.max(0, Math.min(1, plotted));
}

export function outcomeReading(metric: OutcomeMapMetric, value: number, n: number): string {
  const plotted = plottedOutcome(metric, value, n);
  return metric === 'gini'
    ? String(Number(plotted.toFixed(3)))
    : `${Number((plotted * 100).toFixed(1))}%`;
}
