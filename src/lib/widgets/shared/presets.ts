/**
 * The pre-tuned presets shared by every widget in the essay, chosen so the
 * narrated promises hold numerically (seed scans recorded in the build notes):
 *
 * - `ROOM_BETA = 0.2` is the room default (game, crowd, stake dial baseline);
 * - `REVEAL_BETA = 0.35` is the first dramatic run's aggressive stake (owner
 *   review 2026-07-08: "one huge one in a shorter time"). Calibrated over 120
 *   unseeded runs at 100k trades, N = 100: median top share 75%, p5 47%,
 *   p95 93%, min 40% — so the essay's claim stays distributional ("in most
 *   runs, more than half");
 * - seed 332 is the curated fallback room at ROOM_BETA (top share 71%,
 *   runner-up 8.8%), used by the distribution stages when the reader hasn't
 *   run a room. Styles are display-only and never enter the simulation
 *   (agentStyle.ts).
 */
export const ROOM_N = 100;
export const ROOM_BETA = 0.2;
export const REVEAL_BETA = 0.35;
export const REVEAL_TRADES = 100_000;
export const REVEAL_SEED = 332;

/** The larger seeded population of beat 16. 2M trades gives the wall + tail. */
export const CROWD_N = 1000;
export const CROWD_BETA = 0.2;
export const CROWD_SEED = 77;
export const CROWD_TRADES = 2_000_000;

/**
 * The crowd starts richer per head ($10k) so the display spans more orders of
 * magnitude — from the 1¢ dust floor to a multi-million-dollar winner
 * (storyboard p9: "covers more orders of magnitude").
 */
export const CROWD_START_DOLLARS = 10_000;

/** Display currency: every agent starts with $100, so a room of 100 holds $10,000. */
export const START_DOLLARS = 100;

/** Below one cent an agent is displayed in the "≈ nothing" pile (log view). */
export const DUST_DOLLARS = 0.01;

/** Validated sequential terracotta ramp for Gini 0→1 (dataviz ordinal checks, light). */
export const GINI_RAMP = ['#d59b87', '#c78168', '#b7684c', '#a45032', '#8c3d20', '#702e16', '#54220f'] as const;

/**
 * Colormaps for the phase map (a click on the color scale cycles them): the
 * house terracotta first, then the standard academic heatmaps — viridis,
 * plasma, inferno (owner review 2026-07-14).
 */
export const PHASE_RAMPS: readonly (readonly string[])[] = [
  GINI_RAMP,
  ['#2166ac', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b'], // RdBu diverging: 0.5 is unmistakable
  ['#440154', '#443983', '#31688e', '#21918c', '#35b779', '#90d743', '#fde725'], // viridis
  ['#0d0887', '#5c01a6', '#9c179e', '#cc4778', '#ed7953', '#fdb42f', '#f0f921'], // plasma
  ['#000004', '#320a5e', '#781c6d', '#bc3754', '#ed6925', '#fbb61a', '#fcffa4'], // inferno
];

export function rampColor(ramp: readonly string[], t: number): string {
  return ramp[Math.min(ramp.length - 1, Math.max(0, Math.floor(t * ramp.length)))];
}

export function giniRampColor(gini: number): string {
  return rampColor(GINI_RAMP, gini);
}
