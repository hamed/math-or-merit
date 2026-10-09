/**
 * The story as the essay's side trips read it (script/branches/, ADR-019).
 *
 * A side trip is a scroll scene: the plates are the owner's drawings, and where
 * each caption falls on them is choreography — code, not script. The words,
 * who says them, and the choices at the end come from the script.
 */
import { STORY } from './story.gen';
import type { StoryChoice } from '../script/compile';

/** Where each of a side trip's captions (the author's lines, in order) falls, by beat of its scene. */
export const CAPTION_BEATS: Readonly<Record<string, readonly number[]>> = {
  human: [1],
};

export interface SideTrip {
  /** The author's lines, in order: the captions over the plates. */
  readonly captions: readonly { readonly key: string; readonly beat: number }[];
  /** The characters' lines after the plates. */
  readonly lines: readonly { readonly who: 'blue' | 'red'; readonly key: string }[];
  readonly choices: readonly StoryChoice[];
}

export function sideTrip(label: string): SideTrip {
  const steps = STORY.branches[label] ?? [];
  const beats = CAPTION_BEATS[label] ?? [];
  const captions = steps.filter((s) => s.who === 'author' && s.key).map((s, i) => ({ key: s.key!, beat: beats[i] ?? beats[beats.length - 1] ?? 0 }));
  const lines = steps.filter((s) => (s.who === 'blue' || s.who === 'red') && s.key).map((s) => ({ who: s.who as 'blue' | 'red', key: s.key! }));
  return { captions, lines, choices: steps.flatMap((s) => s.choices) };
}

/** The side trips a choice can open, by label. */
export const SIDE_TRIPS: readonly string[] = Object.keys(STORY.branches);
