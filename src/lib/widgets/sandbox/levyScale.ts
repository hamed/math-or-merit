import { percent } from '../shared/format';

/** Shared vertical scale for the sandbox outcome map and its tax cut. */
export const MAX_MAP_LEVY = 0.5;
export const LEVY_TICKS = [0, 0.02, 0.1, 0.25, MAX_MAP_LEVY] as const;
export const LINEAR_LEVY_TICKS = [0, 0.1, 0.2, 0.3, 0.4, MAX_MAP_LEVY] as const;
export type LevyScale = 'sqrt' | 'linear';

/** More room near zero; the signed extension keeps raw expert values finite. */
export const plotLevy = (levy: number, scale: LevyScale = 'sqrt'): number =>
  scale === 'linear' ? levy : Math.sign(levy) * Math.sqrt(Math.abs(levy));

/** Map a vertical fraction back to an actual tax rate. */
export const levyAtFraction = (fraction: number, scale: LevyScale): number =>
  MAX_MAP_LEVY * (scale === 'sqrt' ? fraction * fraction : fraction);

/** Keep small nonzero sampled levies distinct from the zero boundary in tooltips. */
export const sampledLevyPercent = (levy: number): string =>
  percent(levy, levy === 0 ? 0 : levy < 0.01 ? 3 : levy < 0.1 ? 2 : 1);
