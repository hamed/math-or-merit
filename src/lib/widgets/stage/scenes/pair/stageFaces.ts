/**
 * The pair stage's faces (owner, 2026-10-07): everyone who has a face, in one
 * FaceField, where each looks, and what moves them. The stage hands it plain
 * numbers every frame and gets drawings back. No Svelte, no DOM.
 *
 * Slots: the crowd's people first (Blue and Red among them, for the whole
 * game), then the room's hundred (its seats for Blue and Red stay empty: the
 * two are always their own bodies), then the matched room's copies of the two.
 *
 * Faces react to what happens, never to costume: each result lands on a log
 * scale (field.ts `felt`), feelings lag and fade, so a face in the running room
 * is a moving average of that person's results.
 */
import type { AgentShape } from '../../../shared/agentStyle';
import { FacePainter, type FaceDrawing } from '../../../shared/face/draw';
import { faceRadius, type FaceLook } from '../../../shared/face/face';
import { FaceField } from '../../../shared/face/field';
import { BLUE, RED, temperament } from '../../../shared/face/moments';
import { noise } from '../../../shared/layout';
import type { Point } from '../../../shared/layout';

export interface Body {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly alpha: number;
}

/**
 * The title's newest word, for the opening's crowd to look up at: where it
 * is, when it came (seconds, the faces' clock), and whether it is still
 * moving (the reel spinning) and so holds them.
 */
export interface TitleCue {
  readonly x: number;
  readonly y: number;
  readonly since: number;
  readonly live: boolean;
}

/** What the faces can see this frame. */
export interface FaceScene {
  /** How far away a look's target sits in depth, px: a nearer depth turns heads further. */
  readonly depth: number;
  readonly people: readonly Body[];
  /** The room's hundred, when the room stands as people; null otherwise. */
  readonly room: readonly Body[] | null;
  /** The matched room's copies of Blue and Red, when it shows. */
  readonly mirror: readonly [Body, Body] | null;
  readonly speaker: 'blue' | 'red' | null;
  /** The line is said to the reader. */
  readonly aside: boolean;
  /** Blue and Red face each other (the seats). */
  readonly facing: boolean;
  /** The decider, in the air. */
  readonly coin: Point | null;
  /** Coins on the move: the rain, stakes on their way to the winner. */
  readonly moving: readonly Point[];
  /** The opening's crowd, standing about: neighbours chat. */
  readonly chat: boolean;
  /** Something new in the title: the crowd looks up at it, each in their own time. */
  readonly title: TitleCue | null;
}

const MIRROR = 2;

/** A pair's turns in the opening's chat: how long each lasts, the pair's own clock, and which turn it is. */
function turnOf(pair: number, now: number): { turn: number; clock: number; k: number } {
  const turn = 1.4 + 1.6 * ((noise(pair, 43) + 1) / 2);
  const clock = now + (noise(pair, 44) + 1) * 2;
  return { turn, clock, k: Math.floor(clock / turn) };
}

/** Whether a pair laughs together as turn `k` begins: about one turn in eight. */
const laughs = (pair: number, k: number) => noise(pair * 5 + k, 47) > 0.75;

const LOOK_CODE: Record<FaceLook, number> = { manga: 1, lids: 2, dots: 3, beans: 4, googly: 5, peek: 6, brows: 7, ink: 8 };

export class StageFaces {
  readonly field: FaceField;
  readonly people: number;
  readonly room: number;
  /** Where Blue and Red are among the people. */
  readonly blue: number;
  readonly red: number;
  private readonly painters: FacePainter[];
  /** What each face last showed, and the fingerprint it was drawn from: an unchanged face is not drawn again. */
  private readonly drawn: (FaceDrawing | null)[];
  private readonly prints: Float64Array;
  private readonly lastX: Float64Array;
  private readonly lastY: Float64Array;
  /** The opening's chat: each person's partner, or −1. */
  private readonly partner: Int16Array;
  private chatting = false;
  /** The turn each person last laughed at, so a laugh lifts them once; and who is looking up at the title this frame. */
  private readonly laughed: Float64Array;
  private readonly up: Uint8Array;

  constructor(people: number, room: number, blue: number, red: number) {
    this.people = people;
    this.room = room;
    this.blue = blue;
    this.red = red;
    const n = people + room + MIRROR;
    this.field = new FaceField(n);
    for (let i = 0; i < n; i++) this.field.temper(i, temperament(i * 13 + 5));
    for (const [i, t] of [
      [blue, BLUE],
      [red, RED],
      [this.mirrorSlot('blue'), BLUE],
      [this.mirrorSlot('red'), RED],
    ] as const)
      this.field.temper(i, t);
    this.painters = Array.from({ length: n }, () => new FacePainter());
    this.drawn = new Array<FaceDrawing | null>(n).fill(null);
    this.prints = new Float64Array(n).fill(NaN);
    this.lastX = new Float64Array(n).fill(NaN);
    this.lastY = new Float64Array(n).fill(NaN);
    this.partner = new Int16Array(people).fill(-1);
    this.laughed = new Float64Array(people).fill(NaN);
    this.up = new Uint8Array(people);
  }

