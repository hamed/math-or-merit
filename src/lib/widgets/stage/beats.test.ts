import { describe, expect, it } from 'vitest';
import { validateBeats, type BeatSpec } from './contract';
import { BEATS as CAST_BEATS, FRAMES as CAST_FRAMES, SILENCE } from './scenes/CowCastScene.svelte';
import { BEATS as OPENING_BEATS, SLOTS as REEL_SLOTS, LAND as REEL_LAND } from './scenes/OpeningScene.svelte';
import { BEATS as ROOM_BEATS, PLATES as ROOM_PLATES } from './scenes/PersonTradeScene.svelte';
import { BEATS as CLOSING_BEATS } from './scenes/ClosingScene.svelte';

/** Every scene's beat table, checked at data level (no DOM mounting). */
const SCENES: Record<string, readonly BeatSpec[]> = {
  CowCastScene: CAST_BEATS,
  OpeningScene: OPENING_BEATS,
  PersonTradeScene: ROOM_BEATS,
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

  it('every plate that leaves early leaves on a beat that exists', () => {
    for (const frame of CAST_FRAMES) {
      if (frame.until) expect(labels.has(frame.until), `no beat "${frame.until}"`).toBe(true);
    }
  });

  it('the silence lines land on beats that exist, and carry no plate', () => {
    const plated = new Set(CAST_FRAMES.map((f) => f.beat));
    for (const line of SILENCE) {
      expect(labels.has(line.beat), `no beat "${line.beat}"`).toBe(true);
      expect(plated.has(line.beat), `"${line.beat}" must stay empty`).toBe(false);
    }
  });

  it('leaves the last beat plateless so the moral holds the pitch', () => {
    const covered = new Set(CAST_FRAMES.map((f) => f.beat));
    expect(covered.has(CAST_BEATS[CAST_BEATS.length - 1].label)).toBe(false);
  });
});

describe('OpeningScene reel', () => {
  it('lands on Math', () => {
    expect(REEL_SLOTS[REEL_LAND]).toBe('Math');
  });

  it('keeps a symbol behind Math so the overshoot never shows empty page', () => {
    expect(REEL_LAND).toBeLessThan(REEL_SLOTS.length - 1);
  });

  it('never spins Merit — it is already on the line above', () => {
    expect(REEL_SLOTS).not.toContain('Merit');
  });

  it('has room to blur: the spin passes many symbols before it lands', () => {
    expect(REEL_LAND).toBeGreaterThan(12);
  });
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
