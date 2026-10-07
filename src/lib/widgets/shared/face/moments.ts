/**
 * Feelings to faces: the few moments the stage shows, each a point in a
 * continuous affect space drawn through one FACS-inspired mapping. Pure, no
 * Svelte. The prototype's full person model (temperament, dynamics, display
 * rules) stays on the branch faces-history; the stage needs only these stills.
 *
 * Coefficients are design defaults tuned by eye, not measurements: drawing
 * conventions viewers read, not claims about real faces.
 */
import type { Expression, FacePose, Marks } from './face';

export interface Affect {
  /** Valence, unpleasant −1 … pleasant 1. */
  readonly v: number;
  /** Arousal, deactivated −1 … activated 1. */
  readonly a: number;
  /** Dominance, submissive −1 … dominant 1. */
  readonly d: number;
  /** Novelty, 0 … 1: something unexpected, just now. */
  readonly n: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const unit = (x: number) => clamp(x, 0, 1);
/** 0 below lo, 1 above hi, linear between. */
const ramp = (x: number, lo: number, hi: number) => unit((x - lo) / (hi - lo));
/** Perceptual easing: spends more of the range near zero. */
const ease = (x: number, p = 0.7) => Math.sign(x) * Math.abs(x) ** p;

const POSITIVE_THRESHOLD = 0.15;
/** Valence this close to zero moves nothing, so a face at rest does not flicker into frowns. */
const NEUTRAL_BAND = 0.08;

/**
 * Affect → the expression: FACS-inspired synergies — both brow ends up for
 * surprise, the inner ends up for grief, lowered and knit for anger, the cheek
 * lifting with a broad smile. Positive valence shows above a threshold,
 * negative soon after a small neutral band.
 */
export function express(e: Affect): Expression {
  const { v, a, d, n } = e;
  const ap = (a + 1) / 2;
  const apos = Math.max(0, a);
  const dp = Math.max(0, d);
  const dn = Math.max(0, -d);
  const plus = Math.max(0, v - POSITIVE_THRESHOLD) / (1 - POSITIVE_THRESHOLD);
  const minus = Math.max(0, -v - NEUTRAL_BAND) / (1 - NEUTRAL_BAND);
  const au1 = unit(n + minus * dn * 1.1);
  const au2 = unit(n + minus * dn * apos * 0.6);
  const au4 = unit(minus * (0.4 + 0.6 * dp));
  const au5 = unit(n + minus * dn * apos * 0.8);
  const au6 = unit(plus ** 1.2 * (0.55 + 0.45 * ap));
  const au7 = unit(minus * dp * 0.9 + 0.2 * minus);
  const au12 = unit(plus);
  const au15 = unit(minus * (0.6 + 0.4 * dn));
  const au20 = unit(minus * dn * apos);
  // cold superiority — dominant and unstirred: one corner rises and the lids drop. We depict contempt
  // this way when displeased; very pleased it is pride, which smiles with both corners instead.
  const lofty = ramp(d, 0.3, 0.75) * (1 - ramp(a, 0.25, 0.7));
  const smirk = lofty * (1 - ramp(Math.abs(v + 0.1), 0.45, 0.8));
  return {
    browLift: clamp(0.45 * (au1 + au2) + 0.25 * au1 - 0.45 * au4, -1, 1),
    browSlope: clamp(0.8 * au4 - 1.1 * Math.max(0, au1 - au2), -1, 1),
    // arousal opens the eyes (sleepy lids below zero), the startle and fear widen them, a glare narrows them
    eyeOpening: clamp((a < 0 ? 0.49 : 0.33) * a - 0.3 * au7 + 0.9 * au5 - 0.35 * lofty, -1, 1),
    cheekLift: au6,
    mouthCurve: ease(au12 - au15),
    mouthOpening: unit(0.5 * apos ** 1.4 + 0.6 * n + 0.3 * au20),
    smirk,
  };
}

/** Shame and embarrassment flush (submissive, moderately aroused). */
function embarrassment(e: Affect): number {
  const dn = Math.max(0, -e.d);
  return unit(1.4 * dn * Math.exp(-(((e.a - 0.2) / 0.3) ** 2)) * (0.3 + 0.7 * Math.max(0, -e.v)));
}

/**
 * The marks a feeling raises, each fading in over its own region. Never tears:
 * sadness and boredom share these coordinates, so any rule here would make
 * boredom cry. Tears are an accent a scene supplies, if it ever wants one.
 */
export function marksOf(e: Affect): Marks {
  return {
    sweat: ramp(e.a, 0.2, 0.7) * ramp(-e.d, 0.1, 0.5),
    vein: ramp(-e.v, 0.3, 0.6) * ramp(e.a, 0.2, 0.5) * ramp(e.d, -0.1, 0.2),
    exclaim: ramp(e.n, 0.3, 0.7),
    gloom: ramp(-e.v, 0.3, 0.7) * ramp(-e.a, 0, 0.4),
    sparkles: ramp(e.v, 0.5, 0.85),
    blushLines: ramp(embarrassment(e), 0.2, 0.55),
    blush: unit(embarrassment(e) + 0.3 * Math.max(0, e.v) * Math.max(0, e.a)),
    tears: 0,
  };
}

/**
 * A still of a feeling: the expression, then the head and eyes — dominance
 * lifts the chin, the submissive look away and down — and the marks.
 */
export function stillOf(e: Affect): { pose: FacePose; marks: Marks } {
  const apos = Math.max(0, e.a);
  const dp = Math.max(0, e.d);
  const dn = Math.max(0, -e.d);
  const marks = marksOf(e);
  // how far the head and eyes move: wider when aroused or dominant
  const reach = Math.max(0.2, 1 + 0.25 * e.a + 0.5 * e.d);
  const avert = unit(0.8 * dn ** 0.8);
  const gazeYaw = -0.75 * avert;
  const head = {
    yaw: clamp((0.45 * gazeYaw - 0.45 * dn * (0.5 + (marks.blush ?? 0)) * Math.sign(avert)) * reach, -1, 1),
    pitch: clamp(0.7 * e.d * reach, -1, 1),
    roll: clamp(0.25 * dn * reach, -1, 1),
  };
  return {
    pose: {
      expression: express(e),
      // the eyes counter-rotate: what is drawn is the gaze minus the head
      gaze: { yaw: clamp(gazeYaw * reach - head.yaw, -1, 1), pitch: clamp(0.6 * dn * (1 - apos) - 0.1 * dp + 0.5 * head.pitch, -1, 1) },
      head,
      pupil: 1 + 0.2 * e.a + 0.2 * e.n,
    },
    marks,
  };
}

/**
 * Feelings as points, from the NRC VAD Lexicon v1 (Mohammad 2018), rescaled
 * from [0, 1] to [−1, 1]: word-meaning ratings, starting points for authoring
 * rather than the felt state of a person. The lexicon is free for
 * non-commercial research and education; see notes/research.md.
 *
 * Contempt is authored, not looked up: the lexicon rates the WORD (v −0.59,
 * a 0.27, d −0.21), its connotation. We depict contempt as cool superiority —
 * calm, dominant, mildly unpleasant — after Fischer & Roseman (2007), who find
 * it colder and more distancing than anger; that study does not validate this
 * exact point.
 */
const nrc = (v: number, a: number, d: number, n = 0): Affect => ({ v: 2 * v - 1, a: 2 * a - 1, d: 2 * d - 1, n });

export const FEELINGS = {
  neutral: { v: 0, a: 0, d: 0, n: 0 },
  happy: nrc(1.0, 0.735, 0.772),
  sad: nrc(0.225, 0.333, 0.149),
  proud: nrc(0.906, 0.7, 0.873),
  contempt: { v: -0.35, a: -0.2, d: 0.65, n: 0 },
  // surprised, and just now: the coin in the air
  startled: nrc(0.784, 0.855, 0.539, 1),
} as const satisfies Record<string, Affect>;

export type Moment = keyof typeof FEELINGS;

/** The stage's moments, drawn once. */
export const MOMENTS: Readonly<Record<Moment, { pose: FacePose; marks: Marks }>> = Object.fromEntries(
  (Object.keys(FEELINGS) as Moment[]).map((m) => [m, stillOf(FEELINGS[m])]),
) as Record<Moment, { pose: FacePose; marks: Marks }>;
