import { describe, expect, it } from 'vitest';
import { FEELINGS as FEELING_WORDS } from '../../../../script/grammar';
import { FEELINGS } from '../../../shared/face/moments';
import { BIG, CROWD, SMALL } from './crowd';
import { PAIR_STEPS } from './script';
import { StageFaces, type Body, type FaceScene } from './stageFaces';

const at = (x: number, y: number, r = 30): Body => ({ x, y, r, alpha: 1 });
// everyone in a line, Blue to the left of Red as on the stage
const people = Array.from({ length: CROWD }, (_, i) => (i === BIG ? at(300, 400) : i === SMALL ? at(700, 400) : at(100 + i * 110, 520)));
const scene = (over: Partial<FaceScene> = {}): FaceScene => ({
  depth: 300,
  people,
  room: null,
  mirror: null,
  speaker: null,
  aside: false,
  facing: false,
  coin: null,
  moving: [],
  chat: false,
  title: null,
  held: null,
  pointer: null,
  ...over,
});
const fresh = () => new StageFaces(CROWD, 100, BIG, SMALL);

describe('the pair’s faces', () => {
  it('feel every toss on a log scale: the winner glad, Blue angry rather than cowed when he loses, Red sad', () => {
    const tosses = PAIR_STEPS.map((_, i) => i).filter((i) => PAIR_STEPS[i].action === 'toss');
    expect(tosses.length).toBeGreaterThan(0);
    for (const t of tosses) {
      const faces = fresh();
      const f = faces.field;
      const before = PAIR_STEPS[t - 1].pose;
      const after = PAIR_STEPS[t].pose;
      for (const who of ['blue', 'red'] as const) f.react(faces.slotOf(who), before.holdings[who] + before.table[who], after.holdings[who]);
      const blueWon = after.flip === 'blue';
      expect(Math.sign(f.v[BIG] - f.v0[BIG])).toBe(blueWon ? 1 : -1);
      expect(Math.sign(f.v[SMALL] - f.v0[SMALL])).toBe(blueWon ? -1 : 1);
      if (!blueWon) expect(f.d[BIG]).toBeGreaterThan(0.5);
    }
  });

  it('look at whoever speaks; the speaker at the other one, or out at the reader for an aside', () => {
    const faces = fresh();
    const f = faces.field;
    faces.aim(scene({ speaker: 'blue', facing: true }), 0, 1 / 60);
    // Blue stands left of Red: each turns toward the other
    expect(people[BIG].x).toBeLessThan(people[SMALL].x);
    expect(f.aimYaw[BIG]).toBeGreaterThan(0);
    expect(f.aimYaw[SMALL]).toBeLessThan(0);
    expect(f.talking[BIG]).toBe(1);
    expect(f.talking[SMALL]).toBe(0);
    faces.aim(scene({ speaker: 'blue', aside: true, facing: true }), 1, 1 / 60);
    expect(f.aimYaw[BIG]).toBe(0);
    expect(f.aimPitch[BIG]).toBe(0);
  });

  it('watch the coin in the air, up and toward it', () => {
    const faces = fresh();
    const f = faces.field;
    const coin = { x: (people[BIG].x + people[SMALL].x) / 2, y: 200 };
    faces.aim(scene({ coin, facing: true }), 0, 1 / 60);
    expect(f.aimYaw[BIG]).toBeGreaterThan(0);
    expect(f.aimYaw[SMALL]).toBeLessThan(0);
    expect(f.aimPitch[BIG]).toBeLessThan(0);
  });

  it('turns the room toward a line each in their own time, some not at all, and back to themselves', () => {
    const faces = fresh();
    const room = Array.from({ length: 100 }, (_, j) => at(50 + (j % 10) * 70, 100 + Math.floor(j / 10) * 50, 15));
    const held = { who: 'red' as const, aside: false, since: 5 };
    const turnedAt = new Map<number, number>();
    const backAt = new Map<number, number>();
    for (let t = 5; t < 14; t += 0.05) {
      faces.aim(scene({ room, held }), t, 0.05);
      for (let j = 0; j < 100; j++)
        if (!Number.isNaN(faces.field.aimYaw[faces.roomSlot(j)])) {
          if (!turnedAt.has(j)) turnedAt.set(j, t - 5);
          backAt.set(j, t - 5);
        }
    }
    // most of them, some not at all
    expect(turnedAt.size).toBeGreaterThan(65);
    expect(turnedAt.size).toBeLessThan(95);
    // and not in step: they turn over a second or two, and turn back over several
    const spread = (m: Map<number, number>) => {
      const times = [...m.values()].sort((a, b) => a - b);
      return times[Math.floor(times.length * 0.9)] - times[Math.floor(times.length * 0.1)];
    };
    expect(spread(turnedAt)).toBeGreaterThan(1.2);
    expect(spread(backAt)).toBeGreaterThan(2.5);
  });

  it('lets a few in the room follow the reader’s pointer', () => {
    const faces = fresh();
    const room = Array.from({ length: 100 }, (_, j) => at(50 + (j % 10) * 70, 100 + Math.floor(j / 10) * 50, 15));
    faces.aim(scene({ room, pointer: { x: 2000, y: 300 } }), 0, 1 / 60);
    let following = 0;
    for (let j = 0; j < 100; j++) if (faces.field.aimYaw[faces.roomSlot(j)] > 0.3) following++;
    expect(following).toBeGreaterThan(1);
    expect(following).toBeLessThan(12);
  });

  it('holds the pair’s eyes on each other through a line, and an aside’s on the reader, coin or no coin', () => {
    const faces = fresh();
    const f = faces.field;
    // a line between them, its words long arrived: still on each other, every frame, no glance away
    for (let t = 0; t < 20; t += 0.1) {
      faces.aim(scene({ held: { who: 'blue', aside: false, since: 0 }, facing: true }), t, 0.1);
      expect(f.aimYaw[BIG]).toBeGreaterThan(0);
      expect(f.aimYaw[SMALL]).toBeLessThan(0);
    }
    // an aside: the speaker on the reader, even with the decider in the air; the other one on the speaker
    const coin = { x: 500, y: 100 };
    faces.aim(scene({ held: { who: 'red', aside: true, since: 0 }, coin, facing: true }), 21, 0.1);
    expect([f.aimYaw[SMALL], f.aimPitch[SMALL]]).toEqual([0, 0]);
  });

  it('has a face for every feeling word the script may write, and no other', () => {
    expect(Object.keys(FEELINGS).sort()).toEqual([...FEELING_WORDS].sort());
  });

  it('shows a line’s feeling on its speaker, and only theirs', () => {
    const faces = fresh();
    const f = faces.field;
    const v = f.v[SMALL];
    const d = f.d[BIG];
    faces.feel(SMALL, 'glad');
    faces.feel(BIG, 'sure');
    faces.feel(BIG, 'no such feeling');
    expect(f.v[SMALL]).toBeGreaterThan(v);
    expect(f.d[BIG]).toBeGreaterThan(d);
  });
});