  /** The slot of room member `j`. */
  roomSlot(j: number): number {
    return this.people + j;
  }

  mirrorSlot(who: 'blue' | 'red'): number {
    return this.people + this.room + (who === 'blue' ? 0 : 1);
  }

  slotOf(who: 'blue' | 'red'): number {
    return who === 'blue' ? this.blue : this.red;
  }

  /** Everyone back to their temperament, looking where they will look: a settled stage. */
  rest(): void {
    this.field.rest();
    this.field.contemptTo.fill(0);
    this.field.blushTo.fill(0);
    this.field.talking.fill(0);
  }

  /**
   * Where everyone looks this frame, and who is talking: at the decider in
   * the air, at coins on the move, along the way while hopping, at whoever
   * speaks (an aside to the reader), at each other across the seats, up at the
   * title's newest word or at each other in the opening's chat; free eyes
   * glance about, now and then at the reader.
   */
  aim(scene: FaceScene, now: number, dt: number): void {
    const f = this.field;
    const at = (i: number, b: Body, x: number, y: number) => f.look(i, Math.atan2(x - b.x, scene.depth), Math.atan2(y - b.y, scene.depth));
    const nearest = (b: Body): Point | null => {
      let best: Point | null = null;
      let d = Infinity;
      for (const p of scene.moving) {
        const dd = Math.hypot(p.x - b.x, p.y - b.y);
        if (dd < d) [best, d] = [p, dd];
      }
      return best;
    };
    const speaker = scene.speaker ? scene.people[this.slotOf(scene.speaker)] : null;
    if (scene.chat && !this.chatting) this.pairUp(scene.people);
    this.chatting = scene.chat;

    for (let i = 0; i < this.people; i++) {
      const b = scene.people[i];
      f.talking[i] = 0;
      this.up[i] = 0;
      if (!(b.alpha > 0.3) || !(b.r > 0.5)) continue;
      const who = i === this.blue ? 'blue' : i === this.red ? 'red' : null;
      const moved = this.moved(i, b, dt);
      const coin = scene.coin ?? nearest(b);
      if (coin) at(i, b, coin.x, coin.y);
      else if (moved !== 0) f.look(i, 0.5 * Math.sign(moved), 0.12);
      else if (scene.speaker && who === scene.speaker) {
        f.talking[i] = 1;
        // to the other one, wherever they stand; an aside to the reader
        if (scene.aside) f.look(i, 0, 0);
        else {
          const other = scene.people[this.slotOf(scene.speaker === 'blue' ? 'red' : 'blue')];
          at(i, b, other.x, other.y);
        }
      } else if (speaker && who) at(i, b, speaker.x, speaker.y);
      else if (scene.facing && who) this.facePartner(i, b, scene.people[i === this.blue ? this.red : this.blue], scene.depth, now);
      else if (scene.title && this.looksUp(i, scene.title, now)) {
        this.up[i] = 1;
        at(i, b, scene.title.x, scene.title.y);
      } else if (scene.chat && this.partner[i] >= 0) this.chat(i, b, scene.people[this.partner[i]], scene.depth, now);
      else if (speaker) at(i, b, speaker.x, speaker.y);
      else f.glance(i);
    }

    if (scene.room) {
      for (let j = 0; j < this.room; j++) {
        const i = this.people + j;
        const b = scene.room[j];
        if (!(b.alpha > 0.3)) continue;
        // most of the room turns to whoever speaks; some keep to themselves
        if (speaker && noise(i, 61) > -0.4) at(i, b, speaker.x, speaker.y);
        else f.glance(i);
      }
    }
    if (scene.mirror) {
      const [blue, red] = scene.mirror;
      at(this.mirrorSlot('blue'), blue, red.x, red.y);
      at(this.mirrorSlot('red'), red, blue.x, blue.y);
    }
  }

  /** Blue and Red across the seats: mostly at each other, now and then out at the reader. */
  private facePartner(i: number, b: Body, other: Body, depth: number, now: number): void {
    const s = this.field.seed[i];
    const beat = Math.floor((now + (noise(s, 41) + 1) * 3) / 4.5);
    if (noise(s * 17 + beat, 42) > 0.45) this.field.look(i, 0, 0);
    else this.field.look(i, Math.atan2(other.x - b.x, depth), Math.atan2(other.y - b.y, depth));
  }

  /**
   * Whether person `i` looks up at the title's newest word: each after a
   * delay of their own and for a while of their own, a few not at all — not an
   * army of robots. While the reel spins, those who looked keep looking.
   */
  private looksUp(i: number, cue: TitleCue, now: number): boolean {
    const key = this.field.seed[i] * 13 + Math.round(cue.since * 10);
    if (noise(key, 73) > 0.8) return false;
    const t = now - cue.since;
    const delay = 0.2 + 1.3 * ((noise(key, 71) + 1) / 2);
    const span = 1.5 + 2.5 * ((noise(key, 72) + 1) / 2);
    return t > delay && (cue.live || t < delay + span);
  }

