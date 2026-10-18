/**
 * A trade between partners who have met (the demo mode): both cut their
 * stake off their longer side; the stakes stay where they came off while a
 * spinner turns and stops on the winner; the winner's own stake closes back
 * (it was only drawn apart: no money moves); the loser's flies over, becoming
 * a bar on the way, and joins the winner on the side that leaves it squarer.
 * In the pose's scale, as a piece's (piece.ts): the loser loses what its
 * drawn area loses, the winner gains what its drawn area gains.
 */
import { away, centreOf, cut, cutSide, join, joinSide, spinnerSize, union, GAP, type Box } from '../core/area.ts';
import { DUR, flyTime, smooth } from '../core/motion.ts';
import type { Move } from '../core/transfer.ts';
import type { Act, ActOptions } from './index.ts';
import { Money, type Live } from './track.ts';
import { areasOf } from './piece.ts';

export function tossAct(live: Live, moves: readonly Move[], opts: ActOptions): Act {
  const m = moves[0];
  const { off, on } = areasOf(live, m.from, m.to, m.amount);
  // the winner's own stake, only drawn apart: what its drawn area would lose
  const dW = live.drawn(m.to);
  const own = live.measure(dW) - live.measure(dW - m.amount);
  const L = live.box(m.from);
  const W = live.box(m.to);
  const side = cutSide(L, W);
  const ownSide = cutSide(W, L);
  const winSide = joinSide(W, L, on);
  const [lx, ly] = centreOf(L);
  const [wx, wy] = centreOf(W);
  const loser = new Money(off, m.from, DUR.pair)
    .mark(m.from, L, side)
    .lift()
    .wait(DUR.decide)
    .wait(DUR.keep, { release: true })
    .travel(flyTime(Math.hypot(wx - lx, wy - ly)), (l) => join(l.box(m.to), on, winSide, GAP).piece, { bend: opts.bend, shaping: (u) => smooth((u - 0.5) / 0.5) })
    .dock(m.to, winSide, { area: on })
    .merge(m.to);
  // the winner's own stake: drawn apart, then back
  const kept = new Money(own, m.to, DUR.pair).mark(m.to, W, ownSide).lift().wait(DUR.decide).close(DUR.keep);
  const decide = DUR.pair + DUR.mark + DUR.lift;
  const keep = decide + DUR.decide;
  // the spinner, clear of the two and of their stakes wherever those came off
  const size = spinnerSize(Math.min(off, own));
  const stakeOf = (b: Box, s: typeof side, a: number) => away(cut(b, s, a).piece, s, GAP);
  const [px, py] = pivotAt(union(L, stakeOf(L, side, off)), union(W, stakeOf(W, ownSide, own)), size, live.top);
  const goal = Math.atan2(wy - py, wx - px);
  // from straight up: three turns and the rest of the way, slowing to a stop on the winner
  const startAngle = Math.PI / 2;
  const turn = 6 * Math.PI + ((((goal - startAngle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
  return {
    times: [{ off: loser.offAt, on: loser.onAt }],
    length: loser.end,
    draw(t, l, scene) {
      if (t < DUR.pair + DUR.mark || (t >= decide && t < keep)) scene.looks.push([m.from, m.to], [m.to, m.from]);
      if (t >= decide && t < keep + DUR.keep) {
        const u = (t - decide) / DUR.decide;
        const v = Math.min(1, Math.max(0, (u - 0.1) / 0.7));
        const alpha = t < keep ? smooth(u / 0.1) : 1 - smooth((t - keep) / DUR.keep / 0.5);
        scene.spinners.push({ x: px, y: py, size, angle: startAngle + turn * (1 - (1 - v) ** 3), alpha });
      }
      kept.draw(t, l, scene);
      loser.draw(t, l, scene);
    },
  };
}

/**
 * Where a spinner (diameter `size`) stands: between the two people's facing
 * edges, or, when they stand too close for that (partners face to face),
 * just above them (below, if there is no room above).
 */
function pivotAt(L: Box, W: Box, size: number, top: number): [number, number] {
  const [lx, ly] = centreOf(L);
  const [wx, wy] = centreOf(W);
  const along = Math.abs(wx - lx) >= Math.abs(wy - ly);
  const lo = along ? Math.min(L.x + L.w, W.x + W.w) : Math.min(L.y + L.h, W.y + W.h);
  const hi = along ? Math.max(L.x, W.x) : Math.max(L.y, W.y);
  const mid = (lo + hi) / 2;
  if (hi - lo >= size + 4 * GAP) return along ? [mid, (ly + wy) / 2] : [(lx + wx) / 2, mid];
  if (along) {
    const above = Math.max(L.y + L.h, W.y + W.h) + size / 2 + 2 * GAP;
    return [mid, above + size / 2 < top ? above : Math.min(L.y, W.y) - size / 2 - 2 * GAP];
  }
  return [Math.max(L.x + L.w, W.x + W.w) + size / 2 + 2 * GAP, mid];
}
