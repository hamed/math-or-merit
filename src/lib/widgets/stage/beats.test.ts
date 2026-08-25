import { describe, expect, it } from 'vitest';
import { validateBeats, type BeatSpec } from './contract';
import { BEATS as COW_BEATS } from './scenes/CowScene.svelte';
import { BEATS as CAST_BEATS, FRAMES as CAST_FRAMES } from './scenes/CowCastScene.svelte';
import { BEATS as OPENING_BEATS } from './scenes/OpeningScene.svelte';
import { BEATS as BELIEF_BEATS } from './scenes/BeliefCloudScene.svelte';
import { BEATS as PERSON_BEATS } from './scenes/PersonScene.svelte';
import { BEATS as TRADE_BEATS } from './scenes/TradeScene.svelte';
import { BEATS as CLOSING_BEATS } from './scenes/ClosingScene.svelte';

/** Every scene's beat table, checked at data level (no DOM mounting). */
const SCENES: Record<string, readonly BeatSpec[]> = {
  CowScene: COW_BEATS,
  CowCastScene: CAST_BEATS,
  OpeningScene: OPENING_BEATS,
  BeliefCloudScene: BELIEF_BEATS,
  PersonScene: PERSON_BEATS,
  TradeScene: TRADE_BEATS,
  ClosingScene: CLOSING_BEATS,
};

describe('scene beat tables', () => {
  for (const [name, beats] of Object.entries(SCENES)) {
    it(`${name} has unique labels and positive lengths`, () => {
      expect(beats.length).toBeGreaterThan(0);
      expect(validateBeats(beats)).toEqual([]);
    });
  }
});

describe('CowCastScene frames', () => {
  const labels = new Set(CAST_BEATS.map((b) => b.label));

  it('every plate lands on a beat that exists', () => {
    for (const frame of CAST_FRAMES) {
      expect(labels.has(frame.beat), `no beat "${frame.beat}"`).toBe(true);
    }
  });

  it('plates are in beat order', () => {
    const order = CAST_BEATS.map((b) => b.label);
    const positions = CAST_FRAMES.map((f) => order.indexOf(f.beat));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('every plate has a distinct source', () => {
    expect(new Set(CAST_FRAMES.map((f) => f.src)).size).toBe(CAST_FRAMES.length);
  });

  it('leaves the last beat plateless so the moral holds the pitch', () => {
    const covered = new Set(CAST_FRAMES.map((f) => f.beat));
    expect(covered.has(CAST_BEATS[CAST_BEATS.length - 1].label)).toBe(false);
  });
});

describe('validateBeats', () => {
  it('flags duplicates and non-positive lengths', () => {
    expect(validateBeats([
      { label: 'a', length: 1 },
      { label: 'a', length: 0 },
    ])).toHaveLength(2);
  });
});
