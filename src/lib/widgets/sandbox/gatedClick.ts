/**
 * Single-click actions must not fire on the way into a double-click (zoom).
 * Wraps a handler: runs it only if no second click lands within the gate.
 */
export type ActivationEvent = MouseEvent | KeyboardEvent;

export function gatedClick(
  handler: (event: ActivationEvent) => void,
  delayMs = 280,
): (event: ActivationEvent) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (event) => {
    if (event instanceof KeyboardEvent) {
      clearTimeout(timer);
      handler(event);
      return;
    }
    clearTimeout(timer);
    if (event.detail > 1) return; // second click of a double-click
    timer = setTimeout(() => handler(event), delayMs);
  };
}
