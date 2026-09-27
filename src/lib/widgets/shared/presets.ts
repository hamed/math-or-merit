/**
 * Presets shared across the essay's widgets. The pair stage keeps its own
 * run settings (`stage/scenes/pair/recording.ts` DEFAULT_RUN); these are what
 * the sandbox and the plots still read.
 */
export const ROOM_N = 100;

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
