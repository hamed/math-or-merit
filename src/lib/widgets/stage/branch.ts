/**
 * Optional branches (A4): the cow, and the person who becomes a circle. The
 * dialogue opens them by name ("Tell me", "Show me"); a collapsed branch on the
 * page listens for its name. One event, no knowledge of either side.
 */
export const BRANCH_EVENT = 'merit-or-math:branch';

export type BranchId = 'cow' | 'human';

export function openBranch(id: BranchId): void {
  window.dispatchEvent(new CustomEvent<BranchId>(BRANCH_EVENT, { detail: id }));
}
