import { describe, expect, it } from 'vitest';
import { validateBeats, type BeatSpec } from './contract';
import * as CowCastScene from './scenes/CowCastScene.svelte';
import * as OpeningScene from './scenes/OpeningScene.svelte';
import * as PersonTradeScene from './scenes/PersonTradeScene.svelte';

const {
  BEATS: CAST_BEATS,
  FRAMES: CAST_FRAMES,
  STAGE_TEXT,
  TEXT_EXIT,
  TEXT_FADE,
  textLineOffset,
} = CowCastScene as unknown as {
  BEATS: readonly BeatSpec[];
  FRAMES: readonly { src: string; beat: string; offset?: number; until?: string }[];
  STAGE_TEXT: readonly { text: string; beat: string; until: string }[];
  TEXT_EXIT: number;
  TEXT_FADE: number;
  textLineOffset: (index: number) => number;
};

const {
  BEATS: OPENING_BEATS,
  SLOTS: REEL_SLOTS,
  LAND: REEL_LAND,
  OPENING_SECONDS,
} = OpeningScene as unknown as {
  BEATS: readonly BeatSpec[];
  SLOTS: readonly string[];
  LAND: number;
  OPENING_SECONDS: number;
};

const {
  BEATS: ROOM_BEATS,
  PLATES: ROOM_PLATES,
  ROUNDS,
  HOLDINGS,
  UNITS,
} = PersonTradeScene as unknown as {
  BEATS: readonly BeatSpec[];
  PLATES: readonly { src: string; beat: string }[];
  ROUNDS: readonly { winner: 'A' | 'B'; stake: number }[];
  HOLDINGS: readonly { a: number; b: number }[];
  UNITS: number;
};

/** Every scene's beat table, checked at data level (no DOM mounting). */
const SCENES: Record<string, readonly BeatSpec[]> = {
  CowCastScene: CAST_BEATS,
  OpeningScene: OPENING_BEATS,
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

  it('plays the four-panel silence as one ordered reader action', () => {
    const silent = CAST_FRAMES.filter((frame) => frame.beat === 'silence');
    expect(silent.map((frame) => frame.offset)).toEqual([0, 0.75, 1.5, 2.25]);
    expect(CAST_BEATS.filter((beat) => beat.label === 'silence')).toHaveLength(1);
  });

  it('every plate that leaves early leaves on a beat that exists', () => {
    for (const frame of CAST_FRAMES) {
      if (frame.until) expect(labels.has(frame.until), `no beat "${frame.until}"`).toBe(true);
    }
  });

  it('stage text lands on beats that exist, carries no plate, and leaves later', () => {
    const plated = new Set(CAST_FRAMES.map((f) => f.beat));
    const order = CAST_BEATS.map((b) => b.label);
    for (const line of STAGE_TEXT) {
      expect(labels.has(line.beat), `no beat "${line.beat}"`).toBe(true);
      expect(labels.has(line.until), `no beat "${line.until}"`).toBe(true);
      expect(plated.has(line.beat), `"${line.beat}" must stay empty`).toBe(false);
      expect(order.indexOf(line.until)).toBeGreaterThan(order.indexOf(line.beat));
    }
  });

  it('every stage-text line finishes arriving before its card leaves', () => {
    // The bug this pins: a three-line card in a 1.4-long beat put the third
    // line's fade-in at +1.05 and the card's exit at +1.15, so the last line
    // began leaving before it had arrived and simply never showed.
    const startOf = new Map<string, number>();
    let t = 0;
    for (const beat of CAST_BEATS) {
      startOf.set(beat.label, t);
      t += beat.length;
    }
    STAGE_TEXT.forEach((line, i) => {
      const arrived = startOf.get(line.beat)! + textLineOffset(i) + TEXT_FADE;
      const leaves = startOf.get(line.until)! - TEXT_EXIT;
      expect(arrived, `"${line.text}" is still arriving when its card leaves`).toBeLessThanOrEqual(leaves);
    });
  });

  it('leaves the last beat plateless so the moral holds the pitch', () => {
    const covered = new Set(CAST_FRAMES.map((f) => f.beat));
    expect(covered.has(CAST_BEATS[CAST_BEATS.length - 1].label)).toBe(false);
  });
});

describe('OpeningScene reel', () => {
  it('keeps the cinematic opening under fifteen seconds', () => {
    expect(OPENING_SECONDS).toBeGreaterThan(12);
    expect(OPENING_SECONDS).toBeLessThanOrEqual(15);
  });

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

describe('PersonTradeScene game', () => {
  it('starts the two of them equal', () => {
    expect(HOLDINGS[0].a).toBe(UNITS / 2);
    expect(HOLDINGS[0].b).toBe(UNITS / 2);
  });

  it('makes and destroys no money', () => {
    for (const h of HOLDINGS) expect(h.a + h.b).toBe(UNITS);
  });

  it('stakes half of what the poorer one has, in whole coins', () => {
    ROUNDS.forEach((round, r) => {
      const { a, b } = HOLDINGS[r];
      expect(round.stake).toBe(Math.floor(Math.min(a, b) / 2));
      expect(round.stake).toBeGreaterThan(0);
    });
  });

  it('has a beat trio for every round', () => {
    const labels = new Set(ROOM_BEATS.map((b) => b.label));
    ROUNDS.forEach((_, r) => {
      for (const stage of ['ante', 'toss', 'take']) {
        expect(labels.has(`${stage}-${r + 1}`), `no beat "${stage}-${r + 1}"`).toBe(true);
      }
    });
  });

  it('ends close enough to level to sell the illusion', () => {
    const last = HOLDINGS[HOLDINGS.length - 1];
    expect(Math.abs(last.a - last.b)).toBeLessThanOrEqual(UNITS / 4);
  });

  it('gives the first round to one of them and the rest to the other', () => {
    expect(ROUNDS[0].winner).not.toBe(ROUNDS[1].winner);
    expect(ROUNDS[1].winner).toBe(ROUNDS[2].winner);
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
