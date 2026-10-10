import { describe, expect, it } from 'vitest';
import { FacePainter, drawStill } from './draw';
import { EXPRESSION_RANGE, LOOKS, NEUTRAL, blinkAt, boundPose, faceGeometry, faceRadius, tempoOf, type Expression, type FacePose } from './face';
import { FaceField, felt } from './field';
import { BLUE, CONTEMPT, RED, express, marksOf, stillOf, temperament, type Affect } from './moments';

const grid = [-1, -0.5, 0, 0.5, 1];

describe('the render boundary', () => {
  it('holds any pose inside what can be drawn', () => {
    const wild = { browLift: 9, browSlope: -9, eyeOpening: NaN, cheekLift: -3, mouthCurve: Infinity, mouthOpening: 2, smirk: -7 };
    const p = boundPose({ expression: wild, gaze: { yaw: 5, pitch: -5 }, blink: 3, pupil: 0 });
    for (const [k, [lo, hi]] of Object.entries(EXPRESSION_RANGE)) {
      const v = p.expression[k as keyof Expression];
      expect(v).toBeGreaterThanOrEqual(lo);
      expect(v).toBeLessThanOrEqual(hi);
    }
    expect(p.gaze).toEqual({ yaw: 1, pitch: -1 });
    expect(p.blink).toBe(1);
    expect(p.pupil).toBe(0.6);
  });

  it('draws a mouth with width and lids inside the eye for every bounded expression', () => {
    for (const curve of grid)
      for (const opening of [0, 0.5, 1])
        for (const eye of grid) {
          const x = boundPose({ expression: { ...NEUTRAL, mouthCurve: curve, mouthOpening: opening, eyeOpening: eye, cheekLift: 1 } }).expression;
          const g = faceGeometry(x);
          expect(g.mouthHalf).toBeGreaterThan(0.1);
          expect(g.upperLid).toBeGreaterThanOrEqual(0);
          expect(g.upperLid).toBeLessThanOrEqual(1);
        }
  });
});

describe('size laws', () => {
  it('gives an equal share its normal face, and never a face bigger than the body', () => {
    expect(faceRadius(20, 20)).toBe(20);
    for (const r of [0.5, 3, 10, 20, 40, 200]) expect(faceRadius(r, 20)).toBeLessThanOrEqual(r);
    expect(faceRadius(40, 20)).toBeGreaterThan(20);
    expect(faceRadius(0, 20)).toBe(0);
  });

  it('runs rhythms slower for a fortune and faster for little, within limits', () => {
    expect(tempoOf(20, 20)).toBe(1);
    expect(tempoOf(40, 20)).toBeCloseTo(4 ** -0.25);
    expect(tempoOf(1000, 20)).toBe(0.25);
    expect(tempoOf(0.01, 20)).toBe(4);
  });

  it('takes 0.16 s of real time for a blink at any tempo', () => {
    // a body's size changes how often it blinks, not how long a blink takes
    const dt = 0.001;
    for (const rate of [0.25, 1, 4]) {
      let run = 0;
      let longest = 0;
      for (let t = 0; t < 30; t += dt) {
        run = blinkAt(t * rate, 7, rate) > 0 ? run + dt : 0;
        longest = Math.max(longest, run);
      }
      expect(longest).toBeCloseTo(0.16, 2);
    }
  });
});

