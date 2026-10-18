/**
 * A levy, everyone at once: faces flinch; each cuts their levy off their
 * longer side, toward the middle; each slice becomes a 2 : 1 bar; biggest
 * first, one a step after another, they fly into a pile in the middle
 * (`pile`: each joins on the side that keeps it squarest; the finished pile
 * centred), the pile's colour the payers' mixed by amount; the pile becomes
 * n equal squares (`squares`), which part; a square flies to each person,
 * becoming what it joins as, and joins them by the single rule.
 *
 * In the pose's scale: each slice is what that person's drawn area loses,
 * the pile all of them, a square a pile's n-th, and each person takes in what
 * their drawn area gains (in a log or squared pose those differ from person
 * to person: a square changes size on its way).
 *
 * Moves: n payments (j → POT), then n shares (POT → j), as the game made them.
 */
import { area, at, away, bar21, centreOf, cut, cutSide, joinSide, join, pile, squares, GAP, type Box, type Side } from '../core/area.ts';
import { DUR, fast, levyStep, smooth } from '../core/motion.ts';
import { POT, type Move } from '../core/transfer.ts';
import type { Act, ActOptions } from './index.ts';
import { Money, Track, type Live } from './track.ts';

export function levyAct(live: Live, moves: readonly Move[], _opts: ActOptions): Act {
  const n = live.n;
  const pays = new Float64Array(n);
  const shares = new Float64Array(n);
  for (const m of moves) {
    if (m.to === POT) pays[m.from] += m.amount;
    else if (m.from === POT) shares[m.to] += m.amount;
  }
  // in the pose's scale: what each drawn area loses, and what it gains back
  const off = new Float64Array(n);
  const on = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const d = live.drawn(j);
    off[j] = live.measure(d) - live.measure(d - pays[j]);
    on[j] = live.measure(d - pays[j] + shares[j]) - live.measure(d - pays[j]);
  }
  const cx = live.right / 2;
  const cy = live.top / 2;
  const middle: Box = { x: cx, y: cy, w: 0, h: 0 };
  const step = levyStep(n);
  const tMark = DUR.brace;
  const tGather = tMark + DUR.levyMark + DUR.levyLift + DUR.levyShape;
  const close = Math.max(0.06, step);
  const arrive = (k: number) => tGather + DUR.levyFly + k * step;
  const tSplit = arrive(n - 1) + 0.15;
  const tDeal = tSplit + DUR.split;

  // into the pile, biggest first
  const order = Array.from({ length: n }, (_, j) => j).sort((a, b) => off[b] - off[a] || a - b);
  const steps = pile(
    order.map((j) => off[j]),
    cx,
    cy,
  );
  // the pile's colour so far: the payers' in it, mixed by what each paid
  const blends = steps.map((_, k) => ({ of: order.slice(0, k + 1), by: order.slice(0, k + 1).map((j) => pays[j]) }));
  const payers = order.map((j, k) => {
    const box = live.box(j);
    const side = cutSide(box, middle);
    const money = new Money(off[j], j, tMark)
      .mark(j, box, side, DUR.levyMark)
      .lift(DUR.levyLift)
      .reshape((mm) => away(bar21(off[j], mm.box!), side, GAP), { dur: DUR.levyShape, release: true })
      .wait(arrive(k) - DUR.levyFly - tGather)
      .travel(DUR.levyFly, () => steps[k].staged, { bend: k % 2 ? 0.1 : -0.1, shaping: (u) => smooth((u - 0.6) / 0.4) });
    if (k === 0) money.wait(close);
    else money.dock(steps[k - 1].pile, steps[k].side as Side, { dur: close, turn: false, seam: false });
    return money;
  });

  // the pile: as much of it as has arrived, in the mix so far; then n equal squares, which part
  const whole = steps[n - 1].pile;
  const each = area(whole) / n;
  const packed = squares(n, each, cx, cy, 0);
  const parted = squares(n, each, cx, cy, GAP * 1.5);
  const heap = new Track(arrive(0) + close);
  heap.add({
    dur: tSplit - heap.start,
    draw: (u, _l, scene) => {
      const t = heap.start + u * (tSplit - heap.start);
      let done = 0;
      for (let k = 0; k < n; k++) if (t >= arrive(k) + close) done = k;
      scene.pieces.push({ box: steps[done].pile, alpha: 0.95, colour: -1, blend: blends[done] });
    },
  });
  heap.add({
    dur: DUR.split,
    draw: (u, _l, scene) => {
      // the pile gives way to its n equal squares, which then part
      const show = smooth(u / 0.4);
      if (show < 1) scene.pieces.push({ box: whole, alpha: 0.95 * (1 - show), colour: -1, blend: blends[n - 1] });
      const part = smooth((u - 0.5) / 0.5);
      packed.forEach((c, k) => {
        const [x0, y0] = centreOf(c);
        const [x1, y1] = centreOf(parted[k]);
        scene.pieces.push({ box: at(c, x0 + (x1 - x0) * part, y0 + (y1 - y0) * part), alpha: 0.95 * show, colour: -1, blend: blends[n - 1] });
      });
      if (part === 0) for (const c of packed) scene.frames.push({ box: c, alpha: show, solid: true });
    },
  });

  // a square to each person, nearest round the middle; it joins them on the side the rule picks
  const dealt = dealCells(live, parted, cx, cy);
  const sharesOut = parted.map((c, k) => {
    const j = dealt[k];
    const rest = cut(live.box(j), cutSide(live.box(j), middle), off[j]).rest;
    const side = joinSide(rest, middle, on[j]);
    return new Money(each, -1, tDeal, blends[n - 1])
      .from(c)
      .travel(DUR.deal, (l) => join(l.box(j), on[j], side, GAP).piece, { bend: k % 2 ? 0.1 : -0.1, shaping: (u) => fast(u / 0.5) })
      .dock(j, side, { area: on[j] })
      .merge(j);
  });
  const byPerson = new Map(Array.from(dealt, (j, k) => [j, sharesOut[k]] as const));
  const payerOf = new Map(order.map((j, k) => [j, payers[k]] as const));
  const times = moves.map((m) => {
    if (m.to === POT) {
      const p = payerOf.get(m.from)!;
      return { off: p.offAt, on: Number.isFinite(p.onAt) ? p.onAt : p.end };
    }
    const s = byPerson.get(m.to)!;
    return { off: tSplit, on: s.onAt };
  });
  return {
    times,
    length: Math.max(...sharesOut.map((s) => s.end)),
    brace: pays,
    relaxAt: Math.min(...sharesOut.map((s) => s.onAt)),
    draw(t, l, scene) {
      for (const p of payers) p.draw(t, l, scene);
      heap.draw(t, l, scene);
      for (const s of sharesOut) s.draw(t, l, scene);
    },
  };
}

/** Which person each square goes to: both in angular order round the middle, the best of every rotation. */
function dealCells(live: Live, cells: Box[], cx: number, cy: number): Int32Array {
  const n = cells.length;
  const angle = (x: number, y: number) => Math.atan2(y - cy, x - cx);
  const cellOrder = cells.map((c, k) => ({ k, a: angle(...centreOf(c)) })).sort((p, q) => p.a - q.a || p.k - q.k);
  const people = Array.from({ length: n }, (_, j) => ({ j, a: angle(...centreOf(live.box(j))) })).sort((p, q) => p.a - q.a || p.j - q.j);
  const turn = (a: number, b: number) => {
    const d = Math.abs(a - b) % (2 * Math.PI);
    return d > Math.PI ? 2 * Math.PI - d : d;
  };
  let best = 0;
  let bestCost = Infinity;
  for (let c = 0; c < n; c++) {
    let cost = 0;
    for (let r = 0; r < n && cost < bestCost; r++) cost += turn(cellOrder[(c + r) % n].a, people[r].a);
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }
  const out = new Int32Array(n);
  for (let r = 0; r < n; r++) out[cellOrder[(best + r) % n].k] = people[r].j;
  return out;
}
