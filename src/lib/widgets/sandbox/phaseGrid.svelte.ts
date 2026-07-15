/**
 * The phase record (owner review 2026-07-15): NOTHING is precomputed. Every
 * point on the map is a steady-state Gini the reader's own rooms measured —
 * the sandbox ticker watches a run settle (burn-in + stable tail), then
 * solidifies tail averages into this store. Points are keyed by the exact
 * dial values (the sliders already snap to round stops, so the grid is
 * unevenly spaced — fine) AND by room size n, because the settled Gini is a
 * finite-size quantity: mixing n would quietly lie.
 *
 * Persistence is localStorage (no server), with CSV export/import so a
 * returning reader — or two readers swapping files — can keep accumulating.
 */

export interface PhasePoint {
  stake: number;
  tax: number;
  n: number;
  gini: number;
  count: number;
}

interface Cell {
  sum: number;
  count: number;
}

const STORAGE_KEY = 'merit-or-math:phase-points:v1';

export const phaseData = $state<{ cells: Record<string, Cell>; version: number }>({
  cells: {},
  version: 0,
});

const keyOf = (stake: number, tax: number, n: number) => `${stake}|${tax}|${n}`;

let saveTimer: ReturnType<typeof setTimeout> | undefined;

function persist(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(phaseData.cells));
    } catch {
      // private mode or full quota: the session still works, it just forgets
    }
  }, 800);
}

export function loadPhaseData(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      phaseData.cells = JSON.parse(raw);
      phaseData.version++;
    }
  } catch {
    /* unreadable store: start fresh */
  }
}

/** One solidified tail-average from a settled run. */
export function addMeasurement(stake: number, tax: number, n: number, gini: number): void {
  if (!Number.isFinite(gini) || !Number.isFinite(stake) || !Number.isFinite(tax)) return;
  const key = keyOf(stake, tax, n);
  const cell = phaseData.cells[key] ?? { sum: 0, count: 0 };
  cell.sum += gini;
  cell.count += 1;
  phaseData.cells[key] = cell;
  phaseData.version++;
  persist();
}

export function clearPhaseData(): void {
  phaseData.cells = {};
  phaseData.version++;
  persist();
}

/** All measured points for one room size. */
export function pointsFor(n: number): PhasePoint[] {
  const out: PhasePoint[] = [];
  for (const [key, cell] of Object.entries(phaseData.cells)) {
    const [s, t, kn] = key.split('|').map(Number);
    if (kn !== n || cell.count === 0) continue;
    out.push({ stake: s, tax: t, n: kn, gini: cell.sum / cell.count, count: cell.count });
  }
  return out;
}

export interface PhaseCurve {
  /** The other dial's value this cut actually uses (nearest measured). */
  fixedUsed: number | null;
  points: { v: number; gini: number; count: number }[];
}

/** A cross-section through the measured points at (nearest) `fixed`. */
export function curveVs(axis: 'tax' | 'stake', fixed: number, n: number): PhaseCurve {
  const all = pointsFor(n);
  if (all.length === 0) return { fixedUsed: null, points: [] };
  // group by the OTHER dial, pick the measured group nearest to `fixed`
  const groups = new Map<number, PhasePoint[]>();
  for (const p of all) {
    const g = axis === 'tax' ? p.stake : p.tax;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(p);
  }
  let best: number | null = null;
  for (const g of groups.keys()) {
    if (best === null || Math.abs(g - fixed) < Math.abs(best - fixed)) best = g;
  }
  if (best === null || Math.abs(best - fixed) > 0.06) return { fixedUsed: null, points: [] };
  const points = groups
    .get(best)!
    .map((p) => ({ v: axis === 'tax' ? p.tax : p.stake, gini: p.gini, count: p.count }))
    .sort((a, b) => a.v - b.v);
  return { fixedUsed: best, points };
}

/** CSV round-trip: stake,tax,n,gini,count — mergeable between readers. */
export function exportCsv(): string {
  const lines = ['stake,tax,n,gini,count'];
  for (const [key, cell] of Object.entries(phaseData.cells)) {
    if (cell.count === 0) continue;
    const [s, t, n] = key.split('|');
    lines.push(`${s},${t},${n},${(cell.sum / cell.count).toPrecision(6)},${cell.count}`);
  }
  return lines.join('\n');
}

/** Merge a CSV (weighted by count). Returns rows accepted. */
export function importCsv(text: string): number {
  let accepted = 0;
  for (const line of text.split(/\r?\n/).slice(1)) {
    const [s, t, n, gini, count] = line.split(',').map(Number);
    if (![s, t, n, gini, count].every(Number.isFinite) || count <= 0) continue;
    const key = keyOf(s, t, n);
    const cell = phaseData.cells[key] ?? { sum: 0, count: 0 };
    cell.sum += gini * count;
    cell.count += count;
    phaseData.cells[key] = cell;
    accepted++;
  }
  if (accepted > 0) {
    phaseData.version++;
    persist();
  }
  return accepted;
}