describe('the opening’s crowd', () => {
  it('pairs up to chat: someone is always talking, and the talk changes hands', () => {
    const faces = fresh();
    const talkers = new Set<number>();
    let silent = 0;
    for (let t = 0; t < 20; t += 0.25) {
      faces.aim(scene({ chat: true }), t, 0.25);
      const now = [...faces.field.talking.slice(0, CROWD)].flatMap((on, i) => (on ? [i] : []));
      if (now.length === 0) silent++;
      now.forEach((i) => talkers.add(i));
    }
    expect(talkers.size).toBeGreaterThan(CROWD / 2);
    expect(silent).toBeLessThan(20);
  });

  it('looks up at the title’s new word each in their own time, and back to the chat after a while of their own', () => {
    const faces = fresh();
    const word = { x: 500, y: 100, since: 10, live: false };
    // up at the word, far above everyone: steeper than any look across at a partner
    const up = () => [...Array(CROWD).keys()].filter((i) => faces.field.aimPitch[i] < -0.7);
    const first = new Map<number, number>();
    for (let t = 10; t < 17; t += 0.05) {
      faces.aim(scene({ chat: true, title: word }), t, 0.05);
      for (const i of up()) if (!first.has(i)) first.set(i, t - 10);
    }
    expect(first.size).toBeGreaterThanOrEqual(CROWD / 2);
    const times = [...first.values()];
    expect(Math.min(...times)).toBeGreaterThanOrEqual(0.2);
    expect(Math.max(...times) - Math.min(...times)).toBeGreaterThan(0.3);
    expect(up()).toEqual([]);
    // the reel, while it spins, holds those who looked up
    const reel = { ...word, since: 30, live: true };
    for (let t = 30; t < 37; t += 0.05) faces.aim(scene({ chat: true, title: reel }), t, 0.05);
    expect(up().length).toBeGreaterThanOrEqual(CROWD / 2);
  });

  it('laughs in pairs: whoever laughs, their partner laughs with them', () => {
    const faces = fresh();
    let laughed = 0;
    for (let t = 0; t < 120; t += 0.1) {
      faces.aim(scene({ chat: true }), t, 0.1);
      const now = [...Array(CROWD).keys()].filter((i) => faces.laughing(i, t) >= 0);
      expect(now.length % 2).toBe(0);
      laughed += now.length;
    }
    expect(laughed).toBeGreaterThan(0);
  });
});
