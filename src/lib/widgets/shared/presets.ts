/**
 * Presets shared across the essay's widgets. The pair stage keeps its own
 * run settings (`stage/scenes/pair/recording.ts` DEFAULT_RUN); these are what
 * the sandbox and the plots still read.
 */
import { FILLS, STROKES } from './agentStyle';

export const ROOM_N = 100;

/** Display currency: every agent starts with $100, so a room of 100 holds $10,000. */
export const START_DOLLARS = 100;

/** Below one cent an agent is displayed in the "≈ nothing" pile (log view). */
export const DUST_DOLLARS = 0.01;

/** Validated sequential terracotta ramp for Gini 0→1 (dataviz ordinal checks, light). */
export const GINI_RAMP = ['#d59b87', '#c78168', '#b7684c', '#a45032', '#8c3d20', '#702e16', '#54220f'] as const;

/** Blue → red, using the circle palette's stroke and fill colors. */
export const PHASE_RAMP = [STROKES.blue, FILLS.blue, '#f4efe4', FILLS.red, STROKES.red] as const;

export function rampColor(ramp: readonly string[], t: number): string {
  if (ramp.length === 0) throw new RangeError('color ramp must have at least one stop');
  if (ramp.length === 1) return ramp[0];

  const position = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0)) * (ramp.length - 1);
  const lower = Math.min(ramp.length - 2, Math.floor(position));
  const fraction = position - lower;
  const from = ramp[lower];
  const to = ramp[lower + 1];
  const channel = (offset: number): string => {
    const a = Number.parseInt(from.slice(offset, offset + 2), 16);
    const b = Number.parseInt(to.slice(offset, offset + 2), 16);
    return Math.round(a + (b - a) * fraction).toString(16).padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
