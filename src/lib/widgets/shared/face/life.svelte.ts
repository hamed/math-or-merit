/**
 * What keeps faces alive between events: blinks, glances and a talking
 * mouth, each on the face's own clock, at the pace of its body's size.
 *
 * One tick a frame advances every face and writes only what changed, so the
 * drawings never read the clock: a face at rest costs nothing, and a hundred
 * of them do not all redraw every frame. Without the tick (reduced motion) a
 * face simply holds its still.
 */
import { STRIDE, blinkAt, glanceAt, mouthAt, tempoOf, type FacePose } from './face';

/** A face's living parts, as the tick last left them. */
export class LiveFace {
  /** 0 open … 1 shut. */
  blink = $state(0);
  /** Where idle eyes rest. */
  glance = $state.raw({ yaw: 0, pitch: 0 });
  /** 0 shut … 1 wide, while talking. */
  mouth = $state(0);
}

export interface Living {
  /** Per person: when it blinks and where it glances. */
  readonly seed: number;
  /** The body's radius, and an equal share's: rhythms slow with size. */
  readonly r: number;
  readonly r0: number;
  /** Eyes drawn to something hold still; only free eyes glance about. */
  readonly glancing: boolean;
  readonly talking: boolean;
}

/** The faces of one scene: each face's clocks. */
export class FaceLife {
  private readonly clocks = new Map<string, { time: number; at: number }>();

  /**
   * Clock `key` at page time `now`, having run at `rate` since it was last
   * read. Advancing by step × rate keeps a face's blinks and glances going
   * when its size — and with it its tempo — changes: multiplying page time by
   * a new rate would leap a face that has lived 300 s three seconds ahead for
   * a 1% change.
   */
  time(key: string, rate: number, now: number): number {
    let c = this.clocks.get(key);
    if (!c) this.clocks.set(key, (c = { time: 0, at: now }));
    c.time += Math.max(0, now - c.at) * rate;
    c.at = now;
    return c.time;
  }

  /** Advance face `key` (drawn by `face`) to page time `now`: blinks at the body's tempo, glances and talking at its stride. */
  tick(key: string, face: LiveFace, life: Living, now: number): void {
    const rhythm = tempoOf(life.r, life.r0);
    const stride = rhythm ** STRIDE;
    const blink = blinkAt(this.time(`${key}:blink`, rhythm, now), life.seed, rhythm);
    if (blink !== face.blink) face.blink = blink;
    if (life.glancing) {
      const g = glanceAt(this.time(`${key}:glance`, stride, now), life.seed);
      if (g.yaw !== face.glance.yaw || g.pitch !== face.glance.pitch) face.glance = g;
    }
    const mouth = life.talking ? mouthAt(this.time(`${key}:talk`, stride, now), life.seed) : 0;
    if (mouth !== face.mouth) face.mouth = mouth;
  }
}

/** A still with its living parts: eyes drawn to `looking` (or glancing), a blink, a talking mouth. */
export function alive(still: FacePose, face: LiveFace, looking: { readonly yaw: number; readonly pitch: number } | null): FacePose {
  const eyes = looking ?? face.glance;
  const x = still.expression;
  return {
    ...still,
    expression: face.mouth > 0 ? { ...x, mouthOpening: Math.max(x.mouthOpening, 0.8 * face.mouth) } : x,
    gaze: { yaw: (still.gaze?.yaw ?? 0) + eyes.yaw, pitch: (still.gaze?.pitch ?? 0) + eyes.pitch },
    blink: Math.max(still.blink ?? 0, face.blink),
  };
}
