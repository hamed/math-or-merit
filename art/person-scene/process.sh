#!/usr/bin/env bash
# Rebuilds the person-reduction plates from their sources.
#
# Sources live in art/person-scene/source/ (promoted out of inbox/ once
# accepted). They are large and untracked; the committed artefacts are the WebP
# plates this writes.
#
# Ink keying is the same idea as the cow cast: luminance to alpha, re-tinted to
# --ink, so the plates sit on the paper instead of arriving as white cards. See
# art/cast-scene/process.sh for why sources with their own alpha channel must be
# flattened onto white first.
#
# The framing differs, though, and the reason matters.
#
# The sequence is one head being simplified, so every head plate takes the SAME
# crop or the head jumps between panels. The sources are square and centred, so
# the crop is just a fixed window around the image centre — never a per-image
# -trim, which would re-centre on whatever hair happens to survive that frame.
#
# 00 is a full-body establishing shot with a different composition, reached by a
# cut, so it is framed on its own.
#
# Run from anywhere: art/person-scene/process.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IN="${1:-$ROOT/art/person-scene/source}"
OUT="${2:-$ROOT/src/lib/widgets/stage/scenes/person}"
INK='#28251f'     # --ink, mirrors src/app.css
QUALITY=82

# Head plates are normalised to this width first, so the 1254px and 1024px
# sources land on one scale, then windowed to STAGE_W x STAGE_H. The window is
# 480:280 — the stage viewBox — so the plates fill the frame with no letterbox.
NORM=1024
STAGE_W=1543
STAGE_H=900

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

plate() {
  local src="$1" name="$2"
  magick \
    \( "$src" -background white -alpha remove -alpha off \
       -colorspace gray -level 8%,97% -negate \) \
    \( +clone -fill "$INK" -colorize 100 \) \
    +swap -compose CopyOpacity -composite \
    "$TMP/${name}.png"
}

emit() {
  local name="$1"; shift
  magick "$TMP/${name}.png" "$@" \
    -define webp:method=6 -quality "$QUALITY" "${OUT}/${name}.webp"
  printf '  %-20s %8s  %s\n' "${name}.webp" \
    "$(du -h "${OUT}/${name}.webp" | cut -f1)" \
    "$(magick "${OUT}/${name}.webp" -format '%wx%h' info:)"
}

echo "Framing the establishing shot"
plate "${IN}/00-musk.png" "00-figure"
# Full body: trim to the figure, then pad to the stage aspect so it is centred
# rather than letterboxed by the renderer.
bw=$(magick "$TMP/00-figure.png" -trim -format '%h' info:)
bwid=$(awk "BEGIN{printf \"%d\", $bw * $STAGE_W / $STAGE_H}")
emit "00-figure" -trim +repage -background none -gravity center -extent "${bwid}x${bw}"

echo "Framing the reduction"
for i in 01 02 03 04 05 06 07 08 09 10; do
  src="${IN}/${i}-musk.png"
  [ -f "$src" ] || { echo "  missing ${src}" >&2; exit 1; }
  plate "$src" "${i}-head"
  emit "${i}-head" \
    -resize "${NORM}x${NORM}" \
    -background none -gravity center -extent "${STAGE_W}x${STAGE_H}"
done

echo "Total: $(du -sh "$OUT" | cut -f1)"
