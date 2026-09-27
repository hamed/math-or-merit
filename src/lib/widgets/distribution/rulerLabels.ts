/**
 * Labels for the distribution chapter's two rulers.
 *
 * The ordinary ruler and the multiplying one carry the SAME decade marks —
 * one cent, ten cents, a dollar, ten dollars … — so the reader can watch one
 * ruler turn into the other. On the ordinary ruler the small decades crowd
 * into the first few pixels and their labels cannot all fit; that unevenness
 * is the lesson, so the marks stay and only the labels that would collide are
 * faded out.
 */

export type LabelAnchor = 'start' | 'middle' | 'end';

export interface RulerLabel {
  readonly key: string;
  /** Anchor position in the chart's own units. */
  readonly x: number;
  readonly text: string;
  /** Lower wins when two labels want the same space. */
  readonly priority: number;
  readonly anchor: LabelAnchor;
}

/**
 * `floor`, `floor·10`, `floor·100` … up to `top`, inclusive.
 *
 * Built as `floor · 10^k` rather than by repeated multiplication, so a mark
 * does not drift off its decade after a few steps of float error.
 */
export function decadeEdges(floor: number, top: number): number[] {
  if (!(floor > 0) || !Number.isFinite(floor) || !Number.isFinite(top) || top < floor) return [];
  const steps = Math.floor(Math.log10(top / floor) + 1e-9);
  return Array.from({ length: steps + 1 }, (_, k) => floor * 10 ** k);
}

function extent(label: RulerLabel, charWidth: number): [number, number] {
  const width = label.text.length * charWidth;
  if (label.anchor === 'start') return [label.x, label.x + width];
  if (label.anchor === 'end') return [label.x - width, label.x];
  return [label.x - width / 2, label.x + width / 2];
}

/**
 * Which labels to show: greedily by priority, keeping each one only if it
 * clears every label already kept by at least `gap`.
 *
 * Text width is estimated from character count. That is deliberate — the
 * decision has to be the same on every run and every font fallback, and an
 * estimate that errs wide only ever hides a label that would have fitted.
 */
export function keepLabels(
  labels: readonly RulerLabel[],
  charWidth: number,
  gap: number,
): Set<string> {
  const kept: [number, number][] = [];
  const shown = new Set<string>();
  const byPriority = [...labels].sort((a, b) => a.priority - b.priority);
  for (const label of byPriority) {
    const [lo, hi] = extent(label, charWidth);
    const clear = kept.every(([keptLo, keptHi]) => hi + gap <= keptLo || lo >= keptHi + gap);
    if (!clear) continue;
    kept.push([lo, hi]);
    shown.add(label.key);
  }
  return shown;
}
