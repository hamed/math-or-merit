/**
 * One tick engine for every sandbox plot (owner review 2026-07-14):
 * - only the roundest numbers (1 / 2 / 2.5 / 5 × 10^k) — never data min/max;
 * - enough ticks that the scale (log vs linear) is apparent at a glance;
 * - labels are bare compact numbers; the UNIT lives in the axis label.
 */

const NICE_STEPS = [1, 2, 2.5, 5, 10];

/** Round-number ticks covering [lo, hi] with about `target` divisions. */
export function niceLinearTicks(lo: number, hi: number, target = 4): number[] {
  if (!(hi > lo)) return [lo];
  const rawStep = (hi - lo) / target;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  let step = mag * 10;
  for (const s of NICE_STEPS) {
    if (s * mag >= rawStep) {
      step = s * mag;
      break;
    }
  }
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi * (1 + 1e-9); v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12)));
  }
  return out;
}

/**
 * Log-axis ticks: decades (0.1, 1, 10, 100 …), thinned to `maxCount` by
 * skipping every other decade; below two decades of span, 1-2-5 mantissas.
 */
export function logTicks(lo: number, hi: number, maxCount = 6): number[] {
  if (!(lo > 0) || !(hi > lo)) return [lo];
  const eLo = Math.ceil(Math.log10(lo) - 1e-9);
  const eHi = Math.floor(Math.log10(hi) + 1e-9);
  if (eHi - eLo < 2) {
    // narrow span: 1-2-5 within the decades
    const out: number[] = [];
    for (let e = eLo - 1; e <= eHi + 1; e++) {
      for (const m of [1, 2, 5]) {
        const v = m * 10 ** e;
        if (v >= lo * (1 - 1e-9) && v <= hi * (1 + 1e-9)) out.push(Number(v.toPrecision(12)));
      }
    }
    return out;
  }
  const step = Math.max(1, Math.ceil((eHi - eLo + 1) / maxCount));
  const out: number[] = [];
  for (let e = eLo; e <= eHi; e += step) out.push(Number((10 ** e).toPrecision(12)));
  return out;
}

/**
 * Ticks for a geometric-binned axis. When the bin ratio is ~2 the edges ARE
 * the round base-2 numbers — label those (1, 2, 4, 8…, thinned to 1, 4, 16…
 * when crowded); the labels then teach the binning rule. Otherwise decades.
 */
export function logBinTicks(lo: number, hi: number, binCount: number, maxCount = 6): number[] {
  if (!(lo > 0) || !(hi > lo) || binCount < 1) return [lo];
  const ratio = (hi / lo) ** (1 / binCount);
  if (Math.abs(ratio - 2) / 2 < 0.12) {
    const out: number[] = [];
    const eLo = Math.ceil(Math.log2(lo) - 1e-9);
    const eHi = Math.floor(Math.log2(hi) + 1e-9);
    const step = Math.max(1, Math.ceil((eHi - eLo + 1) / maxCount));
    for (let e = eLo; e <= eHi; e += step) out.push(Number((2 ** e).toPrecision(12)));
    return out;
  }
  return logTicks(lo, hi, maxCount);
}

/** "0.001", "0.5", "250", "1k", "10k", "1e-5" — bare, unit-free, short. */
export function compactNumber(v: number): string {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e9) {
    // a broken economy reaches 1e300 — exponent form, never "1e294M"
    const e = Math.floor(Math.log10(abs));
    const m = Number((v / 10 ** e).toPrecision(2));
    return `${m === 1 ? '1' : m}e${e}`;
  }
  if (abs >= 1_000_000) return trim(v / 1_000_000) + 'M';
  if (abs >= 1_000) return trim(v / 1_000) + 'k';
  if (abs >= 1) return trim(v);
  if (abs >= 0.001) return String(Number(v.toPrecision(3)));
  // tinier: exponent form stays narrow on a crowded axis
  const e = Math.floor(Math.log10(abs));
  const m = Number((v / 10 ** e).toPrecision(3));
  return `${m === 1 ? '1' : m}e${e}`;
}

function trim(v: number): string {
  const r = Number(v.toPrecision(4));
  return Number.isInteger(r) ? String(r) : String(r);
}

/** Percent ticks as bare numbers: 0.5, 1, 25, 100 (of a 0–1 fraction). */
export function percentNumber(fraction: number): string {
  return compactNumber(Number((fraction * 100).toPrecision(12)));
}
