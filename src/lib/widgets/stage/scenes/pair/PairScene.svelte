<script lang="ts">
  /**
   * The pair stage — Scenes 1–14 of the dialogue brief, on the step player.
   *
   * One stage, one continuous subject (ADR-015): the two circles the crowd
   * leaves standing ARE Blue and Red, the same two DOM nodes from the title to
   * the room. Everything the reader can see is drawn from the current step's
   * pose (script.ts); `settle` draws a pose at once and `play` animates into
   * it. The step player decides when; this file decides what.
   *
   * Words are never written here: every line is a message key (A2), and every
   * number in a line is read off the pose on screen.
   */
  import { getContext, onMount } from 'svelte';
  import { gsap } from '../../gsap';
  import Bubble from '../../Bubble.svelte';
  import Coin from '../Coin.svelte';
  import Reel from './Reel.svelte';
  import Teletype from './Teletype.svelte';
  import { STEP_STAGE_CONTEXT, type Speaker, type StepStageContext } from '../../steps';
  import { PAIR_STEPS, REACTIONS, indexOf, valuesFor, type Pose } from './script';
  import { BIG, BITES, CROWD, SMALL } from './crowd';
  import { lattice, pairLayout } from './layout';
  import {
    CLASSIC_AGENT_FILL,
    CLASSIC_AGENT_STROKE,
    PROTAGONISTS,
    assignStyles,
  } from '../../../shared/agentStyle';
  import { svgShapePath } from '../../../shared/shapePath';
  import { ambientClock, breath } from '../../ambient';
  import { say } from '$lib/i18n';
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

  const MERIT_WORDS = words('open_reel_merit');
  const MATH_WORDS = words('open_reel_math');
  /** Each reel lands third from last, with two wrong words after it to overshoot onto. */
  const MERIT_AT = MERIT_WORDS.length - 3;
  const MATH_AT = MATH_WORDS.length - 3;

  /** Which crowd circle each protagonist is. */
  const WHO: Record<Speaker, number> = { blue: BIG, red: SMALL };
  const PAIR: readonly Speaker[] = ['red', 'blue'];
  const whoIs = (i: number): Speaker | null => (i === BIG ? 'blue' : i === SMALL ? 'red' : null);

  // ---- measuring -----------------------------------------------------------

  let host: HTMLDivElement;
  let mathReel: HTMLSpanElement;
  let width = $state(0);
  let height = $state(0);
  const L = $derived(pairLayout(width, height));

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
  }

  const view = $state({
    type: 0,
    meritOn: 0,
    meritPos: 0,
    orOn: 0,
    mathOn: 0,
    mathPos: 0,
    markOn: 0,
    titleOn: 1,
    lift: 0,
    people: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, r: 0, alpha: 1 })) as Person[],
    paint: { blue: 0, red: 0 },
    coinsOn: 0,
    held: { blue: 15, red: 1 },
    table: { blue: 0, red: 0 },
    flipOn: 0,
    flipFace: 'red' as Speaker,
    flipSquash: 1,
    roomOn: 0,
    payout: Array.from({ length: CROWD }, () => ({ x: 0, y: 0, on: 0 })) as Token[],
    fly: [] as (Token & { face: 'front' | 'back' })[],
  });

  interface Said {
    /** Whose colour the bubble wears; null for a circle not yet named. */
    who: Speaker | null;
    /** Which circle it points at. */
    at: Speaker;
    text: string;
  }
  let said = $state<Said | null>(null);
  let choice = $state(false);
  let seconds = $state(0);

  // ---- poses → the view ----------------------------------------------------

  /** A hold still waiting is drawn from what the reader has done so far. */
  const reader = $state({ named: { blue: false, red: false }, held: { blue: 15, red: 1 } });

  function poseAt(index: number): Pose {
    const step = PAIR_STEPS[index];
    if (step.wait.kind !== 'action' || stage?.isReleased(step.id)) return step.pose;
    const before = index > 0 ? PAIR_STEPS[index - 1].pose : step.pose;
    if (step.id === 'call') return { ...before, named: { ...reader.named } };
    if (step.id === 'equal') return { ...before, holdings: { ...reader.held } };
    return before;
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

  function target(pose: Pose) {
    return {
      type: pose.teletype ? 1 : 0,
      meritOn: pose.merit ? 1 : 0,
      meritPos: pose.merit ? MERIT_AT : 0,
      orOn: pose.or ? 1 : 0,
      mathOn: pose.math ? 1 : 0,
      mathPos: pose.math ? MATH_AT : 0,
      markOn: pose.mark ? 1 : 0,
      titleOn: pose.cleared ? 0 : 1,
      lift: pose.cleared ? -L.height * 0.28 : 0,
      paint: { blue: pose.named.blue ? 1 : 0, red: pose.named.red ? 1 : 0 },
      coinsOn: pose.coins && pose.place !== 'room' ? 1 : 0,
      held: { ...pose.holdings },
      table: { ...pose.table },
      flipOn: pose.flip === 'hidden' ? 0 : 1,
      roomOn: pose.place === 'room' ? 1 : 0,
    };
  }

  function lineFor(index: number): Said | null {
    const step = PAIR_STEPS[index];
    const line = step.lines?.[0];
    if (!line || !line.who) return null;
    return { who: line.who, at: line.who, text: say(line.message, valuesFor(step)) };
  }

  let timeline: ReturnType<typeof gsap.timeline> | null = null;

  function stopMotion(): void {
    timeline?.kill();
    timeline = null;
    view.fly = [];
    for (const token of view.payout) token.on = 0;
  }

  /** Draw a pose at once. */
  function draw(pose: Pose): void {
    const t = target(pose);
    view.type = t.type;
    view.meritOn = t.meritOn;
    view.meritPos = t.meritPos;
    view.orOn = t.orOn;
    view.mathOn = t.mathOn;
    view.mathPos = t.mathPos;
    view.markOn = t.markOn;
    view.titleOn = t.titleOn;
    view.lift = t.lift;
    view.paint.blue = t.paint.blue;
    view.paint.red = t.paint.red;
    view.coinsOn = t.coinsOn;
    view.held = t.held;
    view.table = t.table;
    view.flipOn = t.flipOn;
    if (pose.flip === 'blue' || pose.flip === 'red') view.flipFace = pose.flip;
    view.flipSquash = 1;
    view.roomOn = t.roomOn;
    people(pose).forEach((p, i) => Object.assign(view.people[i], p));
    choice = pose.choice;
  }

  // ---- the player's two verbs ------------------------------------------------

  let current = $state(0);

  function settle(index: number): void {
    current = index;
    stopMotion();
    stopCalls();
    draw(poseAt(index));
    said = lineFor(index);
    enter(index);
  }

  function play(index: number, from: number): void {
    current = index;
    stopMotion();
    stopCalls();
    if (from >= 0) draw(poseAt(from));
    const step = PAIR_STEPS[index];
    const pose = poseAt(index);
    said = lineFor(index);
    timeline = gsap.timeline();
    choreograph(step.action, pose, timeline);
    enter(index);
  }

  function nudge(index: number): void {
    const id = PAIR_STEPS[index].id;
    if (id === 'call') callOut(true);
    if (id === 'equal') said = { who: 'blue', at: 'blue', text: say('equal_ask') };
  }

  /** Things a step starts that are not tweens: the call-outs, the coin mover. */
  function enter(index: number): void {
    const id = PAIR_STEPS[index].id;
    if (id === 'call' && !stage?.isReleased('call')) startCalls();
    if (id === 'equal' && !stage?.isReleased('equal')) {
      reacted = { first: false, eleven: false, over: false };
      selected = null;
    }
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
        choice = pose.choice;
      },
      [],
      at + duration,
    );
  }

  function spin(tl: ReturnType<typeof gsap.timeline>, key: 'meritPos' | 'mathPos', answer: number, onKey: 'meritOn' | 'mathOn'): void {
    tl.set(view, { [key]: 0 });
    tl.to(view, { [onKey]: 1, duration: 0.25, ease: 'none' });
    // Slow enough to read the two funny words, then a steady readable run past
    // the answer (never under about a quarter second a word), two words over,
    // and back to rest.
    tl.to(view, { [key]: 2, duration: 1.1, ease: 'sine.in' });
    tl.to(view, { [key]: answer + 2, duration: answer / 3.6, ease: 'none' });
    tl.to(view, { [key]: answer, duration: 0.75, ease: 'power2.inOut' });
  }

  function choreograph(action: string | undefined, pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    switch (action) {
      case 'type':
        tl.to(view, { type: 1, duration: 3.6, ease: 'none' }, 0.5);
        return;
      case 'reel-merit':
        spin(tl, 'meritPos', MERIT_AT, 'meritOn');
        return;
      case 'or':
        tl.to(view, { orOn: 1, duration: 0.6, ease: 'none' });
        return;
      case 'reel-math':
        spin(tl, 'mathPos', MATH_AT, 'mathOn');
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
        tweenTo(pose, tl, 0, 0.5);
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

  /** Stakes leave each fortune and land on the table, as coins. */
  function ante(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const stake = pose.table.blue;
    const tokens: (Token & { face: 'front' | 'back' })[] = [];
    for (const who of ['red', 'blue'] as Speaker[]) {
      const person = view.people[WHO[who]];
      for (let k = 0; k < stake; k++) tokens.push({ x: person.x, y: person.y, on: 1, face: k % 2 ? 'back' : 'front' });
    }
    view.fly = tokens;
    const slots = tableSlots(stake, stake);
    tl.call(() => {
      view.held = { ...pose.holdings };
    });
    tokens.forEach((token, k) => {
      tl.to(token, { x: slots[k].x, y: slots[k].y, duration: 0.5, ease: 'power2.inOut' }, 0.05 + k * 0.05);
    });
    for (const who of ['blue', 'red'] as Speaker[]) {
      tl.to(view.people[WHO[who]], { r: pairRadius(pose, who), duration: 0.45, ease: 'power2.inOut' }, 0.1);
    }
    tl.call(() => {
      view.fly = [];
      view.table = { ...pose.table };
    });
  }

  /** The decider spins, one colour lands, and the table goes to its owner. */
  function toss(pose: Pose, tl: ReturnType<typeof gsap.timeline>): void {
    const winner: Speaker = pose.flip === 'blue' ? 'blue' : 'red';
    const loser: Speaker = winner === 'blue' ? 'red' : 'blue';
    tl.to(view, { flipOn: 1, duration: 0.2 }, 0);
    const squashes = 5;
    for (let s = 0; s < squashes; s++) {
      const at = 0.2 + s * 0.2;
      tl.to(view, { flipSquash: 0.06, duration: 0.1, ease: 'power1.in' }, at);
      // the sequence is built backwards from the face that lands
      tl.set(view, { flipFace: (squashes - 1 - s) % 2 === 0 ? winner : loser }, at + 0.1);
      tl.to(view, { flipSquash: 1, duration: 0.1, ease: 'power1.out' }, at + 0.1);
    }
    const landed = 0.2 + squashes * 0.2 + 0.25;
    // The stakes on the table become flying coins the moment the coin lands;
    // they are made now, hidden, so the timeline owns every tween it plays.
    const slots = tableSlots(view.table.blue, view.table.red);
    const tokens = slots.map((slot, k) => ({ x: slot.x, y: slot.y, on: 0, face: (k % 2 ? 'back' : 'front') as 'front' | 'back' }));
    view.fly = tokens;
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
      tl.to(token, { x: to.x, y: to.y, duration: 0.45, ease: 'power2.in' }, landed + 0.05 + k * 0.03);
    });
    const done = landed + 0.5 + tokens.length * 0.03;
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

  /** Where staked coins sit: Red's half-stack on the left, Blue's on the right. */
  function tableSlots(blue: number, red: number) {
    const r = L.coinRadius;
    const slots: { x: number; y: number }[] = [];
    for (let k = 0; k < red; k++) slots.push({ x: L.table.x - r * (1.2 + k * 1.1), y: L.table.y });
    for (let k = 0; k < blue; k++) slots.push({ x: L.table.x + r * (1.2 + k * 1.1), y: L.table.y });
    return slots;
  }

  // ---- Scene 3: calling out --------------------------------------------------

  let callTimer: number | undefined;
  let calls = 0;

  function stopCalls(): void {
    if (callTimer !== undefined) window.clearTimeout(callTimer);
    callTimer = undefined;
  }

  function startCalls(): void {
    calls = 0;
    callTimer = window.setTimeout(() => callOut(false), 900);
  }

  /** One line from an unnamed circle, escalating from "Hi." toward "Click on me." */
  function callOut(now: boolean): void {
    stopCalls();
    if (reader.named.blue && reader.named.red) return;
    const waiting = (['blue', 'red'] as Speaker[]).filter((who) => !reader.named[who]);
    const at = waiting[Math.floor(Math.random() * waiting.length)];
    const pool = REACTIONS.callPool;
    let key: string = pool[Math.min(pool.length - 1, calls)];
    if (calls >= 3 && Math.random() < 0.45) key = at === 'blue' ? REACTIONS.callBig : REACTIONS.callSmall;
    calls++;
    said = { who: reader.named[at] ? at : null, at, text: say(key) };
    if (stage?.reduced) return;
    callTimer = window.setTimeout(
      () => {
        said = null;
        callTimer = window.setTimeout(() => callOut(false), 3000 + Math.random() * 4000);
      },
      now ? 1800 : 2500,
    );
  }

  function name(who: Speaker): void {
    if (current !== indexOf('call') || reader.named[who]) return;
    reader.named = { ...reader.named, [who]: true };
    gsap.fromTo(view.paint, { [who]: 0 }, { [who]: 1, duration: 0.4, ease: 'back.out(2.5)' });
    const other: Speaker = who === 'blue' ? 'red' : 'blue';
    if (reader.named[other]) {
      stopCalls();
      said = null;
      stage?.release('call');
      return;
    }
    stopCalls();
    const after = REACTIONS.callAfter;
    said = { who: null, at: other, text: say(after[Math.floor(Math.random() * after.length)]) };
    callTimer = window.setTimeout(() => callOut(false), 2600);
  }

  // ---- Scene 9: the reader makes them equal ----------------------------------

  let selected = $state<Speaker | null>(null);
  let reacted = { first: false, eleven: false, over: false };
  const holding = $derived(current === indexOf('equal') && !stage?.isReleased('equal') && stage?.index === indexOf('equal'));

  function react(key: string, who: Speaker): void {
    said = { who, at: who, text: say(key) };
  }

  function give(from: Speaker): void {
    if (!holding) return;
    const to: Speaker = from === 'blue' ? 'red' : 'blue';
    if (reader.held[from] <= 0) return;
    const held = { ...reader.held, [from]: reader.held[from] - 1, [to]: reader.held[to] + 1 };
    reader.held = held;
    view.held = held;
    selected = null;
    for (const who of ['blue', 'red'] as Speaker[]) {
      gsap.to(view.people[WHO[who]], { r: Math.max(L.minRadius, L.radius(held[who])), duration: 0.3, ease: 'back.out(2)' });
    }
    if (held.blue === 8 && held.red === 8) {
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

  /** Tap a coin, then a person — or tap the fortune a coin should come FROM, then the other. */
  function pick(who: Speaker): void {
    if (!holding) return;
    if (selected && selected !== who) give(selected);
    else selected = selected === who ? null : reader.held[who] > 0 ? who : null;
  }

  let dragFrom: Speaker | null = null;

  function dragStart(event: PointerEvent, who: Speaker): void {
    if (!holding || reader.held[who] <= 0) return;
    dragFrom = who;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  function dragEnd(event: PointerEvent): void {
    if (!dragFrom) return;
    const from = dragFrom;
    dragFrom = null;
    const box = host.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const to: Speaker = from === 'blue' ? 'red' : 'blue';
    const p = view.people[WHO[to]];
    if (Math.hypot(x - p.x, y - p.y) <= Math.max(p.r, 40)) give(from);
  }

  // ---- Scene 14: the choice ---------------------------------------------------

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
    return `translate(${b.dx.toFixed(2)} ${(b.dy - hop).toFixed(2)}) scale(${(b.scale * pop(i)).toFixed(4)})`;
  }

  /**
   * Waiting to be tossed, the decider turns slowly and shows both of its faces
   * — showing one colour at rest would give the outcome away. Once a toss has
   * landed (the pose names a colour), it stays on that face.
   */
  function idleFace(): { side: Speaker; squash: number } {
    const flip = PAIR_STEPS[current]?.pose.flip;
    const tossing = timeline?.isActive() && PAIR_STEPS[current]?.action === 'toss';
    if (flip !== 'shown' || tossing || stage?.reduced) return { side: view.flipFace, squash: 1 };
    const turn = seconds / 1.6;
    return { side: Math.floor(turn) % 2 === 0 ? 'blue' : 'red', squash: Math.max(0.06, Math.abs(Math.cos(turn * Math.PI))) };
  }

  function anchorOf(who: Speaker) {
    const p = view.people[WHO[who]];
    return { x: p.x, y: p.y, r: Math.max(p.r, L.minRadius) };
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
    stage?.attach(PAIR_STEPS, { play, settle, nudge });
    const stopAmbient = ambientClock((s) => (seconds = s), stage?.reduced ?? false);
    return () => {
      observer.disconnect();
      stopAmbient();
      stopMotion();
      stopCalls();
    };
  });
</script>

<div class="pair-scene" bind:this={host}>
  <div class="words" style={`opacity:${view.titleOn}; transform: translateY(${view.lift}px)`}>
    <div class="teletype-slot">
      <Teletype
        headline={say('open_headline')}
        source={say('open_source')}
        href={SOURCE_URL}
        progress={view.type}
        shown={1}
      />
    </div>

    <!-- Physical order in every locale: MATH left, MERIT right (ADR-006 amendment). -->
    <h1 class="title" dir="ltr" aria-label={say('open_title')}>
      <span class="word math" bind:this={mathReel}>
        <Reel words={MATH_WORDS} answer={MATH_AT} position={view.mathPos} shown={view.mathOn} />
      </span>
      <span class="word or" style={`opacity:${view.orOn}`} aria-hidden="true">{say('open_title_or')}</span>
      <span class="word merit">
        <Reel words={MERIT_WORDS} answer={MERIT_AT} position={view.meritPos} shown={view.meritOn} /><span
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
                {@const pile = lattice(view.held[whoIs(i)!], L.coinRadius, person.r)}
                <g opacity={view.coinsOn}>
                  {#each pile.spots as spot, k (k)}
                    <Coin cx={spot.x} cy={spot.y} r={pile.r * 0.94} face={k % 2 ? 'back' : 'front'} />
                  {/each}
                </g>
              {/if}
            </g>
          </g>
        {/if}
      {/each}

      {#each view.payout as token, i (i)}
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={L.coinRadius * 0.7} face={i % 2 ? 'back' : 'front'} />{/if}
      {/each}

      {#if view.table.blue + view.table.red > 0}
        {#each tableSlots(view.table.blue, view.table.red) as slot, k (k)}
          <Coin cx={slot.x} cy={slot.y} r={L.coinRadius} face={k % 2 ? 'back' : 'front'} />
        {/each}
      {/if}

      {#each view.fly as token, k (k)}
        {#if token.on > 0}<Coin cx={token.x} cy={token.y} r={L.coinRadius} face={token.face} />{/if}
      {/each}

      {#if view.flipOn > 0.01}
        {@const face = idleFace()}
        <g transform={`translate(${L.flip.x} ${L.flip.y})`} opacity={view.flipOn}>
          <g transform={`scale(${(view.flipSquash * face.squash).toFixed(3)} 1)`}>
            <Coin r={L.coinRadius * 1.5} face={face.side === 'blue' ? 'front' : 'back'} tint={PROTAGONISTS[face.side].fill} />
          </g>
        </g>
      {/if}
    </svg>

    <!-- the two circles as controls, over the art: named in Scene 3, handed coins in Scene 9 -->
    {#each PAIR as who (who)}
      {@const p = view.people[WHO[who]]}
      {@const r = Math.max(p.r, 30)}
      {#if current === indexOf('call') && !stage?.isReleased('call') && !reader.named[who]}
        <button
          type="button"
          class="hit"
          style={`left:${p.x - r}px; top:${p.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={say(who === 'blue' ? REACTIONS.callBig : REACTIONS.callSmall)}
          onclick={() => name(who)}
        ></button>
      {:else if holding}
        <button
          type="button"
          class="hit coins"
          class:selected={selected === who}
          style={`left:${p.x - r}px; top:${p.y - r}px; width:${r * 2}px; height:${r * 2}px;`}
          aria-label={selected && selected !== who
            ? say('equal_give', { name: say(`name_${who}`) })
            : say('equal_take', { name: say(`name_${who}`), count: reader.held[who] })}
          onclick={() => pick(who)}
          onpointerdown={(e) => dragStart(e, who)}
          onpointerup={dragEnd}
        ></button>
      {/if}
    {/each}

    <div class="bubbles" aria-live="polite">
      {#if said}
        <Bubble
          text={said.text}
          speaker={said.who}
          name={said.who ? say(`name_${said.who}`) : ''}
          anchor={anchorOf(said.at)}
          bounds={{ width, height }}
          reduced={stage?.reduced ?? false}
        />
      {/if}
    </div>

    {#if choice}
      <div class="choice">
        <button type="button" onclick={tellMe}>{say('more_choice_1')}</button>
        <button type="button" onclick={notNow}>{say('more_choice_2')}</button>
      </div>
    {/if}
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
    left: 0;
    right: 0;
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
  }

  .hit:focus-visible {
    outline: 2px dashed var(--accent);
    outline-offset: 3px;
  }

  .hit.coins.selected {
    outline: 2px dashed var(--ink-mid);
    outline-offset: 4px;
  }

  .bubbles {
    position: absolute;
    inset: 0;
    z-index: 4;
    pointer-events: none;
  }

  .choice {
    position: absolute;
    inset-block-end: 6%;
    left: 50%;
    z-index: 5;
    display: flex;
    gap: 0.7rem;
    transform: translateX(-50%);
  }

  .choice button {
    white-space: nowrap;
    min-block-size: 2.75rem;
    padding-block: 0.45rem;
    padding-inline: 1.15rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink);
    background: var(--paper-bright);
    font-family: var(--font-sans);
    font-size: 0.92rem;
    font-weight: 650;
    cursor: pointer;
  }

  .choice button:first-child {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
