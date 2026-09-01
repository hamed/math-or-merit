/** Versioned independent outcome evidence shared by the guided map and sandbox views. */
import {
  OUTCOME_PROTOCOL_VERSION,
  type ExperimentProtocol,
  type OutcomeMeasurement,
  type OutcomeMetric,
} from '$lib/research';

export interface MetricAggregate {
  sum: number;
  count: number;
}

interface StoredProtocol {
  version: number;
  n: number;
  tradesPerRound: number;
  levyEveryRounds: number;
  trades: number;
  burnIn: number;
  tailSamples: number;
}

export interface OutcomeCell {
  protocol: StoredProtocol;
  stake: number;
  tax: number;
  metrics: Partial<Record<OutcomeMetric, MetricAggregate>>;
}

export interface PhasePoint {
  stake: number;
  tax: number;
  n: number;
  gini: number;
  count: number;
  protocolVersion: number;
}

export type OutcomeMapMetric = 'gini' | 'effectiveParticipants';

export interface OutcomePoint {
  stake: number;
  tax: number;
  n: number;
  metric: OutcomeMapMetric;
  value: number;
  count: number;
  protocolVersion: number;
}

const METRICS: readonly OutcomeMetric[] = [
  'gini',
  'topShare',
  'effectiveParticipants',
  'wealthTurnover',
  'levyFlow',
];
const STORAGE_KEY = 'merit-or-math:outcome-points:v2';
const LEGACY_STORAGE_KEY = 'merit-or-math:phase-points:v1';

export const phaseData = $state<{ cells: Record<string, OutcomeCell>; version: number }>({
  cells: {},
  version: 0,
});

export function outcomeProtocolFor(n: number): ExperimentProtocol {
  return Object.freeze({
    version: OUTCOME_PROTOCOL_VERSION,
    n,
    tradesPerRound: n,
    levyEveryRounds: 1,
    trades: n * 2_000,
    burnIn: n * 1_200,
    tailSamples: 8,
  });
}

function legacyProtocol(n: number): StoredProtocol {
  return { version: 1, n, tradesPerRound: n, levyEveryRounds: 1, trades: 0, burnIn: 0, tailSamples: 0 };
}

export function protocolKey(protocol: StoredProtocol): string {
  return [
    protocol.version,
    protocol.n,
    protocol.tradesPerRound,
    protocol.levyEveryRounds,
    protocol.trades,
    protocol.burnIn,
    protocol.tailSamples,
  ].join('|');
}

function cellKey(protocol: StoredProtocol, stake: number, tax: number): string {
  return `${protocolKey(protocol)}|${stake}|${tax}`;
}

function isProtocol(value: unknown): value is StoredProtocol {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const p = value as Partial<StoredProtocol>;
  if (![p.version, p.n, p.tradesPerRound, p.levyEveryRounds, p.trades, p.burnIn, p.tailSamples]
    .every(Number.isSafeInteger)) return false;
  if (p.version !== 1 && p.version !== OUTCOME_PROTOCOL_VERSION) return false;
  if (p.n! < 2 || p.tradesPerRound! < 1 || p.levyEveryRounds! < 1) return false;
  if (p.version === 1) return p.trades === 0 && p.burnIn === 0 && p.tailSamples === 0;
  if (!(p.trades! > p.burnIn!) || p.burnIn! < 0 || p.tailSamples! < 1) return false;
  if (p.trades! % p.tradesPerRound! !== 0 || p.burnIn! % p.tradesPerRound! !== 0) return false;
  const tailTrades = p.trades! - p.burnIn!;
  return tailTrades % p.tailSamples! === 0
    && (tailTrades / p.tailSamples!) % p.tradesPerRound! === 0;
}

function isAggregate(value: unknown): value is MetricAggregate {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const a = value as Partial<MetricAggregate>;
  return Number.isFinite(a.sum) && Number.isSafeInteger(a.count) && a.count! > 0;
}

function decodedCell(value: unknown): OutcomeCell | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const c = value as Partial<OutcomeCell>;
  const { protocol, stake, tax } = c;
  if (!isProtocol(protocol) || typeof stake !== 'number' || !Number.isFinite(stake)
    || typeof tax !== 'number' || !Number.isFinite(tax)) return null;
  if (typeof c.metrics !== 'object' || c.metrics === null || Array.isArray(c.metrics)) return null;
  const metrics: Partial<Record<OutcomeMetric, MetricAggregate>> = {};
  for (const metric of METRICS) {
    const aggregate = c.metrics[metric];
    if (isAggregate(aggregate)) metrics[metric] = { ...aggregate };
  }
  if (Object.keys(metrics).length === 0) return null;
  return { protocol: { ...protocol }, stake, tax, metrics };
}