describe('results, felt on a log scale', () => {
  it('makes doubling joy, halving despair, losing everything the worst, and nothing nothing', () => {
    expect(felt(1, 2)).toBeGreaterThan(0.85);
    expect(felt(2, 1)).toBeLessThan(-0.85);
    expect(felt(1, 0)).toBe(-1);
    expect(felt(1, 1)).toBe(0);
    expect(felt(1, 1.1)).toBeGreaterThan(0.15);
    expect(felt(1, 1.1)).toBeLessThan(0.25);
    expect(Math.abs(felt(1, 1.01))).toBeLessThan(0.03);
    expect(felt(4, 8)).toBeCloseTo(felt(1, 2));
  });

  it('turns a loss to anger in the dominant and to sadness in the rest', () => {
    const f = new FaceField(2);
    f.temper(0, BLUE);
    f.temper(1, RED);
    f.react(0, 8, 4);
    f.react(1, 10, 7);
    const blue = { v: f.v[0], a: f.a[0], d: f.d[0], n: 0 };
    const red = { v: f.v[1], a: f.a[1], d: f.d[1], n: 0 };
    expect(blue.d).toBeGreaterThan(0.5);
    expect(express(blue).browSlope).toBeGreaterThan(0.4);
    expect(marksOf(blue).vein).toBeGreaterThan(0.5);
    expect(red.d).toBeLessThan(0);
    expect(express(red).mouthCurve).toBeLessThan(-0.15);
  });

  it('makes a win proud in the dominant: both corners up, no smirk', () => {
    const f = new FaceField(1);
    f.temper(0, BLUE);
    f.react(0, 4, 6);
    const pose = f.poseOf(0, true).pose;
    expect(pose.expression.mouthCurve).toBeGreaterThan(0.3);
    expect(pose.expression.smirk).toBeLessThan(0.1);
  });

  it('lets feelings fade back to the temperament: a moving average of results', () => {
    const f = new FaceField(1);
    f.temper(0, RED);
    f.react(0, 1, 2);
    expect(f.v[0]).toBeGreaterThan(0.9);
    for (let t = 0; t < 40; t += 0.1) f.step(0.1);
    expect(Math.abs(f.v[0] - RED.v0)).toBeLessThan(0.15);
    expect(f.a[0]).toBeCloseTo(RED.a0, 1);
  });

  it('takes a whole room of results in one call, as it takes them one by one', () => {
    const a = new FaceField(5);
    const b = new FaceField(5);
    const prev = [1, 2, 3, 4, 5];
    const next = [2, 1, 3, 0, 6];
    a.reactAll([0, 1, 2, 3, -1], prev, next);
    for (let k = 0; k < 4; k++) b.react(k, prev[k], next[k]);
    expect([...a.v]).toEqual([...b.v]);
    expect([...a.d]).toEqual([...b.d]);
  });
});

describe('temperaments', () => {
  it('rests Blue in a subtle contempt: heavy lids and a small hook', () => {
    const f = new FaceField(1);
    f.temper(0, BLUE);
    const x = f.poseOf(0, true).pose.expression;
    expect(x.eyeOpening).toBeLessThan(-0.25);
    expect(x.smirk).toBeGreaterThan(0.35);
    expect(x.smirk).toBeLessThan(0.6);
  });

  it('rests Red serene: a small smile, calm open eyes', () => {
    const f = new FaceField(1);
    f.temper(0, RED);
    const x = f.poseOf(0, true).pose.expression;
    expect(x.mouthCurve).toBeGreaterThan(0.15);
    expect(x.eyeOpening).toBeGreaterThan(-0.25);
    expect(x.smirk).toBeLessThan(0.35);
  });

  it('gives the winner a very contemptuous face, and nobody else', () => {
    const f = new FaceField(2);
    f.temper(0, RED);
    f.temper(1, RED);
    f.contemptTo[0] = 1;
    f.settle();
    const winner = f.poseOf(0, true).pose;
    expect(winner.expression.smirk).toBeGreaterThan(0.8);
    expect(winner.expression.eyeOpening).toBeLessThan(-0.5);
    expect(winner.head!.pitch).toBeGreaterThan(0.5);
    expect(f.poseOf(1, true).pose.expression.smirk).toBeLessThan(0.35);
  });

  it('varies everyone else a little, never wildly', () => {
    for (let s = 0; s < 50; s++) {
      const t = temperament(s);
      expect(Math.abs(t.v0)).toBeLessThan(0.3);
      expect(Math.abs(t.d0)).toBeLessThanOrEqual(0.3);
    }
    expect(new Set(Array.from({ length: 20 }, (_, s) => temperament(s).a0.toFixed(2))).size).toBeGreaterThan(10);
  });

  it('never cries from a feeling alone: tears are a scene’s to give', () => {
    for (const v of grid) for (const a of grid) for (const d of grid) expect(marksOf({ v, a, d, n: 0 } satisfies Affect).tears).toBe(0);
  });
});

