# The cow

Two poses of one character for the spherical-cow scene: the standing cow and
the spherical cow. Author-drawn (Hamed, Inkscape, 2026-07) — no external
assets, no license burden.

## Files

- `cow.source.svg`, `spherical-cow.source.svg` — the original Inkscape
  drawings, untouched (the spherical file keeps its hidden construction-guides
  layer). **These are the drawing home**: edit here, then re-extract.
- `gen_cow.py` — the extraction pipeline. Bakes the source transforms (tail
  translate, udder matrix, teat use-chains), unifies naming and the mirror
  axis (x=300), and emits everything else:
  - `python3 gen_cow.py essay` → `cow.svg`, `spherical-cow.svg` (below)
  - `python3 gen_cow.py ts` → prints `src/lib/widgets/stage/scenes/cow-geometry.ts`
  - `python3 gen_cow.py bw` → original-palette rebuilds, for overlay-diffing
    against the sources after an edit
  - `python3 gen_cow.py states` → the expression grid (sad / smile / flat /
    wide / gasp / angry)
- `cow.svg`, `spherical-cow.svg` — generated, essay-styled standalone
  reference copies in the shared `0 0 300 300` space.

## Design facts worth knowing

- The spherical cow was the original design; the standing cow is a hand-morph
  of it. The head sits at identical coordinates in both poses, so in the scene
  the face persists through the morph and only body/horn/limbs/udder/tail
  change.
- Every shape is a circle or a circle arc — the real↔spherical morph is a
  numeric tween of circle parameters plus part crossfades (no path-morph
  library needed for the pair; MorphSVG is used only for horn and mouth).
- Palette is the essay's ink-on-cream with tissue tints (bone horns, rose
  inner ear/udder, bright eye whites). Stroke tiers: silhouette 4.5,
  features 3, fine detail 2 (in the 300-space).

The production consumer is `src/lib/widgets/stage/scenes/CowScene.svelte` via
`cow-geometry.ts`. If you change geometry here, regenerate the ts module and
run `npx vitest run src/lib/widgets/stage/scenes/cow-geometry.test.ts`.
