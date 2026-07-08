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
