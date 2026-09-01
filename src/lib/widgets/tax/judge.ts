/**
 * Pure game judge: participation has closed once the effective count stays
 * below `minimum` for the last `sustain` consecutive samples.
 */
export function judgeGame(effectiveCounts: readonly number[], minimum = 20, sustain = 180): boolean {
  if (effectiveCounts.length < sustain) return false;
  for (let i = effectiveCounts.length - sustain; i < effectiveCounts.length; i++) {
    if (effectiveCounts[i] >= minimum) return false;
  }
  return true;
}
