/**
 * What the faces on the pair stage show (owner, 2026-10-07: "use manga"). They
 * react to what happens, never to costume, and not to standing wealth: no
 * mood by fortune.
 *
 * - The rain (Scene 2): a coin caught lights a face; once the last coin has
 *   landed, whoever caught none is sad.
 * - A toss: both watch the coin in the air. Once it lands, Red wins happy and
 *   loses sad; Blue wins proud and loses with contempt (owner, 2026-10-03:
 *   "contempt, pride, I am better than you … the blue … he is special"). The
 *   reaction lasts while the coin shows its winner and nothing is staked yet.
 */
import type { Moment } from '../../../shared/face/moments';
import type { Speaker } from '../../steps';
import type { Pose } from './script';

/** What happens between poses, as the stage plays it. */
export interface FaceCue {
  /** The decider is in the air. */
  readonly air: boolean;
  /** Coins each of the sixteen has caught so far in Scene 2's rain. */
  readonly caught: readonly number[];
  /** The last coin of the rain has landed. */
  readonly rainOver: boolean;
}

/** The moment person `i` of the sixteen shows (`who`: Blue, Red or nobody yet). */
export function momentOf(i: number, who: Speaker | null, pose: Pose, cue: FaceCue): Moment {
  if (pose.crowd === 'paid') return cue.caught[i] > 0 ? 'happy' : cue.rainOver ? 'sad' : 'neutral';
  if (!who || pose.place !== 'seats') return 'neutral';
  if (cue.air) return 'startled';
  if ((pose.flip === 'blue' || pose.flip === 'red') && pose.table.blue + pose.table.red === 0) {
    const won = pose.flip === who;
    if (who === 'blue') return won ? 'proud' : 'contempt';
    return won ? 'happy' : 'sad';
  }
  return 'neutral';
}

/** How long a line's mouth moves, seconds: as long as its words take to arrive. */
export function talkSeconds(text: string): number {
  return Math.min(4, 0.4 + text.length * 0.045);
}
