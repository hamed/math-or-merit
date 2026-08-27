/**
 * Pure game judge: the reader has lost once the top share has stayed above
 * `threshold` for the last `sustain` consecutive samples. Sampled once per
 * frame by the widget; unit-testable on synthetic histories.
 */
export function judgeGame(topShares: readonly number[], threshold = 0.35, sustain = 180): boolean {
  if (topShares.length < sustain) return false;
  for (let i = topShares.length - sustain; i < topShares.length; i++) {
    if (topShares[i] <= threshold) return false;
  }
  return true;
}
