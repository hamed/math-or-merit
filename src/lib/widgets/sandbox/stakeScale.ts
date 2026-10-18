/** Shared horizontal scale for the outcome map and its stake cut. */
export type StakeScale = 'linear' | 'squared';

export const SQUARED_STAKE_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

export const plotStake = (stake: number, scale: StakeScale): number =>
  scale === 'squared' ? stake * stake : stake;

export const stakeAtFraction = (fraction: number, scale: StakeScale): number =>
  scale === 'squared' ? Math.sqrt(Math.max(0, fraction)) : fraction;
