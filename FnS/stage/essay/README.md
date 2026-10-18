# The essay's code

Copied unchanged from the essay (math-or-merit, `src/lib`, working tree of
2026-10-18; last commit c2c8ba9), so the stage stands on its own:

- `face/` (face.ts, draw.ts, field.ts, moments.ts): the face engine, Hamed's
  faces. The one change: field.ts drops an unused type import (`Affect`).
- `agentStyle.ts`: the people's fills and strokes.
- `layout.ts`, `roomRenderer.ts`: what the face engine needs from them
  (`noise`, `POLYGONS`).
- `sim/Trade.ts`: the yard-sale trade, so a seeded game replays the essay's
  `YardSaleEngine` trade for trade.

Change them there first; copy them here again.
