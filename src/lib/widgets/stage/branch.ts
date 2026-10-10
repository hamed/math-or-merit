/**
 * Optional branches (A4): the person who becomes a circle, and the whole old
 * machine ("All the dials", Scene 26). The dialogue opens them by name ("Show
 * me"); a collapsed branch on the page listens for its name. One event, no
 * knowledge of either side.
 */
export const BRANCH_EVENT = 'merit-or-math:branch';

export type BranchId = 'human' | 'workshop';

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
  /** Jump there even past holds the reader has not done: the index's "take me there". */
  readonly force?: boolean;
  /** Or the step by position, when the caller knows the script's order rather than the stage's names. */
  readonly index?: number;
}

export function goToStep(stage: string, step: string, force = false): void {
  window.dispatchEvent(new CustomEvent<StageStep>(STAGE_STEP_EVENT, { detail: { stage, step, force } }));
}

/** The index's jump: the stage's step at `index` (the script's own order), past any hold. */
export function goToIndex(stage: string, index: number): void {
  window.dispatchEvent(new CustomEvent<StageStep>(STAGE_STEP_EVENT, { detail: { stage, step: '', index, force: true } }));
}