export function decodeOutcomeStore(raw: string): Record<string, OutcomeCell> {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  const state = parsed as { schemaVersion?: unknown; cells?: unknown };
  if (state.schemaVersion !== 2 || typeof state.cells !== 'object' || state.cells === null || Array.isArray(state.cells)) {
    return {};
  }
  const cells: Record<string, OutcomeCell> = {};
  for (const value of Object.values(state.cells)) {
    const cell = decodedCell(value);
    if (cell) cells[cellKey(cell.protocol, cell.stake, cell.tax)] = cell;
  }
  return cells;
}

interface LegacyCell {
  sum: number;
  count: number;
}

export function decodeLegacyPhaseCells(raw: string): Record<string, LegacyCell> {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  const cells: Record<string, LegacyCell> = {};
  for (const [key, value] of Object.entries(parsed)) {
    const parts = key.split('|').map(Number);
    if (parts.length !== 3 || !parts.every(Number.isFinite)) continue;
    const [, , n] = parts;
    if (!Number.isSafeInteger(n) || n < 2 || !isAggregate(value)) continue;
    cells[key] = { sum: value.sum, count: value.count };
  }
  return cells;
}

export function migrateLegacyPhaseCells(legacy: Record<string, LegacyCell>): Record<string, OutcomeCell> {
  const cells: Record<string, OutcomeCell> = {};
  for (const [key, aggregate] of Object.entries(legacy)) {
    const [stake, tax, n] = key.split('|').map(Number);
    const protocol = legacyProtocol(n);
    const cell: OutcomeCell = {
      protocol,
      stake,
      tax,
      metrics: { gini: { ...aggregate } },
    };
    cells[cellKey(protocol, stake, tax)] = cell;
  }
  return cells;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

function persist(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, cells: phaseData.cells }));
    } catch {
      // Private mode, tests, or full quota: session state remains useful.
    }
  }, 800);
}

export function loadPhaseData(): void {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const migrated = legacy ? migrateLegacyPhaseCells(decodeLegacyPhaseCells(legacy)) : {};
    phaseData.cells = {
      ...migrated,
      ...(current ? decodeOutcomeStore(current) : {}),
      ...phaseData.cells,
    };
    if (legacy) {
      persist();
    }
    phaseData.version++;
  } catch {
    // Unreadable storage starts fresh without breaking the sandbox.
  }
}

function mergeAggregate(cell: OutcomeCell, metric: OutcomeMetric, sum: number, count: number): void {
  const aggregate = cell.metrics[metric] ?? { sum: 0, count: 0 };
  aggregate.sum += sum;
  aggregate.count += count;
  cell.metrics[metric] = aggregate;
}

/** One call represents one independent seeded room. */
export function addOutcome(
  protocol: ExperimentProtocol,
  stake: number,
  tax: number,
  outcome: Partial<OutcomeMeasurement>,
): boolean {
  if (!isProtocol(protocol) || !Number.isFinite(stake) || !Number.isFinite(tax)) return false;
  const key = cellKey(protocol, stake, tax);
  const cell = phaseData.cells[key] ?? { protocol: { ...protocol }, stake, tax, metrics: {} };
  let accepted = false;
  for (const metric of METRICS) {
    const value = outcome[metric];
    if (!Number.isFinite(value)) continue;
    mergeAggregate(cell, metric, value!, 1);
    accepted = true;
  }
  if (!accepted) return false;
  phaseData.cells[key] = cell;
  phaseData.version++;
  persist();
  return true;
}

export function clearPhaseData(): void {
  phaseData.cells = {};
  phaseData.version++;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // In-memory clearing still works when storage is unavailable.
  }
  persist();
}

/** Current protocol points for one reader-facing metric, plus valid legacy Gini. */
export function metricPointsFor(
  n: number,
  metric: OutcomeMapMetric,
  protocol: ExperimentProtocol = outcomeProtocolFor(n),
): OutcomePoint[] {
  const currentKey = protocolKey(protocol);
  const current = new Map<string, OutcomePoint>();
  const legacy = new Map<string, OutcomePoint>();
  for (const cell of Object.values(phaseData.cells)) {
    if (cell.protocol.n !== n) continue;
    const aggregate = cell.metrics[metric];
    if (!aggregate) continue;
    const point: OutcomePoint = {
      stake: cell.stake,
      tax: cell.tax,
      n,
      metric,
      value: aggregate.sum / aggregate.count,
      count: aggregate.count,
      protocolVersion: cell.protocol.version,
    };
    const setting = `${cell.stake}|${cell.tax}`;
    if (protocolKey(cell.protocol) === currentKey) current.set(setting, point);
    else if (metric === 'gini' && cell.protocol.version === 1) legacy.set(setting, point);
  }
  for (const [setting, point] of legacy) if (!current.has(setting)) current.set(setting, point);
  return [...current.values()];
}

/** Current protocol points plus legacy Gini where no current point replaces it. */
export function pointsFor(n: number, protocol: ExperimentProtocol = outcomeProtocolFor(n)): PhasePoint[] {
  return metricPointsFor(n, 'gini', protocol).map((point) => ({
    stake: point.stake,
    tax: point.tax,
    n: point.n,
    gini: point.value,
    count: point.count,
    protocolVersion: point.protocolVersion,
  }));
}

