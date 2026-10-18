# FnS_de review — recheck after fixes, 2026-10-18

The fixes address the ten original stage reproductions, and all ten new regression tests pass. Broader checks still find gaps in four of those areas: changing shape during an animation, replaying interrupted animations, waiting on queued rounds after a pose change, and pushing chains of bodies. Immediate commands can also invalidate an outstanding transfer's displayed wealth.

This recheck reviews the working directory after the user reported the changes reflected. No implementation or test files were changed during the recheck. The [original review](REVIEW-2026-10-18.md) is retained as historical evidence.

## Verification

| Check | Result |
| --- | --- |
| Full `npm test` | **215 passed**, 21 files |
| New review regressions | **10 passed** |
| `npm run build` | Passed, including both TypeScript checks |
| Free-room geometry | Eight independent bar/column cases, including paired rooms with a pot reservation: contained at construction, transitions completed, zero unrepaired violations |
| Trade scheduling | Random, synchronous, round, toss, and levy sequences: no active acts sharing a holder; after draining, wealth accounting and replay proportions matched |
| Interruption probes | Five remaining defects reproduced below |

Animation probes called `Session.frame()` and `Transit.draw()` each frame. Some scheduling checks deliberately skipped drawing for three seconds, then resumed and drained the queue. No manual browser or screenshot review was performed.

## Status of the original ten stage findings

“Resolved” below means the original reproduction and the related paths checked in this pass now behave correctly.

| Original finding | Status | Evidence or remaining gap |
| --- | --- | --- |
| 1. Polygon transfers use bounding rectangles | **Partial** | New trades on triangles/hexagons bypass unsupported acts, but an existing act survives a change to a polygon. See R2. |
| 2. Concurrent trades overwrite cuts | **Resolved** | `Transit.ready()` serializes conflicting holders; tested scheduling paths had no simultaneous holder conflicts. Immediate commands still need reconciliation with pending acts: R1. |
| 3. Free-room wall extents | **Resolved** | Both axes now include actual placement extents; paired and unpaired cases remain contained and complete. |
| 4. Shared body proportions | **Partial** | Canonical proportions and replayed `equalize` fix the original settled examples. Interleaved commands and clearing FX still lose final proportions. See R3. |
| 5. Reset retains queued toss rounds | **Resolved** | Reset cancels meetings and clears the queue; advancing afterward does not execute the old round. |
| 6. `until done` skips queued rounds | **Partial** | The original wait now works. Changing to a chart before waiting strands the round and blocks the script. See R4. |
| 7. Animated playback ignores its rate | **Resolved** | Fresh zero-rate sessions do not trade; the tested animated paths now gate work on accumulated rate budgets. |
| 8. History merges beyond replay limits | **Resolved** | Round compaction uses the command-specific limit; the large-history reproduction now reloads. |
| 9. Explicit rate 1 aliases the default | **Resolved** | `auto` and numeric rates round-trip separately. |
| 10. Push dragging tunnels through bodies | **Partial** | The original two-body case pushes correctly. A pushed body can still tunnel through a third. See R5. |

## Remaining findings

### R1 — P2: immediate wealth mutations can invalidate an outstanding transfer's ledger

