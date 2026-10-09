/**
 * Scene 10's demonstration rounds (owner, 2026-10-09: "a couple of rounds,
 * two random players taken out, they play the coin … and then go back in
 * their places"): before the room plays by itself, the reader sees the rule
 * played by hand. Each round two people from the room, drawn at random, hop
 * out to the front, grown so the reader can see them; each puts in a tenth of
 * the poorer one's fortune; the decider is tossed between them; the winner
 * takes both stakes; they hop back. Pure and seeded, so the stage plays it
 * and the step waits exactly as long.
 */
import type { Point } from '../../../shared/layout';
import { createRandomSource } from '$lib/sim';
import { CROSSING, arrival, hopsBy, type Hop } from './hops';

/** Seconds a round takes, out and back: room enough for a big room's long jumps home (4K). The step lasts its rounds (script.ts). */
export const ROUND_SECONDS = 6.4;
/** Seconds into a round when both stand at the front and the stakes go in: every hop out has landed by then. */
export const OUT_SECONDS = 1.8;
/** Seconds from the stakes going in to the toss. */
export const STAKE_SECONDS = 0.55;
/** How much quicker the rounds after the first play: the rule is known by then (owner, 2026-10-09: "we keep doing a few more rounds, and then move"). */
export const MORE_SPEED = 1.5;

/**
 * A part of a round, as the script names it (`\\pairs[pick]{1}`), so the first
 * round can be played as Red tells it (owner, 2026-10-09: "dialogs and actions
 * are synced for the first trial"): the two picked step out; the stakes go
 * in; the toss, the winner taking both, and home.
 */
export type RoundPhase = 'pick' | 'stake' | 'flip';
export const ROUND_PHASES: readonly RoundPhase[] = ['pick', 'stake', 'flip'];

/** A moment of a round, from its start to its end. */
export type RoundMoment = 'start' | 'stake' | 'flip' | 'end';

/** The stretch of the room's demonstration a step plays: from a moment of round `first` to a moment of round `first + count - 1`. */
export interface RoundWindow {
  readonly first: number;
  readonly count: number;
  readonly from: RoundMoment;
  readonly to: RoundMoment;
  /** How much faster than told it plays. */
  readonly speed: number;
}

/** Where each part starts and ends. */
export const PHASE_SPAN: Readonly<Record<RoundPhase, readonly [RoundMoment, RoundMoment]>> = {
  pick: ['start', 'stake'],
  stake: ['stake', 'flip'],
  flip: ['flip', 'end'],
};

/** A moment of a round, seconds into it: the same on every stage, so a step knows how long it waits. */
const MOMENT: Readonly<Record<RoundMoment, number>> = { start: 0, stake: OUT_SECONDS, flip: OUT_SECONDS + STAKE_SECONDS, end: ROUND_SECONDS };

/** When a window starts and ends, seconds on the demonstration's own clock (round k starts at k × ROUND_SECONDS). */
export function windowTimes(w: RoundWindow): [number, number] {
  return [w.first * ROUND_SECONDS + MOMENT[w.from], (w.first + w.count - 1) * ROUND_SECONDS + MOMENT[w.to]];
}

/** How long a window takes to play, seconds. */
export function windowSeconds(w: RoundWindow): number {
  const [from, to] = windowTimes(w);
  return (to - from) / w.speed;
}
/** How much bigger the two are while they play at the front: enough to see the stakes change them. */
export const OUT_SCALE = 2.2;
/** The room's stake: a tenth of the poorer one's fortune (recording.ts DEFAULT_RUN). */
export const ROUND_STAKE = 0.1;

/** When each part of a round happens, seconds from the start of the step. */
export interface RoundPlan {
  /** The two room members, by their place in the room, and who wins. */
  readonly a: number;
  readonly b: number;
  readonly winner: number;
  /** Where each stands while they play, and where the decider is tossed. */
  readonly spotA: Point;
  readonly spotB: Point;
  readonly coin: Point;
  readonly outA: readonly Hop[];
  readonly outB: readonly Hop[];
  readonly backA: readonly Hop[];
  readonly backB: readonly Hop[];
  readonly start: number;
  /** Both at the front, the stakes in. */
  readonly stake: number;
  /** The decider tossed, and landed. */
  readonly flip: number;
  readonly landed: number;
  /** The winner has the stakes; they set off home. */
  readonly back: number;
  readonly end: number;
}

export interface RoundSetup {
  readonly positions: readonly Point[];
  /** Everyone's radius in the room. */
  readonly radius: number;
  /** The room's box: they play in front of its lower middle. */
  readonly box: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  /** Blue's and Red's seats: never drawn, they are always their own bodies. */
  readonly blue: number;
  readonly red: number;
  readonly unit: number;
  readonly g: number;
}

/** A seed whose draws make an even first round and a second that the other side wins. */
const SEED = 1009;

export function planRounds(s: RoundSetup, rounds: number): RoundPlan[] {
  const random = createRandomSource(SEED);
  const out: RoundPlan[] = [];
  const middle = { x: s.box.x + s.box.w / 2, y: s.box.y + s.box.h * 0.74 };
  const apart = s.radius * OUT_SCALE * 1.9;
  const spotA = { x: middle.x - apart, y: middle.y };
  const spotB = { x: middle.x + apart, y: middle.y };
  const taken = new Set([s.blue, s.red]);
  const draw = () => {
    let i: number;
    do i = Math.floor(random.next() * s.positions.length);
    while (taken.has(i));
    taken.add(i);
    return i;
  };
  for (let k = 0; k < rounds; k++) {
    const start = k * ROUND_SECONDS;
    // the one further left takes the left spot, so their paths do not cross
    const [a, b] = [draw(), draw()].sort((p, q) => s.positions[p].x - s.positions[q].x);
    const winner = random.next() < 0.5 ? a : b;
    const hop = (from: Point, to: Point, depart: number, by: number) => hopsBy(from, to, depart, s.radius, s.unit, s.g, by, CROSSING);
    const outA = hop(s.positions[a], spotA, start + 0.05, start + OUT_SECONDS);
    const outB = hop(s.positions[b], spotB, start + 0.15, start + OUT_SECONDS);
    // the stakes go in at the same moment on every stage, so the script's parts of a round have fixed lengths
    const stake = start + Math.max(OUT_SECONDS, arrival(outA, start + 0.05) - start, arrival(outB, start + 0.15) - start);
    const flip = stake + STAKE_SECONDS;
    const landed = flip + 1.6;
    const back = landed + 0.6;
    const backA = hop(spotA, s.positions[a], back, start + ROUND_SECONDS - 0.15);
    const backB = hop(spotB, s.positions[b], back + 0.1, start + ROUND_SECONDS - 0.15);
    const end = Math.max(arrival(backA, back), arrival(backB, back + 0.1));
    out.push({ a, b, winner, spotA, spotB, coin: middle, outA, outB, backA, backB, start, stake, flip, landed, back, end });
  }
  return out;
}
