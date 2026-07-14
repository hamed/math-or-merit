/**
 * Single-click actions must not fire on the way into a double-click (zoom).
 * Wraps a handler: runs it only if no second click lands within the gate.
 */
export function gatedClick<E extends MouseEvent>(handler: (event: E) => void, delayMs = 280): (event: E) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (event: E) => {
    clearTimeout(timer);
    if (event.detail > 1) return; // second click of a double-click
    timer = setTimeout(() => handler(event), delayMs);
  };
}
