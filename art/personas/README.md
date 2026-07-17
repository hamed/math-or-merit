# Personas

Cartoon cast for the essay, in the cow's visual language (see
`art/cow/README.md`): essay ink-on-cream, tissue tints, three stroke tiers,
shared `0 0 300 300` space. Project-drawn from reference photos in the
owner's inbox; the Musk face additionally takes structural cues (wide brow,
slab cheeks, no chin) from a caricature reference — cues only, nothing
copied.

## Full-body cast — `gen_cast.py` (current)

`python3 gen_cast.py` rewrites the `fb-*.svg` set. Most characters come in
two grammars — **circle** (strict circle/arc construction, the cow's) and
**loose** (simple geometric shapes and curves, whatever fits):

- `fb-einstein-{circle,loose}.svg` — the physicist. Hair is literally **one
  big circle with pieces cut out** (SVG mask; every bite rim redrawn in ink
  so the cuts read as drawn notches — `cut_circle()`).
- `fb-curie-{circle,loose}.svg` — **the chemist is Marie Curie** (1900
  portrait): swept-up hair with a loose bun, temple frizz, serious direct
  gaze, high-collared dark dress, erlenmeyer in hand. Circle variant has the
  bell skirt, loose the A-line.
- `fb-musk-{rect,loose}.svg` — young PayPal-era Musk: receding fuzz with a
  lonely front island, heavy outer-drooping lids, smirk, and a face that is
  wide at the brow and simply never develops a chin. Slim body, no
  bodybuilding. The rect variant is deliberate rectangle grammar — the cow
  is circles, he is rectangles, and PersonScene later strips him into the
  same circle the cow became.
- `fb-farmer.svg` — whose cow stopped giving milk (after the Bakewell
  engraving): flat-top wide-brim hat, side curls, jowls, knee-length
  buttoned coat.

## Bust sketches — `gen_personas.py` (superseded, kept for parts)

First pass: `einstein.svg`, `mendeleev.svg`, `farmer.svg`, `musk.svg`.
Mendeleev is no longer the chemist (Curie is) but stays as a possible cameo.
The `cluster()` union trick (stroke pass + fill pass) lives here too.

Not wired into scenes yet. Candidate slots: CowScene's stick scientists
(chemist/physicist), a farmer cameo at beat 0, PersonScene's person.
Swapping scene figures means re-anchoring choreography (flask-arm pivot,
arm-up gesture) — its own pass.
