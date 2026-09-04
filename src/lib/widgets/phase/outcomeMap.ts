export interface OutcomeRunCell {
  readonly ix: number;
  readonly iy: number;
}

export function hasMinimumRuns(counts: readonly (readonly number[])[], minimum: number): boolean {
  return counts.every((row) => row.every((count) => count >= minimum));
}

/** One entry is one independent room still needed to make the displayed field comparable. */
export function runsToMinimum(
  counts: readonly (readonly number[])[],
  minimum: number,
): OutcomeRunCell[] {
  const runs: OutcomeRunCell[] = [];
  for (let iy = 0; iy < counts.length; iy++) {
    for (let ix = 0; ix < counts[iy].length; ix++) {
      for (let count = counts[iy][ix]; count < minimum; count++) runs.push({ ix, iy });
    }
  }
  return runs;
}
