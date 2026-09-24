// Keep a trackpad's inertial tail inside the authored action that claimed it.
export const WHEEL_GESTURE_REST_MS = 300;

/** A swipe shorter than this is a tap or a tremble, not a step. */
export const SWIPE_MIN_PX = 24;

/**
 * The reading keys, shared by every authored section so a reader learns them
 * once: forward is Space, Enter, → ↓ and Page Down; back is Shift+Space,
 * ← ↑, Page Up and Backspace.
 */
export function keyDirection(e: KeyboardEvent): -1 | 0 | 1 {
  if ((e.key === ' ' || e.key === 'Spacebar') && e.shiftKey) return -1;
  if ([' ', 'Spacebar', 'Enter', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) return 1;
  if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) return -1;
  return 0;
}

/** Space belongs to the focused control, not to the page. */
export function keyIsClaimed(el: Element | null): boolean {
  if (!el || el === document.body) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return true;
  if (el.getAttribute('role') === 'button') return true;
  return (el as HTMLElement).isContentEditable === true;
}
