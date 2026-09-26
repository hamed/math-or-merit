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

/**
 * The way back from a branch into a stage, at a named step ("Skip" at the end
 * of the cow returns to the guess). One event; the stage that has that name
 * answers it. It never skips a hold the reader has not done.
 */
export const STAGE_STEP_EVENT = 'merit-or-math:stage-step';

export interface StageStep {
  readonly stage: string;
  readonly step: string;
}

export function goToStep(stage: string, step: string): void {
  window.dispatchEvent(new CustomEvent<StageStep>(STAGE_STEP_EVENT, { detail: { stage, step } }));
}
