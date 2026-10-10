import { describe, expect, it } from 'vitest';
import { validateBeats, type BeatSpec } from './contract';
import * as PersonTradeScene from './scenes/PersonTradeScene.svelte';

const { BEATS: ROOM_BEATS, PLATES: ROOM_PLATES } = PersonTradeScene as unknown as {
  BEATS: readonly BeatSpec[];
  PLATES: readonly { src: string; beat: string }[];
};

/** Every scene's beat table, checked at data level (no DOM mounting). */
const SCENES: Record<string, readonly BeatSpec[]> = {
  PersonTradeScene: ROOM_BEATS,
};

describe('scene beat tables', () => {
  for (const [name, beats] of Object.entries(SCENES)) {
    it(`${name} has unique labels and positive lengths`, () => {
      expect(beats.length).toBeGreaterThan(0);
      expect(validateBeats(beats)).toEqual([]);
    });
  }
});

describe('PersonTradeScene plates', () => {
  const labels = new Set(ROOM_BEATS.map((b) => b.label));

  it('every plate lands on a beat that exists', () => {
    for (const plate of ROOM_PLATES) {
      expect(labels.has(plate.beat), `no beat "${plate.beat}"`).toBe(true);
    }
  });

  it('plates are in beat order', () => {
    const order = ROOM_BEATS.map((b) => b.label);
    const positions = ROOM_PLATES.map((p) => order.indexOf(p.beat));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('every plate has a distinct source', () => {
    expect(new Set(ROOM_PLATES.map((p) => p.src)).size).toBe(ROOM_PLATES.length);
  });

  it('ends on the circle beat, where the plates hand over to the circle', () => {
    expect(ROOM_PLATES[ROOM_PLATES.length - 1].beat).toBe('circle');
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
