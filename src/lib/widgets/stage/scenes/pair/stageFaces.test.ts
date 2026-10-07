import { describe, expect, it } from 'vitest';
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

  it('turns most of the room toward whoever speaks, and leaves some to themselves', () => {
    const faces = fresh();
    const room = Array.from({ length: 100 }, (_, j) => at(50 + (j % 10) * 70, 100 + Math.floor(j / 10) * 50, 15));
    faces.aim(scene({ room, speaker: 'red' }), 0, 1 / 60);
    let turned = 0;
    for (let j = 0; j < 100; j++) if (!Number.isNaN(faces.field.aimYaw[faces.roomSlot(j)])) turned++;
    expect(turned).toBeGreaterThan(55);
    expect(turned).toBeLessThan(95);
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
});