  /**
   * The opening's chat: partners take turns, the talker's mouth going, both
   * looking at each other and the listener nodding along — a glance at the
   * reader now and then, a flush on the listener's cheeks once in a while, and
   * now and then the two laugh together (`laughing`).
   */
  private chat(i: number, b: Body, other: Body, depth: number, now: number): void {
    const f = this.field;
    const j = this.partner[i];
    const pair = Math.min(i, j) * 31 + Math.max(i, j);
    const { turn, clock, k } = turnOf(pair, now);
    const into = clock - k * turn;
    const talker = (k + pair) % 2 === 0 ? Math.min(i, j) : Math.max(i, j);
    const talking = talker === i && into < 0.7 * turn;
    f.talking[i] = talking ? 1 : 0;
    if (laughs(pair, k)) {
      // glad for a moment, both at once, mouths open with it
      if (this.laughed[i] !== k) f.feel(i, 0.45, 0.35);
      this.laughed[i] = k;
      f.talking[i] = into < 0.6 ? 1 : 0;
    }
    const away = noise(f.seed[i] * 7 + k, 45) > 0.55;
    // the listener nods, a little under once a second, while the other talks
    const nod = talker !== i && into < 0.7 * turn ? 0.3 * ((1 - Math.cos(into * Math.PI * 1.8)) / 2) : 0;
    if (away) f.look(i, 0, nod);
    else f.look(i, Math.atan2(other.x - b.x, depth), Math.atan2(other.y - b.y, depth) + nod);
    f.blushTo[i] = !talking && noise(pair * 3 + k, 46) > 0.6 ? 0.55 : 0;
  }

  /** Seconds since person `i` and their partner began to laugh together, or −1: the stage gives each a little hop. */
  laughing(i: number, now: number): number {
    const j = this.partner[i];
    if (!this.chatting || j < 0 || this.up[i] || this.up[j]) return -1;
    const pair = Math.min(i, j) * 31 + Math.max(i, j);
    const { turn, clock, k } = turnOf(pair, now);
    return laughs(pair, k) ? clock - k * turn : -1;
  }

  /** Neighbours pair up for the chat: each with the nearest one not yet taken. */
  private pairUp(people: readonly Body[]): void {
    this.partner.fill(-1);
    const free = people.map((b, i) => (b.alpha > 0.3 ? i : -1)).filter((i) => i >= 0);
    while (free.length > 1) {
      const i = free.shift()!;
      let best = 0;
      for (let k = 1; k < free.length; k++) {
        const a = people[free[k]];
        const b = people[free[best]];
        if (Math.hypot(a.x - people[i].x, a.y - people[i].y) < Math.hypot(b.x - people[i].x, b.y - people[i].y)) best = k;
      }
      const j = free.splice(best, 1)[0];
      this.partner[i] = j;
      this.partner[j] = i;
    }
  }

  /** How fast person `i` travels sideways, px/s: zero when standing (or just arrived somewhere new). */
  private moved(i: number, b: Body, dt: number): number {
    const lx = this.lastX[i];
    const ly = this.lastY[i];
    this.lastX[i] = b.x;
    this.lastY[i] = b.y;
    if (!(dt > 0) || Number.isNaN(lx)) return 0;
    const vx = (b.x - lx) / dt;
    const jump = Math.hypot(b.x - lx, b.y - ly) > b.r * 3;
    return !jump && Math.abs(vx) > Math.max(20, b.r * 0.6) ? vx : 0;
  }

  /** Face `slot` drawn on body `b` (an equal share's radius `r0`), or null when it is too small to read. */
  paint(slot: number, look: FaceLook, shape: AgentShape, b: Body, r0: number, reduced: boolean, now = Infinity): FaceDrawing | null {
    const f = this.field;
    f.size(slot, b.r, r0);
    // a face's radius, in quarter pixels: a body growing smoothly redraws its face only now and then
    const s = Math.round(faceRadius(b.r, r0) * 4) / 4;
    // too small to read: it holds still, and costs nothing
    f.still[slot] = s < 7 ? 1 : 0;
    const print = (f.signature(slot, reduced) ^ Math.imul(LOOK_CODE[look] * 131 + shape.length * 7 + shape.charCodeAt(0), 2654435761) ^ Math.round(s * 4) * 977) >>> 0;
    if (print === this.prints[slot]) return this.drawn[slot];
    this.prints[slot] = print;
    const read = f.poseOf(slot, reduced);
    const painter = this.painters[slot];
    this.drawn[slot] = painter.paint(look, shape, Math.max(0.6, b.r), s, read.pose, read.marks, f.seed[slot], now);
    // a mood held back for a moment is not forgotten: look again next frame
    if (painter.stale) this.prints[slot] = NaN;
    return this.drawn[slot];
  }
}

/** How long a line's mouth moves, seconds: as long as its words take to arrive. */
export function talkSeconds(text: string): number {
  return Math.min(4, 0.4 + text.length * 0.045);
}