describe('looking', () => {
  it('turns the head most of the way to a target and the eyes the rest, and holds still under reduced motion', () => {
    const f = new FaceField(1);
    f.look(0, 0.8, 0);
    for (let t = 0; t < 2; t += 1 / 60) f.step(1 / 60);
    const pose = f.poseOf(0, true).pose;
    expect(pose.head!.yaw).toBeGreaterThan(0.9);
    expect(pose.gaze!.yaw).toBeGreaterThan(0.4);
    expect(pose.blink).toBe(0);
  });

  it('looks at the reader when looking straight, and glances about with free eyes', () => {
    const f = new FaceField(1);
    f.look(0, 0, 0);
    f.settle();
    expect(f.poseOf(0, true).pose.head!.yaw).toBeCloseTo(0, 5);
    f.glance(0);
    const seen = new Set<string>();
    for (let t = 0; t < 30; t += 0.1) {
      f.step(0.1);
      seen.add(f.headYaw[0].toFixed(1));
    }
    expect(seen.size).toBeGreaterThan(3);
  });
});

/** The ellipses in a path: centre x and half-width of each `M x y a rx ry …` (draw.ts writes them so). */
function ovals(d: string): { x: number; w: number }[] {
  return [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)a([\d.]+) ([\d.]+)/g)].map((m) => ({ x: Number(m[1]) + Number(m[3]), w: Number(m[3]) }));
}

describe('drawing', () => {
  const at = (yaw: number): FacePose => ({ expression: NEUTRAL, head: { yaw, pitch: 0, roll: 0 } });

  it('turns a face: the far eye narrows, the eyes close up and slide toward the turn', () => {
    const front = new FacePainter().paint('dots', 'circle', 30, 30, at(0), {}, 1)!;
    const turned = new FacePainter().paint('dots', 'circle', 30, 30, at(1), {}, 1)!;
    const [l0, r0] = ovals(front.ink);
    const [l1, r1] = ovals(turned.ink);
    expect(l0.w).toBeCloseTo(r0.w, 1);
    expect(r1.w).toBeLessThan(l1.w * 0.75);
    expect(r1.x - l1.x).toBeLessThan((r0.x - l0.x) * 0.9);
    expect(l1.x + r1.x).toBeGreaterThan(l0.x + r0.x + 10);
  });

  it('hands back the same drawing while nothing visible changed', () => {
    const p = new FacePainter();
    const a = p.paint('manga', 'circle', 30, 30, stillOf({ v: 0, a: 0, d: 0, n: 0 }).pose, {}, 1);
    expect(p.paint('manga', 'circle', 30, 30, stillOf({ v: 0.001, a: 0, d: 0, n: 0 }).pose, {}, 1)).toBe(a);
    expect(p.paint('manga', 'circle', 30, 30, stillOf({ v: 0.9, a: 0.5, d: 0.4, n: 0 }).pose, {}, 1)).not.toBe(a);
  });

  it('draws every look, at rest and in a strong feeling, with no gaps in the numbers', () => {
    for (const look of LOOKS)
      for (const e of [{ v: 0, a: 0, d: 0, n: 0 }, CONTEMPT, { v: -0.9, a: 0.6, d: 0.8, n: 0 }, { v: 0.9, a: 0.6, d: 0.3, n: 1 }]) {
        const still = stillOf(e);
        const d = drawStill(look, 'triangle', 30, 30, still)!;
        const all = [d.white, d.ink, d.lines, d.thin, d.heavy, d.rings, d.glint, d.clipped, d.lid, ...d.over.map((m) => m.d), ...d.outer.map((m) => m.d)].join('');
        expect(all.length, look).toBeGreaterThan(20);
        expect(all, look).not.toMatch(/NaN|Infinity|undefined/);
      }
  });

  it('gives dust no face', () => {
    expect(new FacePainter().paint('manga', 'circle', 2, 2, { expression: NEUTRAL }, {}, 1)).toBeNull();
  });
});

describe('speed', () => {
  it('steps and reads a thousand faces for ten seconds in well under a frame budget each', () => {
    const f = new FaceField(1000);
    for (let i = 0; i < 1000; i++) f.temper(i, temperament(i));
    const t0 = performance.now();
    for (let k = 0; k < 600; k++) {
      f.step(1 / 60);
      for (let i = 0; i < 1000; i += 10) f.poseOf(i);
    }
    const perFrame = (performance.now() - t0) / 600;
    // 1,000 faces stepped and a hundred read, per frame (about 0.5 ms on the machine this was written on):
    // the stage has 110, and a frame has 16.7 ms. The bound only catches a tenfold slip, never a busy machine.
    expect(perFrame).toBeLessThan(5);
  });
});
