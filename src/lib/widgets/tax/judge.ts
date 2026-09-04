/** Advance real elapsed time below the participation line; any recovery resets it. */
export function nextClosureDuration(
  previousMs: number,
  effectiveParticipants: number,
  elapsedMs: number,
  minimum = 20,
): number {
  return effectiveParticipants < minimum ? previousMs + Math.max(0, elapsedMs) : 0;
}
