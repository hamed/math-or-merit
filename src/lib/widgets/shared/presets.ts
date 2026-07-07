/**
 * The one pre-tuned preset shared by every widget in the essay, chosen so the
 * narrated promises hold numerically (seed scans recorded in the build notes):
 *
 * - `beta = 0.2` keeps the scripted "wins it, loses it straight back" beat
 *   visually even — win-then-lose-back leaves a pair at 1.04 / 0.96 of start,
 *   a radius difference of 2%, invisible at circle scale;
 * - 100,000 trades at N = 100 reliably produces one dominant circle
 *   (median top share ≈ 45%, effective participants ≈ 4);
 * - seed 332 is the curated fallback room (top share 71%, runner-up 8.8%),
 *   used by the distribution stages when the reader hasn't run a room;
 * - seed 501's winner is agent 48 — a red pentagon with a teal edge under the
 *   agentStyle table (the essay's winner prose names it; guarded by test).
 *   Styles are display-only and never enter the simulation (agentStyle.ts).
 */
export const ROOM_N = 100;
export const ROOM_BETA = 0.2;
export const REVEAL_TRADES = 100_000;
export const REVEAL_SEED = 332;
export const WINNER_FIRST_SEED = 501;
export const WINNER_RERUN_SEED = 521;

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
