/**
 * How someone looks in the paper's photograph (owner, 2026-10-09: "a
 * photograph of a poor person should not have contempt"): the richest in the
 * room, contempt; anyone else, how their fortune feels against an equal share
 * (`felt`) — the poor sad, the comfortable pleased, the average plain.
 *
 * Editorial policy of the stage's newspaper, so it lives beside the stage,
 * not in the reusable face field (review 2026-10-10).
 */
import { felt } from '../../../shared/face/field';
import { CONTEMPT, type Affect } from '../../../shared/face/moments';

export function photoMood(share: number, n: number, richest: boolean): Affect {
  if (richest) return CONTEMPT;
  const u = felt(1 / n, share);
  return { v: 0.8 * u, a: 0.3 * Math.abs(u) - 0.15, d: 0.5 * u, n: 0 };
}
