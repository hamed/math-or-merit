import { describe, expect, it } from 'vitest';
import { FaceLife, LiveFace, alive } from './life.svelte';
import { EXPRESSION_RANGE, NEUTRAL, blinkAt, boundPose, faceGeometry, faceRadius, tempoOf, type Expression } from './face';
import { FEELINGS, MOMENTS, express, marksOf, type Affect } from './moments';

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
          expect(g.crinkle).toBeGreaterThanOrEqual(0);
          expect(g.crinkle).toBeLessThanOrEqual(1);
        }
  });
});

describe('size laws', () => {
  it('gives an equal share its normal face, and never a face bigger than the body', () => {
    expect(faceRadius(20, 20)).toBe(20);
    for (const r of [0.5, 3, 10, 20, 40, 200]) expect(faceRadius(r, 20)).toBeLessThanOrEqual(r);
    expect(faceRadius(40, 20)).toBeGreaterThan(20);
    expect(faceRadius(40, 20)).toBeLessThan(40);
    expect(faceRadius(0, 20)).toBe(0);
  });

  it('runs rhythms slower for a fortune and faster for little, within limits', () => {
    expect(tempoOf(20, 20)).toBe(1);
    expect(tempoOf(40, 20)).toBeCloseTo(4 ** -0.25);
    expect(tempoOf(1000, 20)).toBe(0.25);
    expect(tempoOf(0.01, 20)).toBe(4);
  });

  it('keeps a face clock continuous when its rate changes', () => {
    const clocks = new FaceLife();
    clocks.time('a', 1, 0);
    const before = clocks.time('a', 1, 300);
    expect(clocks.time('a', 1.01, 300)).toBe(before);
    expect(clocks.time('a', 2, 301)).toBeCloseTo(before + 2);
  });

  it('ticks a face at rest without touching it', () => {
    const life = new FaceLife();
    const face = new LiveFace();
    const who = { seed: 1, r: 20, r0: 20, glancing: true, talking: false };
    // seed 1 neither blinks nor moves its eyes in these first moments
    life.tick('a', face, who, 0.1);
    const glance = face.glance;
    life.tick('a', face, who, 0.2);
    expect(face.glance).toBe(glance);
    expect(face.blink).toBe(0);
    life.tick('a', face, { ...who, talking: true }, 0.3);
    expect(face.mouth).toBeGreaterThan(0);
    expect(alive(MOMENTS.neutral.pose, face, null).expression.mouthOpening).toBeGreaterThan(0);
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

describe('feelings to faces', () => {
  it('keeps a face at rest still: a little valence moves nothing', () => {
    for (const v of [-0.08, 0, 0.15]) {
      const x = express({ v, a: 0, d: 0, n: 0 });
      expect(Math.abs(x.mouthCurve)).toBeLessThan(1e-9);
      expect(x.smirk).toBe(0);
    }
  });

  it('smiles for joy and frowns for sadness', () => {
    expect(express(FEELINGS.happy).mouthCurve).toBeGreaterThan(0.5);
    expect(express(FEELINGS.sad).mouthCurve).toBeLessThan(-0.3);
  });

  it('gives contempt one corner and pride both', () => {
    expect(express(FEELINGS.contempt).smirk).toBeGreaterThan(0.5);
    expect(express(FEELINGS.contempt).eyeOpening).toBeLessThan(-0.25);
    expect(express(FEELINGS.proud).smirk).toBe(0);
    expect(express(FEELINGS.proud).mouthCurve).toBeGreaterThan(0.5);
  });

  it('widens the eyes and opens the mouth when the coin is in the air', () => {
    const x = express(FEELINGS.startled);
    expect(x.eyeOpening).toBeGreaterThan(0.85);
    expect(x.mouthOpening).toBeGreaterThan(0.5);
    expect(MOMENTS.startled.marks.exclaim).toBe(1);
  });

  it('never cries from a feeling alone: tears are a scene’s to give', () => {
    for (const v of grid) for (const a of grid) for (const d of grid) expect(marksOf({ v, a, d, n: 0 } satisfies Affect).tears).toBe(0);
  });

  it('draws every moment inside the boundary', () => {
    for (const { pose } of Object.values(MOMENTS)) expect(boundPose(pose).expression).toEqual(pose.expression);
  });
});
