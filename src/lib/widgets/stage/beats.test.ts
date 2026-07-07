import { describe, expect, it } from 'vitest';
import { validateBeats, type BeatSpec } from './contract';
import { BEATS as COW_BEATS } from './scenes/CowScene.svelte';

/** Every scene's beat table, checked at data level (no DOM mounting). */
const SCENES: Record<string, readonly BeatSpec[]> = {
  CowScene: COW_BEATS,
};

describe('scene beat tables', () => {
  for (const [name, beats] of Object.entries(SCENES)) {
    it(`${name} has unique labels and positive lengths`, () => {
      expect(beats.length).toBeGreaterThan(0);
      expect(validateBeats(beats)).toEqual([]);
    });
  }
});

describe('validateBeats', () => {
  it('flags duplicates and non-positive lengths', () => {
    expect(validateBeats([
      { label: 'a', length: 1 },
      { label: 'a', length: 0 },
    ])).toHaveLength(2);
  });
});