Locations: [session.ts:1004](stage/console/session.ts#L1004), [session.ts:958](stage/console/session.ts#L958), [transit.ts:203](stage/core/transit.ts#L203).

The scheduler protects animated acts from one another, but `give` and large immediate trade batches mutate game wealth while older transfers remain open. The new mutation can spend money that the stage still owes to an unfinished animation. `Transit.shown()` then clamps a negative balance rather than preserving total displayed wealth.

```ts
const s = new Session({ n: 2, seed: 1 });
s.run('trade 1; give 0 1 .6');
const total = [...s.shown].reduce((a, b) => a + b, 0)
  + s.transit.inTransit;
// total === 1.0999999994000007, while game wealth totals 1
```

Immediately after these commands:

| Quantity | Value |
| --- | --- |
| Game wealth | Approximately `[0.0000000006, 0.9999999994]` |
| Outstanding owed wealth | `[0.1, -0.1]` |
| Shown wealth | Approximately `[0.0000000000000006, 1.0999999994]` |
| In transit | `0` |

No drawing or time advancement is required to expose this mismatch. `trade 1; fx trade off; trade 100` also produces a displayed total of approximately **1.06125712**.

Reconcile outstanding transfers before an immediate mutation, or queue it in an accounting model that keeps every intermediate holder balance valid. Test a gift that spends nearly all of the recipient's just-won game wealth while that win is still pending visually. Increasing the clamp or accepting a wider test tolerance would hide the broken accounting.

### R2 — P2: changing to a polygon leaves rectangular acts running

Locations: [session.ts:208](stage/console/session.ts#L208), [session.ts:697](stage/console/session.ts#L697), [render.ts:258](stage/view/render.ts#L258).

`showsMoney` prevents new polygon acts, but `pose()` does not settle or cancel existing acts before changing shape. Those acts continue cutting and joining rectangles while the live body boxes now bound triangles or hexagons.

Reproduce with `new Session({ n: 2, seed: 1 })` and `trade 1; tri; finish`. Advance at `1/120` second and draw transit into a fresh `emptyScene()` every frame. At frame **257**, there are no solid detached pieces, but the body overrides draw areas approximately **1.1998617369** and **0.4**: total **1.5998617369**, for wealth 1. The corresponding `hex` sequence draws **1.1999629036** in total.

Complete or reconcile incompatible acts before changing the recipe's geometry, or retain a coherent geometry contract for the entire act. Test both a single active transfer and a queue of transfers when switching shape. The current regression selects the polygon before the first trade, so it does not exercise this transition.

### R3 — P2: pending proportions can overwrite newer commands or disappear when FX is cleared

Locations: [session.ts:164](stage/console/session.ts#L164), [session.ts:379](stage/console/session.ts#L379), [session.ts:1148](stage/console/session.ts#L1148).

The new `ahead` state correctly computes terminal proportions in game order. The displayed `aspect` array is not consistently reconciled with it. Immediate commands apply newer proportions now, then older animation events overwrite those values later. Separately, `fx off` discards the events needed to apply final proportions without copying the terminal state.

Two independent reproductions in four-person sessions:

1. Run `trade 1; trade 20`, drain all pending transfers, and compare `aspect` with `Session.load(s.share()).aspect`. The source ends at approximately `[0.8333333, 1.152, 0.8, 1.1171554]`; replay ends at `[0.9937975, 1.152, 1.0941877, 1.1171554]`. No transfers remain. `trade 1; give 0 1 .1` produces the same ordering problem.
2. Run `trade 1; fx off`. Transit is empty and source proportions remain `[1, 1, 1, 1]`, while replay returns approximately `[0.8333333, 1, 0.8, 1]`. Advancing additional frames does not repair the lost update.

Preserve the order of displayed shape updates across immediate and animated commands, and materialize terminal proportions when effects are discarded. Cover interruption before money comes off, between off/on, and after later immediate commands. The existing replay test drains animations before making its comparison and does not interleave a later mutation.

### R4 — P2: changing pose can strand a queued toss round and deadlock `until done`

Locations: [session.ts:429](stage/console/session.ts#L429), [session.ts:507](stage/console/session.ts#L507), [session.ts:697](stage/console/session.ts#L697).

The new wait correctly treats `queued > 0` as unfinished work. However, changing to a chart makes `plays` false, which disables the meeting that would execute the queued round. `pose()` leaves that round queued indefinitely.

```ts
const s = new Session({ n: 4 });
s.run('fx trade toss; round; ccdf; until done; say done');
for (let f = 0; f < 1200; f++) s.frame(1 / 60);
// trades: 0; queued: 1; transit.busy: false;
// script still running; caption is empty
```

This remains blocked after the chart has formed. Switching to a polygon can similarly disable the pending meeting. Finish or explicitly cancel queued work when its execution mode becomes unavailable, with a defined result for the requested round. Add this pose-change case alongside the original successful queue wait.

### R5 — P2: a swept push can move its neighbour through a third body

Locations: [stage.ts:1203](stage/core/stage.ts#L1203), [stage.ts:1215](stage/core/stage.ts#L1215).

The added sweep checks the held body's path. It then translates each hit body directly, without checking that body's swept path. A larger neighbour can therefore pass through a third body outside the held body's narrow strip.

```ts
const wealth = Float64Array.of(1e-6, 1e-4, 1e-6, 0.999898);
const stage = new Stage(compile(parseRecipe('still'), wealth), wealth);
for (const [i, x, y] of [[0, .1, 1.5], [1, .12, 1.5], [2, .14, 1.503]]) {
  stage.grab(i, true);
  stage.drag(x, y);
  stage.step(1 / 120);
  stage.release();
}
stage.grab(0);
stage.drag(.18, 1.5);
stage.step(1 / 120);
```

The first three left edges change from **`[.0995, .115, .1395]`** to **`[.1795, .1805, .1395]`**. Body 1 is 0.01 wide and passes entirely through grounded body 2, which is 0.001 wide and overlaps it vertically. All remain on the ground. The endpoint diagnostic reports zero overlap and zero outside bodies, so it does not detect the crossing.

Sweep propagated displacements as well as the original drag, and resolve contacts in collision-time order so a later obstacle can stop the whole push. Add a chain case with different body sizes and an off-centre third body; the current regression covers only the initial pair.

## Older engine

The four previously reconfirmed `src/` defects remain reproducible and unchanged:

- **P1:** the two-step corner drag still self-intersects edges 1 and 15 while `diagnose().inverted` reports zero.
- **P2:** rejected measure/transition configuration still affects subsequent valid operations.
- **P2:** the richest log-measure packed body still draws area **0.5324738401** instead of its configured **0.25**.
- **P2:** `histogram({ binWidth: 1e-10 })` still commits negative coordinates, with wall violation approximately **0.1179869184**.

Their reproductions and locations are retained in the [original review](REVIEW-2026-10-18.md#reconfirmed-findings-in-the-older-engine). The recheck does not treat the legacy engine as fixed by changes to `stage/`.
