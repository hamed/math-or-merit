#!/usr/bin/env bash
# Rebuilds the coin's two faces from their sources.
#
# The coin is a REAL one: Mongol Bank, 1000 tögrög, 0.5 g .9999 gold, Karl Marx,
# 2019. Sources live in art/coin/source/ (promoted out of inbox/ once accepted,
# like art/cast-scene/); they are large and untracked, and the committed
# artefacts are the two WebP faces this writes.
#
# Unlike the cast plates, NOTHING is keyed or re-tinted here. The cast is black
# ink that has to become --ink to sit on warm paper; the coin is gold, and gold
# is the essay's one reserved colour for money (agentStyle.ts). Re-tinting it
# would spend exactly the thing it is here to carry.
#
# What this does do is square the frame around the coin's own content, so the
# disc is perfectly centred: the scene draws it inside a circle, and a source
# that is off-centre by even a few pixels shows up as a crescent of clipped rim.
#
# Run from anywhere: art/coin/process.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IN="${1:-$ROOT/art/coin/source}"
OUT="${2:-$ROOT/src/lib/widgets/stage/scenes/coin}"
SIZE=256          # ~2x the largest on-stage render (r=16.6 of a 480-unit box)
QUALITY=86

mkdir -p "$OUT"

emit() {
  local name="$1"
  magick "${IN}/${name}.webp" \
    -trim +repage \
    -background none -gravity center \
    -extent "%[fx:max(w,h)]x%[fx:max(w,h)]" \
    -resize "${SIZE}x${SIZE}" \
    -define webp:method=6 -quality "$QUALITY" "${OUT}/${name}.webp"
  printf '  %-12s %8s  %s\n' "${name}.webp" \
    "$(du -h "${OUT}/${name}.webp" | cut -f1)" \
    "$(magick "${OUT}/${name}.webp" -format '%wx%h' info:)"
}

echo "Squaring and encoding the two faces"
emit front
emit back

echo "Total: $(du -sh "$OUT" | cut -f1)"