export interface PhaseCurve {
  fixedUsed: number | null;
  points: { v: number; gini: number; count: number }[];
}

export function curveVs(
  axis: 'tax' | 'stake',
  fixed: number,
  n: number,
  protocol: ExperimentProtocol = outcomeProtocolFor(n),
): PhaseCurve {
  const cut = curveVsMetric(axis, fixed, n, 'gini', protocol);
  return {
    fixedUsed: cut.fixedUsed,
    points: cut.points.map((point) => ({ v: point.v, gini: point.value, count: point.count })),
  };
}

export interface OutcomeCurve {
  fixedUsed: number | null;
  metric: OutcomeMapMetric;
  points: { v: number; value: number; count: number }[];
}

export function curveVsMetric(
  axis: 'tax' | 'stake',
  fixed: number,
  n: number,
  metric: OutcomeMapMetric,
  protocol: ExperimentProtocol = outcomeProtocolFor(n),
): OutcomeCurve {
  const all = metricPointsFor(n, metric, protocol);
  if (all.length === 0) return { fixedUsed: null, metric, points: [] };
  const groups = new Map<number, OutcomePoint[]>();
  for (const point of all) {
    const group = axis === 'tax' ? point.stake : point.tax;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(point);
  }
  let best: number | null = null;
  for (const group of groups.keys()) {
    if (best === null || Math.abs(group - fixed) < Math.abs(best - fixed)) best = group;
  }
  if (best === null || Math.abs(best - fixed) > 0.06) return { fixedUsed: null, metric, points: [] };
  const points = groups.get(best)!
    .map((point) => ({ v: axis === 'tax' ? point.tax : point.stake, value: point.value, count: point.count }))
    .sort((a, b) => a.v - b.v);
  return { fixedUsed: best, metric, points };
}

export function exportCsv(): string {
  const lines = [
    'schema,protocolVersion,n,tradesPerRound,levyEveryRounds,trades,burnIn,tailSamples,stake,tax,metric,mean,count',
  ];
  for (const cell of Object.values(phaseData.cells)) {
    for (const metric of METRICS) {
      const aggregate = cell.metrics[metric];
      if (!aggregate) continue;
      const p = cell.protocol;
      lines.push([
        2, p.version, p.n, p.tradesPerRound, p.levyEveryRounds, p.trades, p.burnIn,
        p.tailSamples, cell.stake, cell.tax, metric,
        (aggregate.sum / aggregate.count).toPrecision(12), aggregate.count,
      ].join(','));
    }
  }
  return lines.join('\n');
}

function importLegacyCsv(lines: readonly string[]): number {
  let accepted = 0;
  for (const line of lines.slice(1)) {
    const [stake, tax, n, mean, count] = line.split(',').map(Number);
    if (![stake, tax, mean].every(Number.isFinite)) continue;
    if (!Number.isSafeInteger(n) || n < 2 || !Number.isSafeInteger(count) || count <= 0) continue;
    const protocol = legacyProtocol(n);
    const key = cellKey(protocol, stake, tax);
    const cell = phaseData.cells[key] ?? { protocol, stake, tax, metrics: {} };
    mergeAggregate(cell, 'gini', mean * count, count);
    phaseData.cells[key] = cell;
    accepted++;
  }
  return accepted;
}

export function importCsv(text: string): number {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines[0] === 'stake,tax,n,gini,count') {
    const accepted = importLegacyCsv(lines);
    if (accepted > 0) { phaseData.version++; persist(); }
    return accepted;
  }
  let accepted = 0;
  for (const line of lines.slice(1)) {
    const fields = line.split(',');
    if (fields.length !== 13 || fields[0] !== '2') continue;
    const protocol: StoredProtocol = {
      version: Number(fields[1]),
      n: Number(fields[2]),
      tradesPerRound: Number(fields[3]),
      levyEveryRounds: Number(fields[4]),
      trades: Number(fields[5]),
      burnIn: Number(fields[6]),
      tailSamples: Number(fields[7]),
    };
    const stake = Number(fields[8]);
    const tax = Number(fields[9]);
    const metric = fields[10] as OutcomeMetric;
    const mean = Number(fields[11]);
    const count = Number(fields[12]);
    if (!isProtocol(protocol) || !METRICS.includes(metric)) continue;
    if (![stake, tax, mean].every(Number.isFinite) || !Number.isSafeInteger(count) || count <= 0) continue;
    const key = cellKey(protocol, stake, tax);
    const cell = phaseData.cells[key] ?? { protocol, stake, tax, metrics: {} };
    mergeAggregate(cell, metric, mean * count, count);
    phaseData.cells[key] = cell;
    accepted++;
  }
  if (accepted > 0) { phaseData.version++; persist(); }
  return accepted;
}
