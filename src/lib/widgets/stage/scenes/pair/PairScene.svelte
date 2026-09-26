<script lang="ts">
  /**
   * The pair stage — Scenes 1–11 of the iteration-2 brief, on the step player.
   *
   * One stage, one continuous subject (ADR-015): the two circles the crowd
   * leaves standing ARE Blue and Red, the same two DOM nodes from the title to
   * the room. Everything the reader can see is drawn from the current step's
   * pose (script.ts); `settle` draws a pose at once and `play` animates into
   * it. The step player decides when; this file decides what.
   *
   * Words are never written here: every line is a message key (A2), and every
   * number in a line is read off the pose on screen. Within a panel the lines
   * pile up as comic bubbles (bubbles.ts), so the reader can re-read.
   */
  import { getContext, onMount } from 'svelte';
  import { gsap } from '../../gsap';
  import Bubble from '../../Bubble.svelte';
  import Coin from '../Coin.svelte';
  import Reel from './Reel.svelte';
  import Teletype from './Teletype.svelte';
  import { STEP_STAGE_CONTEXT, readingMs, type Speaker, type StepStageContext } from '../../steps';
  import { CALLS, PAIR_STEPS, REACTIONS, indexOf, panelStart, valuesFor, type Pose } from './script';
  import { BIG, BITES, CROWD, SMALL } from './crowd';
  import { deciderFace, pairLayout, pile } from './layout';
  import { bubbleLines, bubbleWords, stackBubbles, type BubbleChoice } from '../../bubbles';
  import {
    CLASSIC_AGENT_FILL,
    CLASSIC_AGENT_STROKE,
    PROTAGONISTS,
    assignStyles,
  } from '../../../shared/agentStyle';
  import { svgShapePath } from '../../../shared/shapePath';
  import { ambientClock, breath } from '../../ambient';
  import { getTextDirection, say } from '$lib/i18n';
  import { openBranch } from '../../branch';

  const stage = getContext<StepStageContext | undefined>(STEP_STAGE_CONTEXT);

  const SOURCE_URL =
    'https://www.investing.com/news/stock-market-news/spacex-ipo-makes-elon-musk-worlds-first-trillionaire-4741087';
  const CREDIT_URL = 'https://github.com/hamed';

  /** A `·` list from prose.md arrives as numbered messages; read them back in order. */
  function words(key: string): string[] {
    const out: string[] = [];
    for (let i = 1; i < 40; i++) {
      const word = say(`${key}_${i}`);
      if (word === `${key}_${i}`) break;
      out.push(word);
    }
    return out;
  }

  const MATH_WORDS = words('open_reel_math');
  /** The reel lands third from last, with two wrong words after it to overshoot onto. */
  const MATH_AT = MATH_WORDS.length - 3;

  /** Which crowd circle each protagonist is. */
  const WHO: Record<Speaker, number> = { blue: BIG, red: SMALL };
  const PAIR: readonly Speaker[] = ['blue', 'red'];
  const whoIs = (i: number): Speaker | null => (i === BIG ? 'blue' : i === SMALL ? 'red' : null);
  const other = (who: Speaker): Speaker => (who === 'blue' ? 'red' : 'blue');

  /** A bubble's lines arrive this far apart (3.1: "they feel timed"). */
  const LINE_BEAT_MS = 700;

  // ---- measuring -----------------------------------------------------------

  let host: HTMLDivElement;
  let mathReel: HTMLSpanElement;
  let width = $state(0);
  let height = $state(0);
  /** MERIT and Blue come first in the reading direction: in Farsi they stand on the right. */
  const rtl = getTextDirection() === 'rtl';
  const L = $derived(pairLayout(width, height, 100, rtl));

  /** The room's other ninety-eight wear the ordinary costumes (A5 keeps them off the pair's). */
  const ROOM_STYLES = assignStyles(100);

  // ---- the view: every number the stage draws, tweened by GSAP ---------------

  interface Person {
    x: number;
    y: number;
    r: number;
    alpha: number;
  }
  interface Token {
    x: number;
    y: number;
    on: number;
    face: 'front' | 'back';
  }

  const view = $state({
    type: 0,
    meritOn: 0,
    orOn: 0,
    mathOn: 0,
    mathPos: 0,
    markOn: 0,
    compact: 0,
    titleOn: 1,
    lift: 0,
    people: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, r: 0, alpha: 1 })) as Person[],
    paint: { blue: 0, red: 0 },
    coinsOn: 0,
    held: { blue: 15, red: 1 },
    table: { blue: 0, red: 0 },
    flipOn: 0,
    /** The decider's turn, radians: faces change exactly when it is edge-on. */
    flipAngle: 0,
    flipLift: 0,
    /** 0 — a plain coin, nobody's colour yet; 1 — each face in its owner's colour. */
    flipTint: 0,
    roomOn: 0,
    payout: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, on: 0, face: 'front' })) as Token[],
    fly: [] as Token[],
  });

  // ---- poses → the view ----------------------------------------------------

  /** A hold still waiting is drawn from what the reader has done so far. */
  const reader = $state({ named: { blue: false, red: false }, held: { blue: 15, red: 1 } });

  function poseAt(index: number): Pose {
    const step = PAIR_STEPS[index];
    if (step.wait.kind !== 'action' || stage?.isReleased(step.id)) return step.pose;
    if (step.id === 'equal') return { ...step.pose, holdings: { ...reader.held } };
    // only the one calling is still waiting; whoever was clicked before stays named
    const caller = callerOf(step.id);
    return caller ? { ...step.pose, named: { ...step.pose.named, [caller]: reader.named[caller] } } : step.pose;
  }

  function pairSpot(pose: Pose, who: Speaker) {
    if (pose.place === 'room') return L.room.positions[who === 'blue' ? L.room.blue : L.room.red];
    if (pose.place === 'seats') return who === 'blue' ? L.seatBlue : L.seatRed;
    return who === 'blue' ? L.markBlue : L.markRed;
  }

  function pairRadius(pose: Pose, who: Speaker): number {
    if (pose.place === 'room') return L.room.radius;
    return Math.max(L.minRadius, L.radius(pose.holdings[who]));
  }

  /** Where each of the sixteen is, and how big, in a pose. */
  function people(pose: Pose): Person[] {
    const one = L.radius(1);
    return L.crowdHomes.map((home, i) => {
      const who = whoIs(i);
      if (pose.crowd === 'idle') return { x: home.x, y: home.y, r: one * 0.42, alpha: 1 };
      if (pose.crowd === 'paid') return { x: home.x, y: home.y, r: one, alpha: 1 };
      if (!who) return { x: home.x, y: home.y, r: 0, alpha: 0 };
      if (pose.crowd === 'bitten') {
        const coins = who === 'blue' ? 15 : 1;
        return { x: home.x, y: L.ground - L.radius(coins), r: L.radius(coins), alpha: 1 };
      }
      const spot = pairSpot(pose, who);
      return { x: spot.x, y: spot.y, r: pairRadius(pose, who), alpha: 1 };
    });
  }

  /** The decider at rest: plain before a toss, the winner's face after. */
  function restingAngle(pose: Pose): number {
    return pose.flip === 'blue' ? Math.PI : 0;
  }

  function target(pose: Pose) {
    return {
      type: pose.teletype ? 1 : 0,
      meritOn: pose.merit ? 1 : 0,
      orOn: pose.or ? 1 : 0,
      mathOn: pose.math ? 1 : 0,
      mathPos: pose.math ? MATH_AT : 0,
      markOn: pose.mark ? 1 : 0,
      compact: pose.compact ? 1 : 0,
      titleOn: pose.cleared ? 0 : 1,
      lift: pose.cleared ? -L.height * 0.2 : 0,
      paint: { blue: pose.named.blue ? 1 : 0, red: pose.named.red ? 1 : 0 },
      coinsOn: pose.coins && pose.place !== 'room' ? 1 : 0,
      held: { ...pose.holdings },
      table: { ...pose.table },
      flipOn: pose.flip === 'hidden' ? 0 : 1,
      flipAngle: restingAngle(pose),
      flipTint: pose.flip === 'blue' || pose.flip === 'red' ? 1 : 0,
      roomOn: pose.place === 'room' ? 1 : 0,
    };
  }

  let timeline: ReturnType<typeof gsap.timeline> | null = null;

  function stopMotion(): void {
    timeline?.kill();
    timeline = null;
    for (const token of view.fly) gsap.killTweensOf(token);
    view.fly = [];
    for (const token of view.payout) token.on = 0;
    dragging = null;
  }

  /** Draw a pose at once. */
  function draw(pose: Pose): void {
    const t = target(pose);
    view.type = t.type;
    view.meritOn = t.meritOn;
    view.orOn = t.orOn;
    view.mathOn = t.mathOn;
    view.mathPos = t.mathPos;
    view.markOn = t.markOn;
    view.compact = t.compact;
    view.titleOn = t.titleOn;
    view.lift = t.lift;
    view.paint.blue = t.paint.blue;
    view.paint.red = t.paint.red;
    view.coinsOn = t.coinsOn;
    view.held = t.held;
    view.table = t.table;
    view.flipOn = t.flipOn;
    view.flipAngle = t.flipAngle;
    view.flipLift = 0;
    view.flipTint = t.flipTint;
    view.roomOn = t.roomOn;
    people(pose).forEach((p, i) => Object.assign(view.people[i], p));
  }

  // ---- the player's verbs ----------------------------------------------------

  let current = $state(0);

  function settle(index: number): void {
    current = index;
    stopMotion();
    stopCalls();
    reaction = null;
    draw(poseAt(index));
    showAll(index);
    enter(index);
  }

  function play(index: number, from: number): void {
    current = index;
    stopMotion();
    stopCalls();
    reaction = null;
    if (from >= 0) draw(poseAt(from));
    const step = PAIR_STEPS[index];
    const pose = poseAt(index);
    timeline = gsap.timeline();
    choreograph(step.action, pose, timeline);
    revealLines(index);
    enter(index);
  }

  function nudge(index: number): void {
    const id = PAIR_STEPS[index].id;
    const caller = callerOf(id);
    if (caller) callOut(caller);
    if (id === 'equal') wiggle('blue');
  }

  function hurry(index: number): boolean {
    if (reveal.id !== PAIR_STEPS[index].id || reveal.shown >= reveal.total) return false;
    showAll(index);
    return true;
  }

  function readingTime(index: number): number {
    const line = PAIR_STEPS[index].lines?.[0];
    if (!line) return readingMs(0);
    const text = say(line.message, valuesFor(PAIR_STEPS[index]));
    return readingMs(bubbleWords(text)) + (bubbleLines(text).length - 1) * LINE_BEAT_MS;
  }

  /** Things a step starts that are not tweens: the calls, the coin mover. */
  function enter(index: number): void {
    const id = PAIR_STEPS[index].id;
    const caller = callerOf(id);
    if (caller && !stage?.isReleased(id)) startCalls(caller);
    if (id === 'equal' && !stage?.isReleased('equal')) reacted = { first: false, eleven: false, over: false };
  }

  // ---- the bubbles: one comic panel per topic --------------------------------

  interface Said {
    id: string;
    /** Whose colours the bubble wears; null for a circle not yet introduced. */
    who: Speaker | null;
    /** Which circle it points at. */
    at: Speaker;
    text: string;
    choices?: readonly BubbleChoice[];
  }

  /** The line of a Scene 3 hold, once more and a little louder each time. */
  const callLevel = $state({ blue: 0, red: 0 });
  /** A coin-moving reaction (Scene 5), spoken on an event rather than a step. */
  let reaction = $state<Said | null>(null);

  const callerOf = (id: string): Speaker | null => (id === CALLS.red ? 'red' : id === CALLS.blue ? 'blue' : null);

  const said = $derived.by((): Said[] => {
    const out: Said[] = [];
    for (let i = panelStart(current); i <= current; i++) {
      const step = PAIR_STEPS[i];
      const line = step.lines?.[0];
      if (!line || !line.who) continue;
      const caller = callerOf(step.id);
      if (caller) {
        const waiting = !(view.paint[caller] > 0.5);
        const level = waiting ? callLevel[caller] : 0;
        const pool = caller === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
        out.push({ id: `${step.id}#${level}`, who: waiting ? null : caller, at: caller, text: say(pool[level]) });
        continue;
      }
      out.push({ id: step.id, who: line.who, at: line.who, text: say(line.message, valuesFor(step)) });
    }
    if (reaction && current === indexOf('equal')) out.push(reaction);
    const last = out[out.length - 1];
    if (last && PAIR_STEPS[current].pose.choice) {
      out[out.length - 1] = {
        ...last,
        choices: [
          { label: say('more_choice_1'), act: tellMe },
          { label: say('more_choice_2'), act: notNow },
        ],
      };
    }
    return out;
  });

  /** The newest bubble's lines, arriving one by one. */
  let reveal = $state({ id: '', shown: Infinity, total: 0 });
  let revealTimer: number | undefined;

  function stopReveal(): void {
    if (revealTimer !== undefined) window.clearInterval(revealTimer);
    revealTimer = undefined;
  }

  function revealLines(index: number): void {
    stopReveal();
    const step = PAIR_STEPS[index];
    const line = step.lines?.[0];
    if (!line) return;
    const total = bubbleLines(say(line.message)).length;
    if (total <= 1 || stage?.reduced) {
      reveal = { id: step.id, shown: Infinity, total };
      return;
    }
    reveal = { id: step.id, shown: 1, total };
    revealTimer = window.setInterval(() => {
      reveal.shown += 1;
      if (reveal.shown >= total) stopReveal();
    }, LINE_BEAT_MS);
  }

  function showAll(index: number): void {
    stopReveal();
    reveal = { id: PAIR_STEPS[index].id, shown: Infinity, total: 0 };
  }

  const sizes = $state<Record<string, { w: number; h: number }>>({});

  /** The band the talk lives in: under the title (small by now), over the two. */
  const region = $derived.by(() => {
    const pose = poseAt(current);
    const font = Math.min(108.8, Math.max(32, Math.min(width * 0.08, height * 0.13)));
    const top = pose.cleared ? height * 0.05 : height * 0.03 + font * 0.72 + 12;
    const tops =
      pose.place === 'room'
        ? [L.room.top]
        : PAIR.map((who) => pairSpot(pose, who).y - Math.max(pairRadius(pose, who), L.minRadius));
    const bottom = Math.max(top + 90, Math.min(...tops) - 6);
    return { top, bottom, left: 16, right: width - 16 };
  });

  const placed = $derived(
    stackBubbles(
      said.map((b) => ({ w: sizes[b.id]?.w ?? 0, h: sizes[b.id]?.h ?? 0, anchor: anchorOf(b.at) })),
      region,
    ),
  );

  function anchorOf(who: Speaker) {
    const p = view.people[WHO[who]];
    return { x: p.x, y: p.y, r: Math.max(p.r, L.minRadius) };
  }

  // ---- choreography ----------------------------------------------------------

  function tweenTo(pose: Pose, tl: ReturnType<typeof gsap.timeline>, at = 0, duration = 0.6): void {
    const t = target(pose);
    tl.to(
      view,
      {
        type: t.type,
        meritOn: t.meritOn,
        orOn: t.orOn,
        mathOn: t.mathOn,
        markOn: t.markOn,
        compact: t.compact,
        titleOn: t.titleOn,
        lift: t.lift,
        coinsOn: t.coinsOn,
        flipOn: t.flipOn,
        roomOn: t.roomOn,
        duration,
        ease: 'power2.inOut',
      },
      at,
    );
    tl.to(view.paint, { ...t.paint, duration: 0.35, ease: 'back.out(2)' }, at);
    people(pose).forEach((p, i) => tl.to(view.people[i], { ...p, duration, ease: 'power2.inOut' }, at));
    tl.call(
      () => {
        view.held = t.held;
        view.table = t.table;
        view.flipAngle = t.flipAngle;
        view.flipTint = t.flipTint;
      },
      [],
      at + duration,
    );
  }

  function spin(tl: ReturnType<typeof gsap.timeline>, answer: number): void {
    tl.set(view, { mathPos: 0 });
    tl.to(view, { mathOn: 1, duration: 0.25, ease: 'none' });
    // Slow enough to read the two funny words, then a steady readable run past
    // the answer (never under about a quarter second a word), two words over,
    // and back to rest.
    tl.to(view, { mathPos: 2, duration: 1.1, ease: 'sine.in' });
    tl.to(view, { mathPos: answer + 2, duration: answer / 3.6, ease: 'none' });
    tl.to(view, { mathPos: answer, duration: 0.75, ease: 'power2.inOut' });
  }

  function choreograph(action: string | undefined, pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    switch (action) {
      case 'type':
        tl.to(view, { type: 1, duration: 3.6, ease: 'none' }, 0.5);
        return;
      case 'merit':
        tl.to(view, { meritOn: 1, duration: 0.9, ease: 'power1.out' });
        return;
      case 'or':
        tl.to(view, { orOn: 1, duration: 0.6, ease: 'none' });
        return;
      case 'reel-math':
        spin(tl, MATH_AT);
        return;
      case 'payout':
        payout(tl);
        return;
      case 'bites':
        bites(tl);
        return;
      case 'gather':
        tweenTo(pose, tl, 0, 1.3);
        return;
      case 'clear':
        tweenTo(pose, tl, 0, 1.1);
        return;
      case 'ante':
        ante(pose, tl);
        return;
      case 'toss':
        toss(pose, tl);
        return;
      case 'room':
        tweenTo(pose, tl, 0, 1.2);
        return;
      default:
        tweenTo(pose, tl, 0, 0.6);
    }
  }

  /** Coins pop out of the MATH reel and fly down, one to each person (Scene 2). */
  function payout(tl: ReturnType<typeof gsap.timeline>): void {
    const hostBox = host.getBoundingClientRect();
    const reelBox = mathReel.getBoundingClientRect();
    const from = { x: reelBox.left - hostBox.left + reelBox.width / 2, y: reelBox.top - hostBox.top + reelBox.height / 2 };
    const one = L.radius(1);
    tl.to(view, { markOn: 1, duration: 0.5, ease: 'none' }, 0);
    view.people.forEach((person, i) => {
      const token = view.payout[i];
      const at = 0.15 + (i * 1.5) / CROWD;
      tl.set(token, { x: from.x, y: from.y, on: 1 }, at);
      tl.to(token, { x: person.x, duration: 0.6, ease: 'power1.out' }, at);
      tl.to(token, { y: person.y, duration: 0.6, ease: 'power2.in' }, at);
      tl.set(token, { on: 0 }, at + 0.6);
      tl.to(person, { r: one, duration: 0.25, ease: 'back.out(3)' }, at + 0.6);
    });
  }

  /** The bites, exactly as crowd.ts scripts them — the rule on every contact. */
  function bites(tl: ReturnType<typeof gsap.timeline>): void {
    for (let k = 0; k < BITES.length; k++) {
      const bite = BITES[k];
      const next = BITES[k + 1]?.at ?? bite.at + 0.4;
      const hop = Math.min(0.2, (next - bite.at) * 0.6);
      const winner = view.people[bite.winner];
      const loserIndex = bite.winner === bite.a ? bite.b : bite.a;
      const loser = view.people[loserIndex];
      const rw = L.radius(bite.after[bite.winner]);
      const rl = bite.absorbed === loserIndex ? 0 : L.radius(bite.after[loserIndex]);
      // the biter reaches its victim: they touch, the stake crosses
      tl.to(
        winner,
        {
          x: () => loser.x + Math.sign(winner.x - loser.x || 1) * (winner.r + loser.r) * 0.9,
          y: () => loser.y + (loser.r - winner.r) * 0.2,
          duration: hop,
          ease: 'power2.out',
        },
        bite.at,
      );
      tl.to(winner, { r: rw, duration: hop, ease: 'power1.out' }, bite.at + hop * 0.6);
      tl.to(loser, { r: rl, duration: hop, ease: 'power1.in' }, bite.at + hop * 0.6);
      if (bite.absorbed === loserIndex) tl.to(loser, { alpha: 0, duration: hop }, bite.at + hop);
    }
    // everyone left settles back onto the ground
    const end = BITES[BITES.length - 1].at + 0.3;
    for (const i of [BIG, SMALL]) {
      tl.to(view.people[i], { y: L.ground - L.radius(i === BIG ? 15 : 1), duration: 0.3 }, end);
    }
  }

  /** Where coin `k` of a fortune of `count` sits on the stage right now. */
  function coinSpot(who: Speaker, count: number, k: number) {
    const person = view.people[WHO[who]];
    const spots = pile(count, L.coinRadius, Math.max(L.minRadius, L.radius(count)));
    const spot = spots[Math.max(0, Math.min(k, spots.length - 1))] ?? { x: 0, y: 0 };
    return { x: person.x + spot.x, y: person.y + spot.y };
  }

  /** Stakes leave each fortune, one coin at a time, and land on the table. */
  function ante(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const stake = pose.table.blue;
    const before = { blue: pose.holdings.blue + stake, red: pose.holdings.red + stake };
    const starts: Token[] = [];
    for (const who of ['red', 'blue'] as Speaker[]) {
      for (let k = 0; k < stake; k++) {
        const from = coinSpot(who, before[who], before[who] - 1 - k);
        starts.push({ x: from.x, y: from.y, on: 1, face: k % 2 ? 'back' : 'front' });
      }
    }
    view.fly = starts;
    const slots = tableSlots(stake, stake);
    tl.call(() => {
      view.held = { ...pose.holdings };
    });
    view.fly.forEach((token, k) => {
      tl.to(token, { x: slots[k].x, y: slots[k].y, duration: 0.75, ease: 'power2.inOut' }, 0.05 + k * 0.09);
    });
    for (const who of ['blue', 'red'] as Speaker[]) {
      tl.to(view.people[WHO[who]], { r: pairRadius(pose, who), duration: 0.6, ease: 'power2.inOut' }, 0.15);
    }
    tl.call(() => {
      view.fly = [];
      view.table = { ...pose.table };
    });
  }

  /**
   * The decider goes up turning and comes down on the winner's face. A face
   * only ever changes while the coin is edge-on, and each face wears its
   * owner's colour from the moment it is tossed: Marx is Red's, the bank is
   * Blue's (brief 3.5). Then the table goes to the winner.
   */
  function toss(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const winner: Speaker = pose.flip === 'blue' ? 'blue' : 'red';
    const start = view.flipAngle;
    const turns = 5;
    const end = start - (start % (2 * Math.PI)) + turns * 2 * Math.PI + (winner === 'blue' ? Math.PI : 0);
    const high = -L.whole * 0.9;
    tl.to(view, { flipOn: 1, duration: 0.2 }, 0);
    tl.set(view, { flipTint: 1 }, 0.15);
    tl.to(view, { flipAngle: end, duration: 2.1, ease: 'power3.out' }, 0.15);
    tl.to(view, { flipLift: high, duration: 0.95, ease: 'power2.out' }, 0.15);
    tl.to(view, { flipLift: 0, duration: 0.9, ease: 'bounce.out' }, 1.1);
    const landed = 2.4;
    // The stakes on the table become flying coins once the coin has landed;
    // they are made now, hidden, so the timeline owns every tween it plays.
    const slots = tableSlots(view.table.blue, view.table.red);
    view.fly = slots.map((slot, k) => ({ x: slot.x, y: slot.y, on: 0, face: k % 2 ? 'back' : 'front' }));
    const to = view.people[WHO[winner]];
    tl.call(
      () => {
        for (const token of view.fly) token.on = 1;
        view.table = { blue: 0, red: 0 };
      },
      [],
      landed,
    );
    view.fly.forEach((token, k) => {
      tl.to(token, { x: to.x, y: to.y, duration: 0.5, ease: 'power2.in' }, landed + 0.05 + k * 0.05);
    });
    const done = landed + 0.6 + slots.length * 0.05;
    tl.call(
      () => {
        view.fly = [];
        view.held = { ...pose.holdings };
      },
      [],
      done,
    );
    for (const who of ['blue', 'red'] as Speaker[]) {
      tl.to(view.people[WHO[who]], { r: pairRadius(pose, who), duration: 0.35, ease: 'back.out(2)' }, done);
    }
  }

  /** Where staked coins sit: each one's half-stack on his own side of the table. */
  function tableSlots(blue: number, red: number) {
    const r = L.coinRadius;
    const toward = (who: Speaker) => Math.sign(pairSpot(poseAt(current), who).x - L.table.x) || (who === 'blue' ? -1 : 1);
    const slots: { x: number; y: number }[] = [];
    for (let k = 0; k < red; k++) slots.push({ x: L.table.x + toward('red') * r * (1.3 + k * 1.15), y: L.table.y });
    for (let k = 0; k < blue; k++) slots.push({ x: L.table.x + toward('blue') * r * (1.3 + k * 1.15), y: L.table.y });
    return slots;
  }

  // ---- Scene 3: meeting them -------------------------------------------------

  let callTimer: number | undefined;

  function stopCalls(): void {
    if (callTimer !== undefined) window.clearTimeout(callTimer);
    callTimer = undefined;
  }

  function startCalls(who: Speaker): void {
    callLevel[who] = 0;
    callTimer = window.setTimeout(() => callOut(who), 4200);
  }

  /** The caller tries again, a little louder, while the reader has not clicked. */
  function callOut(who: Speaker): void {
    stopCalls();
    if (view.paint[who] > 0.5) return;
    const pool = who === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
    callLevel[who] = Math.min(pool.length - 1, callLevel[who] + 1);
    if (stage?.reduced) return;
    callTimer = window.setTimeout(() => callOut(who), 4000 + Math.random() * 2500);
  }

  function name(who: Speaker): void {
    const id = CALLS[who];
    if (current !== indexOf(id) || reader.named[who]) return;
    reader.named = { ...reader.named, [who]: true };
    stopCalls();
    gsap.fromTo(view.paint, { [who]: 0 }, { [who]: 1, duration: 0.4, ease: 'back.out(2.5)' });
    stage?.release(id);
  }

  // ---- Scene 5: the reader makes them equal ----------------------------------

  let reacted = { first: false, eleven: false, over: false };
  const holding = $derived(current === indexOf('equal') && !stage?.isReleased('equal') && stage?.index === indexOf('equal'));

  function react(key: string, who: Speaker): void {
    reaction = { id: `react:${key}`, who, at: who, text: say(key) };
  }

  /** A coin on its way from one fortune to the other, drawn where it is. */
  interface Flight {
    token: Token;
    to: Speaker;
  }
  let flights: Flight[] = [];

  function launch(from: Speaker, start: { x: number; y: number }): void {
    const to = other(from);
    reader.held = { ...reader.held, [from]: reader.held[from] - 1 };
    view.held = { ...view.held, [from]: view.held[from] - 1 };
    gsap.to(view.people[WHO[from]], { r: Math.max(L.minRadius, L.radius(reader.held[from])), duration: 0.3, ease: 'back.out(2)' });
    view.fly = [...view.fly, { x: start.x, y: start.y, on: 1, face: 'front' }];
    const token = view.fly[view.fly.length - 1];
    const flight = { token, to };
    flights.push(flight);
    const landing = reader.held[to] + flights.filter((f) => f.to === to).length;
    const spot = coinSpot(to, landing, landing - 1);
    const reduced = stage?.reduced ?? false;
    gsap.to(token, {
      x: spot.x,
      y: spot.y,
      duration: reduced ? 0 : 0.5,
      ease: 'power2.inOut',
      onComplete: () => land(flight),
    });
  }

  function land(flight: Flight): void {
    flights = flights.filter((f) => f !== flight);
    flight.token.on = 0;
    if (flights.length === 0) view.fly = [];
    const to = flight.to;
    reader.held = { ...reader.held, [to]: reader.held[to] + 1 };
    view.held = { ...view.held, [to]: view.held[to] + 1 };
    gsap.to(view.people[WHO[to]], { r: Math.max(L.minRadius, L.radius(reader.held[to])), duration: 0.3, ease: 'back.out(2)' });
    const held = reader.held;
    if (held.blue === 8 && held.red === 8 && flights.length === 0) {
      reaction = null;
      stage?.release('equal');
      return;
    }
    if (!reacted.first) {
      reacted.first = true;
      react(REACTIONS.equalFirst, 'blue');
    } else if (held.blue === 11 && !reacted.eleven) {
      reacted.eleven = true;
      react(REACTIONS.equalEleven, 'blue');
    } else if (held.red > 8 && !reacted.over) {
      reacted.over = true;
      react(REACTIONS.equalOverBlue, 'blue');
      window.setTimeout(() => {
        if (holding) react(REACTIONS.equalOverRed, 'red');
      }, 1700);
    } else if (held.red <= 8) {
      reacted.over = false;
    }
  }

  /** A tap or a key on a fortune sends one of its coins, visibly, to the other. */
  function give(from: Speaker): void {
    if (!holding || reader.held[from] <= 0) return;
    launch(from, coinSpot(from, reader.held[from], reader.held[from] - 1));
  }

  /** A coin being dragged across by the reader: it follows the finger. */
  let dragging = $state<{ from: Speaker; x: number; y: number; start: { x: number; y: number }; moved: boolean } | null>(null);

  function local(event: PointerEvent) {
    const box = host.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function dragStart(event: PointerEvent, who: Speaker): void {
    if (!holding || reader.held[who] <= 0) return;
    const at = local(event);
    dragging = { from: who, x: at.x, y: at.y, start: at, moved: false };
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  function dragMove(event: PointerEvent): void {
    if (!dragging) return;
    const at = local(event);
    dragging.x = at.x;
    dragging.y = at.y;
    if (Math.hypot(at.x - dragging.start.x, at.y - dragging.start.y) > 6) dragging.moved = true;
  }

  function dragEnd(event: PointerEvent): void {
    if (!dragging) return;
    const { from, moved } = dragging;
    const at = local(event);
    dragging = null;
    pointerDone = true;
    if (!moved) {
      give(from);
      return;
    }
    const p = view.people[WHO[other(from)]];
    // dropped on the other fortune: it lands there; anywhere else: it goes home
    if (Math.hypot(at.x - p.x, at.y - p.y) <= Math.max(p.r, 44)) launch(from, at);
  }

  /** A pointer tap is handled by pointerup; a click with no pointer is a key. */
  let pointerDone = false;
  function onKeyClick(event: MouseEvent, who: Speaker): void {
    if (pointerDone || event.detail !== 0) {
      pointerDone = false;
      return;
    }
    give(who);
  }

  /** At a hold, a forward gesture wiggles whoever is waiting to be acted on. */
  let wiggling = $state<{ who: Speaker; until: number } | null>(null);
  function wiggle(who: Speaker): void {
    wiggling = { who, until: seconds + 0.6 };
  }

  // ---- Scene 11: the choice ---------------------------------------------------

  function tellMe(): void {
    openBranch('cow');
  }

  /** Past the stage — the gesture the last step would have handed to the page anyway. */
  function notNow(): void {
    const section = host.closest('section');
    window.scrollTo({
      top: window.scrollY + (section?.getBoundingClientRect().bottom ?? window.innerHeight),
      behavior: stage?.reduced ? 'auto' : 'smooth',
    });
  }

  // ---- drawing helpers -------------------------------------------------------

  let seconds = $state(0);

  function costumeFill(i: number): string {
    const who = whoIs(i);
    if (!who) return CLASSIC_AGENT_FILL;
    return view.paint[who] > 0.5 ? PROTAGONISTS[who].fill : CLASSIC_AGENT_FILL;
  }

  function costumeStroke(i: number): string {
    const who = whoIs(i);
    if (!who) return CLASSIC_AGENT_STROKE;
    return view.paint[who] > 0.5 ? PROTAGONISTS[who].stroke : CLASSIC_AGENT_STROKE;
  }

  /**
   * Once named, the two wear a heavier edge than anyone else, so they stay
   * findable in a costumed room of a hundred (brief checklist). Not the dashed
   * halo — that already means "the richest" (4.2).
   */
  function strokeWidth(i: number): number {
    const who = whoIs(i);
    if (!who) return 1.3;
    return view.paint[who] > 0.5 ? 2.6 : i === BIG ? 1.8 : 1.3;
  }

  function pop(i: number): number {
    const who = whoIs(i);
    if (!who) return 1;
    const p = view.paint[who];
    return p > 0 && p < 1 ? 1 + Math.sin(p * Math.PI) * 0.12 : 1;
  }

  /** Breath for the pair, a hop and a jiggle for the crowd — ambient, on the inner group only. */
  function life(i: number): string {
    if (stage?.reduced) return '';
    const b = breath(seconds, i);
    const crowdPhase = PAIR_STEPS[current]?.pose.crowd;
    let hop = 0;
    if (crowdPhase === 'idle' || crowdPhase === 'paid') {
      const r = view.people[i].r;
      hop = Math.max(0, Math.sin(seconds * 2.1 + i * 1.3)) ** 6 * r * 0.9;
    }
    let shake = 0;
    if (wiggling && whoIs(i) === wiggling.who && seconds < wiggling.until) shake = Math.sin(seconds * 42) * 4;
    return `translate(${(b.dx + shake).toFixed(2)} ${(b.dy - hop).toFixed(2)}) scale(${(b.scale * pop(i)).toFixed(4)})`;
  }


  onMount(() => {
    const observer = new ResizeObserver(() => {
      width = host.clientWidth;
      height = host.clientHeight;
      // a resize re-lays everything out: draw the current step where it now belongs
      if (!timeline || !timeline.isActive()) draw(poseAt(current));
    });
    width = host.clientWidth;
    height = host.clientHeight;
    observer.observe(host);
    stage?.attach(PAIR_STEPS, { play, settle, nudge, hurry, readingMs: readingTime });
    const stopAmbient = ambientClock((s) => (seconds = s), stage?.reduced ?? false);
    return () => {
      observer.disconnect();
      stopAmbient();
      stopMotion();
      stopCalls();
      stopReveal();
    };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="pair-scene" bind:this={host} onpointermove={dragMove}>
  <!-- Once the stage is cleared (Scene 5) its words are gone, so their links
       must not stay in the tab order, invisible. -->
  <div class="words" style={`opacity:${view.titleOn}; transform: translateY(${view.lift}px)`} inert={view.titleOn < 0.5}>
    <div class="teletype-slot" style={`opacity:${1 - view.compact}`} inert={view.compact > 0.5}>
      <Teletype
        headline={say('open_headline')}
        source={say('open_source')}
        href={SOURCE_URL}
        progress={view.type}
        shown={1}
      />
    </div>

    <!-- In reading order: the common sense first, the question second. -->
    <h1
      class="title"
      aria-label={say('open_title')}
      style={`transform: translateY(${(-view.compact * height * 0.18).toFixed(1)}px) scale(${(1 - view.compact * 0.42).toFixed(3)})`}
    >
      <span class="word merit" style={`opacity:${view.meritOn}`} aria-hidden="true">{say('open_title_merit')}</span>
      <span class="word or" style={`opacity:${view.orOn}`} aria-hidden="true">{say('open_title_or')}</span>
      <span class="word math" bind:this={mathReel}>
        <Reel words={MATH_WORDS} answer={MATH_AT} position={view.mathPos} shown={view.mathOn} /><span
          class="mark"
          style={`opacity:${view.markOn}`}
          aria-hidden="true">{say('open_title_mark')}</span
        >
      </span>
    </h1>

    <a class="credit" href={CREDIT_URL} target="_blank" rel="author noreferrer" style={`opacity:${view.markOn}`}
      >{say('open_credit')}</a
    >
  </div>

  {#if width > 0}
    <svg class="art" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {#if view.roomOn > 0}
        <g class="room" opacity={view.roomOn}>
          {#each L.room.positions as spot, i (i)}
            {#if i !== L.room.blue && i !== L.room.red}
              <path
                d={svgShapePath(ROOM_STYLES[i].shape, L.room.radius)}
                transform={`translate(${spot.x} ${spot.y})`}
                fill={ROOM_STYLES[i].fill}
                stroke={ROOM_STYLES[i].stroke}
                fill-opacity="0.75"
                stroke-width="1.3"
              />
            {/if}
          {/each}
        </g>
      {/if}

      {#each view.people as person, i (i)}
        {#if person.alpha > 0.01 && person.r > 0.05}
          <g transform={`translate(${person.x.toFixed(2)} ${person.y.toFixed(2)})`} opacity={person.alpha}>
            <g transform={life(i)}>
              <circle
                r={person.r}
                fill={costumeFill(i)}
                stroke={costumeStroke(i)}
                fill-opacity={whoIs(i) && view.paint[whoIs(i)!] > 0.5 ? 0.75 : 1}
                stroke-width={strokeWidth(i)}
                vector-effect="non-scaling-stroke"
              />
              {#if whoIs(i) && view.coinsOn > 0.01}
                {@const count = view.held[whoIs(i)!]}
                <g opacity={view.coinsOn}>
                  {#each pile(count, L.coinRadius, Math.max(L.minRadius, L.radius(count))) as spot, k (k)}
                    <Coin cx={spot.x} cy={spot.y} r={L.coinRadius} face={k % 2 ? 'back' : 'front'} />
                  {/each}
                </g>
              {/if}
            </g>
          </g>
        {/if}
      {/each}

      {#each view.payout as token, i (i)}
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={L.coinRadius * 0.8} face={i % 2 ? 'back' : 'front'} />{/if}
      {/each}

      {#if view.table.blue + view.table.red > 0}
        {#each tableSlots(view.table.blue, view.table.red) as slot, k (k)}
          <Coin cx={slot.x} cy={slot.y} r={L.coinRadius} face={k % 2 ? 'back' : 'front'} />
        {/each}
      {/if}

      {#each view.fly as token, k (k)}
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={L.coinRadius} face={token.face} />{/if}
      {/each}

      {#if dragging}
        <g class="dragged"><Coin cx={dragging.x} cy={dragging.y} r={L.coinRadius * 1.1} face="front" /></g>
      {/if}

      {#if view.flipOn > 0.01}
        {@const face = deciderFace(view.flipAngle)}
        <g transform={`translate(${L.flip.x} ${(L.flip.y + view.flipLift).toFixed(2)})`} opacity={view.flipOn}>
          <g transform={`scale(${face.squash.toFixed(3)} 1)`}>
            <Coin
              r={L.coinRadius * 1.6}
              face={face.side === 'red' ? 'front' : 'back'}
              tint={view.flipTint > 0.5 ? PROTAGONISTS[face.side].fill : undefined}
            />
          </g>
        </g>
      {/if}
    </svg>

    <!-- the two circles as controls, over the art: each clicked in Scene 3, handed coins in Scene 5 -->
    {#each PAIR as who (who)}
      {@const p = view.people[WHO[who]]}
      {@const r = Math.max(p.r, 30)}
      {#if current === indexOf(CALLS[who]) && !reader.named[who] && !stage?.isReleased(CALLS[who])}
        <button
          type="button"
          class="hit"
          style={`left:${p.x - r}px; top:${p.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={say(who === 'blue' ? REACTIONS.callBlue[0] : REACTIONS.callRed[0])}
          onclick={() => name(who)}
        ></button>
      {:else if holding}
        <button
          type="button"
          class="hit coins"
          style={`left:${p.x - r}px; top:${p.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={say('equal_give', { name: say(`name_${who}`), other: say(`name_${other(who)}`), count: reader.held[who] })}
          onclick={(e) => onKeyClick(e, who)}
          onpointerdown={(e) => dragStart(e, who)}
          onpointerup={dragEnd}
        ></button>
      {/if}
    {/each}

    <div class="bubbles" aria-live="polite">
      {#each said as bubble, i (bubble.id)}
        {@const place = placed[i]}
        {#if place}
          <Bubble
            id={bubble.id}
            text={bubble.text}
            speaker={bubble.who}
            name={bubble.who ? say(`name_${bubble.who}`) : ''}
            x={place.x}
            y={place.y}
            tail={place.tail}
            gone={place.gone}
            shown={bubble.id === reveal.id ? reveal.shown : Infinity}
            choices={bubble.choices}
            onsize={(w, h) => (sizes[bubble.id] = { w, h })}
            onrest={(on) => stage?.pause(on)}
            reduced={stage?.reduced ?? false}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .pair-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--paper);
  }

  .art {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }

  .words {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .teletype-slot {
    position: absolute;
    inset-block-start: 5%;
    inset-inline-start: clamp(1rem, 10%, 7rem);
    pointer-events: auto;
  }

  .title {
    position: absolute;
    inset-block-start: 21%;
    inset-inline: 0;
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: clamp(0.4rem, 1.4vw, 1.4rem);
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(2rem, min(8vw, 13svh), 6.8rem);
    font-weight: 750;
    letter-spacing: -0.035em;
    line-height: 1.2;
    color: var(--ink-strong);
    white-space: nowrap;
    transform-origin: 50% 0;
  }

  .word.or {
    color: var(--accent);
    font-weight: 600;
  }

  .credit {
    position: absolute;
    inset-block-end: 3%;
    inset-inline-end: 5%;
    color: var(--ink-soft);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    text-decoration-color: var(--line);
    pointer-events: auto;
  }

  .hit {
    position: absolute;
    z-index: 3;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    touch-action: none;
  }

  .hit.coins {
    cursor: grab;
  }

  .hit:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 3px;
  }

  .dragged {
    filter: drop-shadow(0 3px 4px rgb(40 37 31 / 25%));
  }

  .bubbles {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }

  .bubbles :global(.bubble) {
    pointer-events: auto;
  }
</style>
