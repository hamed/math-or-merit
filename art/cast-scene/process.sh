#!/usr/bin/env bash
# Rebuilds the cow-story cast plates from their sources.
#
# Sources live in art/cast-scene/source/ (promoted out of inbox/ once accepted,
# the same way art/cow/ holds the cow's). They are large and untracked; the
# committed artefacts are the WebP plates this writes.
#
# Two things happen here.
#
# 1. Ink keying. The sources are black ink on near-white paper. The essay's
#    stage is warm paper (--paper #f4efe4), so a white rectangle would read as
#    a pasted-on card and break the frameless mandate. We key luminance to
#    alpha: the paper drops out entirely and the ink is re-tinted to --ink, so
#    the drawings sit directly on the page like every other mark in the essay.
#
# 2. A SHARED crop. The six studio frames (00-05) are one continuous shot of
#    the same cast, and the scene cuts between them — so they must be cropped
#    identically or the cast jumps between beats. We measure every frame's
#    content box, take the union, and cut all six to that one box. Never switch
#    this to a per-image -trim. 06 is a different location (full-bleed pitch),
#    so it is trimmed on its own and then matched to the studio ASPECT.
#
# Run from anywhere: art/cast-scene/process.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IN="${1:-$ROOT/art/cast-scene/source}"
OUT="${2:-$ROOT/src/lib/widgets/stage/scenes/cast}"
INK='#28251f'     # --ink, mirrors src/app.css
WIDTH=1600        # ~2x the widest stage render; keeps the hatching crisp
QUALITY=82
PAD=24            # breathing room around the union box, in source pixels

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# The studio frames, in scene order. 06 is handled separately.
STUDIO=(
  "00-cow-introduction.png:00-introduction"
  "01-darwin.png:01-darwin"
  "02-couri.png:02-chemist"
  "03-cow-physics.png:03-physicist"
  "04-cow-physics-spherical.png:04-spherical"
  "05-cow-physics-spherical-no-gravity.png:05-vacuum"
)

# Build the tinted plate for one source into $TMP.
#
# Some sources ship their own alpha channel; it has to be flattened onto white
# BEFORE the grayscale step, or the key reads the transparency instead of the
# ink and the whole plate comes out empty.
plate() {
  local src="$1" name="$2"
  magick \
    \( "$src" -background white -alpha remove -alpha off \
       -resize "${WIDTH}x" -colorspace gray -level 8%,97% -negate \) \
    \( +clone -fill "$INK" -colorize 100 \) \
    +swap -compose CopyOpacity -composite \
    "$TMP/${name}.png"
}

echo "Pass 1: keying ink"
for entry in "${STUDIO[@]}"; do
  plate "${IN}/${entry%%:*}" "${entry##*:}"
done
plate "${IN}/06-football.jpeg" "06-football"

echo "Pass 2: measuring the shared content box"
minx=999999; miny=999999; maxx=0; maxy=0
for entry in "${STUDIO[@]}"; do
  read -r w h x y <<<"$(magick "$TMP/${entry##*:}.png" -trim -format '%w %h %X %Y' info: | tr -d '+')"
  (( x < minx )) && minx=$x
  (( y < miny )) && miny=$y
  (( x + w > maxx )) && maxx=$(( x + w ))
  (( y + h > maxy )) && maxy=$(( y + h ))
done
cx=$(( minx > PAD ? minx - PAD : 0 ))
cy=$(( miny > PAD ? miny - PAD : 0 ))
cw=$(( maxx - cx + PAD ))
ch=$(( maxy - cy + PAD ))
printf '  union box %dx%d+%d+%d  (aspect %.3f)\n' "$cw" "$ch" "$cx" "$cy" \
  "$(awk "BEGIN{print $cw/$ch}")"

echo "Pass 3: cropping and encoding"
emit() {
  local name="$1"; shift
  magick "$TMP/${name}.png" "$@" \
    -define webp:method=6 -quality "$QUALITY" "${OUT}/${name}.webp"
  printf '  %-24s %8s  %s\n' "${name}.webp" \
    "$(du -h "${OUT}/${name}.webp" | cut -f1)" \
    "$(magick "${OUT}/${name}.webp" -format '%wx%h' info:)"
}

for entry in "${STUDIO[@]}"; do
  emit "${entry##*:}" -crop "${cw}x${ch}+${cx}+${cy}" +repage
done

# The pitch is a different location, but it must match the studio frames'
# ASPECT or the cast visibly changes size across the cut — the plates are fitted
# into one stage box, so a squarer frame renders smaller. We trim it to its own
# content, then cut it to the studio aspect from the TOP, which keeps the ball
# and the faces and spends the foreground grass, which carries nothing.
fw=$(magick "$TMP/06-football.png" -trim -format '%w' info:)
fh=$(awk "BEGIN{printf \"%d\", $fw / ($cw/$ch)}")
printf '  pitch cut to %dx%d to match the studio aspect\n' "$fw" "$fh"
emit "06-football" -trim +repage -gravity north -crop "${fw}x${fh}+0+0" +repage

echo "Total: $(du -sh "$OUT" | cut -f1)"
