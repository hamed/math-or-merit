#!/usr/bin/env python3
"""Regenerate both cows as clean, animation-ready SVGs from one parts table.

Sources: inbox/cow.svg + inbox/'spherical cow.svg' (author-drawn, Inkscape).
The spherical cow was the original design; the standing cow is a hand-morph
of it — head/face coordinates are identical in both. This script bakes the
awkward transforms (tail translate, udder matrix, teat use-chains), unifies
naming, and emits both poses in a shared 0 0 300 300 space.

Modes: bw (original palette, for overlay-diff against the sources) and
essay (site palette + expression-state variants).
"""
import math, sys, pathlib

OUT = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- transforms
def rot(deg, cx=0.0, cy=0.0):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    def f(x, y):
        x, y = x - cx, y - cy
        return (c * x - s * y + cx, s * x + c * y + cy)
    return f

def mat(a, b, c_, d, e, f_):
    return lambda x, y: (a * x + c_ * y + e, b * x + d * y + f_)

def tr(dx, dy):
    return lambda x, y: (x + dx, y + dy)

def chain(*fs):
    def f(x, y):
        for g in fs:
            x, y = g(x, y)
        return (x, y)
    return f

def fmt(v):
    return f"{v:.3f}".rstrip('0').rstrip('.')

# ------------------------------------------------------- baked cow-pose bits
# Udder in cow.svg: matrix(0.63330657,0.63330657,-0.63330657,0.63330657,182.32785,-30.260808)
UM = mat(0.63330657, 0.63330657, -0.63330657, 0.63330657, 182.32785, -30.260808)
USCALE = math.hypot(0.63330657, 0.63330657)          # 0.89563
R135 = rot(-135)

# sack: half-disc, local centre (-228.62437, -36.0950661), r 30, transform rotate(-135) then UM
SACK_C = chain(R135, UM)(-228.62437, -36.0950661)
SACK_R = 30 * USCALE

# teats: g131 local centre (135,200) after its rotate(-135); then per-use translates, then UM
def teat_at(dx, dy):
    return chain(tr(8.6917808 + dx, 8.6917808 + dy), UM)(135.0, 200.0)

COW_TEATS = [
    teat_at(0, 0),                                    # g131
    teat_at(0.29794517, 0.29794517),                  # use131
    teat_at(0.29794517 + 14.167808, 0.29794517 - 12.873288),          # use132
    teat_at(0.29794517 + 14.167808 + 0.53424663,
            0.29794517 - 12.873288 - 2.4246572),      # use133
]
# teat: local half-ellipse, flat edge 2×3 units, bulge 5 deep; the net
# rotate(-90) turns it flat-edge-horizontal, bulging down
TEAT_RX, TEAT_RY, TIP_R = 3 * USCALE, 5 * USCALE, 1 * USCALE

# tail in cow.svg: translate(46.029519,-131.39674) — relative arcs, only the start moves
COW_TAIL_START = (189.02722 + 46.029519, 215.38995 - 131.39674)

# ------------------------------------------------------------------ palettes
BW = dict(ink='#000000', hide='#ffffff', skin='#ffd5d5', earin='#ffd5d5',
          bone='#ffffff', eyewhite='#ffffff', udder='#f4d7d7',
          teat='#e9c6af', tip='#784421', iris='#502d16',
          w_out=0.5, w_mid=0.5, w_det=0.3, shadow='none')
# essay palette + tissue tints: horn=bone, inner ear/udder=rose, eye whites
# brighter than the hide so the face pops
ESSAY = dict(ink='#3c352b', hide='#f6ead2', skin='#efdcc0', earin='#ecd3c5',
             bone='#e5d5ae', eyewhite='#fdf8ec', udder='#eed7c9',
             teat='#e0c0a8', tip='#8b5e34', iris='#5a4632',
             w_out=4.5, w_mid=3, w_det=2, shadow='#3c352b')

# ------------------------------------------------------------------- helpers
def circle(cx, cy, r, fill, stroke, w, id=None, cls=None):
    a = f' id="{id}"' if id else ''
    a += f' class="{cls}"' if cls else ''
    return f'<circle{a} cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'

def path(d, fill, stroke, w, id=None, extra=''):
    a = f' id="{id}"' if id else ''
    return f'<path{a} d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"{extra}/>'

def half_down(cx, cy, rx, ry):
    """Half-ellipse bulging down (flat chord on top), closed."""
    return (f"M {fmt(cx-rx)} {fmt(cy)} A {fmt(rx)} {fmt(ry)} 0 0 0 "
            f"{fmt(cx+rx)} {fmt(cy)} Z")

def cap(cx, cy, r, a1, a2):
    """Filled chord-cap of a circle from angle a1 to a2 (degrees, screen
    coords), sweeping clockwise over the top."""
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    x2, y2 = cx + r * math.cos(math.radians(a2)), cy + r * math.sin(math.radians(a2))
    large = 1 if ((a2 - a1) % 360) > 180 else 0
    return (f"M {fmt(x1)} {fmt(y1)} A {fmt(r)} {fmt(r)} 0 {large} 1 "
            f"{fmt(x2)} {fmt(y2)} Z")

# --------------------------------------------------------------- shared head
FACE = ("m 150.00015,30.000236 a 120,120 0 0 0 -43.72912,8.251176 "
        "450,450 0 0 0 18.20509,71.527418 65,65 0 0 0 25.52403,5.22139 "
        "65,65 0 0 0 25.52402,-5.22139 450,450 0 0 0 18.20457,-71.527418 "
        "120,120 0 0 0 -43.72859,-8.251176 z")
JAW = ("m 150.00015,90.000191 a 60,60 0 0 0 -37.61786,13.356289 "
       "40,40 0 0 0 37.61786,26.64334 40,40 0 0 0 37.61734,-26.64334 "
       "60,60 0 0 0 -37.61734,-13.356289 z")
EAR_L_OUT = ("M 107.75156,47.39659 A 60,60 0 0 0 90.000191,90.000191 "
             "25,25 0 0 0 115.00022,65.000167 25,25 0 0 0 107.75156,47.39659 Z")
EAR_L_IN = ("M 112.87631,54.917061 A 60,60 0 0 0 91.232674,89.969702 "
            "25,25 0 0 0 115.00022,65.000167 25,25 0 0 0 112.87631,54.917061 Z")
EAR_R_OUT = ("M 192.24873,47.39659 A 25,25 0 0 0 185.00008,65.000167 "
             "25,25 0 0 0 210.0001,90.000191 60,60 0 0 0 192.24873,47.39659 Z")
EAR_R_IN = ("M 187.12553,54.91241 A 25,25 0 0 0 185.00008,65.000167 "
            "25,25 0 0 0 208.77485,89.970219 60,60 0 0 0 187.12553,54.91241 Z")
HORN_COW = ("M 150.00015,63.397968 A 120,120 0 0 1 58.691508,20.889452 "
            "200,200 0 0 0 150.00015,43.398155 200,200 0 0 0 241.30878,20.889452 "
            "120,120 0 0 1 150.00015,63.397968 Z")
HORN_SPH = ("M 150.00015,30.000236 A 120,120 0 0 0 58.691508,72.508752 "
            "200,200 0 0 1 150.00015,50.000049 200,200 0 0 1 241.30878,72.508752 "
            "120,120 0 0 0 150.00015,30.000236 Z")
LID_SLEEPY = ("m 124.93621,79.861327 a 10,10 0 0 1 -2.8656,-11.352506 "
              "10,10 0 0 1 9.87493,-6.291021 10,10 0 0 1 9.07781,7.394891 z")
LID_ANGRY = cap(131.36409, 72.200882, 10, 195, 25)   # brow slanted toward the nose

EYE_C = (131.36409, 72.200882)
IRIS_SLEEPY = (132.08194, 77.171829)                 # low in the white = droop

# mouth states — all circle arcs around (150, ~113)
MOUTHS = dict(
    sad="M 130 115.359 A 40 40 0 0 1 170 115.359",   # bulge up = frown (as drawn)
    smile="M 136 112 A 40 40 0 0 0 164 112",         # a bit of smile
    flat="M 138 113 L 162 113",
    # vacuum: a little gasping "o" (closed stroked circle)
    gasp="M 150 109.5 A 3.6 4.2 0 1 1 149.98 109.5 Z",
    angry="M 134 117 A 24 24 0 0 1 166 117",         # deeper, tighter frown
)

# limbs (drawn for the spherical body; the cow pose reuses squashed variants)
LIMB_SPH = ("M 54.000321,77.999373 A 120,120 0 0 0 30.016772,147.98322 "
            "100,100 0 0 0 50.000049,150.00015 100,100 0 0 0 100.0001,136.60045 "
            "100,100 0 0 1 54.000321,77.999373 Z")
LIMB_COW = ("m 53.974622,104.86675 a 120.27679,75.266068 0 0 0 -24.03887,43.89508 "
            "100.23066,62.721723 0 0 0 20.029371,1.26505 100.23066,62.721723 0 0 0 "
            "50.115377,-8.40452 100.23066,62.721723 0 0 1 -46.105878,-36.75561 z")
HOOF = ("m 114.94302,137.90778 a 15,15 0 0 1 -15.597211,13.67839 "
        "15,15 0 0 1 -14.34571,-14.98572 15,15 0 0 1 14.345709,-14.98572 "
        "15,15 0 0 1 15.597212,13.67838 l -14.94292,1.30734 z")
HOOF_C = (100.0001, 136.60045)                       # pie centre — split line anchor

TAIL_SPH = ("M 189.02722 215.38995 A 120 120 0 0 1 139.48968 269.53859 "
            "A 120 120 0 0 0 150.00015 270.00006 A 120 120 0 0 0 157.332 269.77578 "
            "A 120 120 0 0 0 189.02722 215.38995 z")
TAIL_COW = (f"M {fmt(COW_TAIL_START[0])} {fmt(COW_TAIL_START[1])} "
            "a 120,120 0 0 1 -49.53754,54.14864 120,120 0 0 0 10.51047,0.46147 "
            "120,120 0 0 0 7.33185,-0.22428 120,120 0 0 0 31.69522,-54.38583 z")

# spherical teats: rotate(45,150,200) of the diamond (135,200)(150,215)(165,200)(150,185)
R45 = rot(45, 150, 200)
SPH_TEATS = [R45(135, 200), R45(150, 215), R45(165, 200), R45(150, 185)]


def build(pose, P, upgrades=True, mouth='sad', eyes='sleepy',
          nostrils='open', puff=False, standalone=True):
    """pose: 'cow' | 'sphere'. Returns inner SVG for one cow figure."""
    ink, hide = P['ink'], P['hide']
    w, wm, wd = P['w_out'], P['w_mid'], P['w_det']
    e = []

    # ---- shadow (standalone only; the scene draws its own)
    if standalone and P['shadow'] != 'none':
        if pose == 'cow':
            e.append(f'<ellipse cx="150" cy="232" rx="60" ry="7" fill="{P["shadow"]}" fill-opacity="0.14"/>')
        else:
            e.append(f'<ellipse cx="150" cy="276" rx="85" ry="8" fill="{P["shadow"]}" fill-opacity="0.14"/>')

    # ---- tail (cow: behind the body; sphere: appended after the udder)
    def tail(d, tipx, tipy):
        t = [path(d, hide, ink, w, id=f'{pose}-tail-curve')]
        t.append(circle(tipx, tipy, 5, ink, ink, wd))
        if upgrades:  # tuft: two smaller circles trailing the tip
            ang = -35 if pose == 'cow' else 25
            a = math.radians(ang)
            for i, r2 in ((1, 3.2), (2, 2.2)):
                t.append(circle(tipx + math.cos(a) * 5.5 * i,
                                tipy - math.sin(a) * 5.5 * i, r2, ink, ink, wd))
        return f'<g id="{pose}-tail">' + ''.join(t) + '</g>'

    if pose == 'cow':
        e.append(tail(TAIL_COW, *COW_TAIL_START))

    # ---- body
    if pose == 'cow':
        e.append(f'<ellipse id="cow-body" cx="150" cy="111.371" rx="60" ry="90" '
                 f'fill="{hide}" stroke="{ink}" stroke-width="{w}"/>')
    else:
        e.append(circle(150, 150, 120, hide, ink, w, id='sphere-body'))

    # ---- body spots (upgrades; same ids in both poses so spots morph too)
    if upgrades:
        if pose == 'cow':
            spots = [(118, 150, 14, 19, -18), (186, 96, 9, 13, 14)]
        else:
            # clear of the limb fills: beside the head, below the udder
            spots = [(86, 86, 12, 16, -24), (117, 247, 10, 7, 12)]
        for i, (cx, cy, rx, ry, a) in enumerate(spots, 1):
            e.append(f'<ellipse id="{pose}-spot-{i}" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" '
                     f'fill="{ink}" transform="rotate({a} {cx} {cy})"/>')

    # ---- udder (painted BEFORE the limbs: the limbs clip the sack corners,
    # exactly as drawn in the source files)
    u = []
    if pose == 'cow':
        u.append(path(half_down(SACK_C[0], SACK_C[1], SACK_R, SACK_R),
                      P['udder'], ink, wm, id='cow-udder-sack'))
        for i, (tx, ty) in enumerate(COW_TEATS, 1):
            u.append(path(half_down(tx, ty, TEAT_RX, TEAT_RY), P['teat'], ink, wd,
                          id=f'cow-teat-{i}'))
            u.append(circle(tx, ty + TEAT_RY * 0.65, TIP_R, P['tip'], ink, wd))
        e.append('<g id="cow-udder">' + ''.join(u) + '</g>')
    else:
        u.append(circle(150, 200, 30, P['udder'], ink, wm, id='sphere-udder-sack'))
        for i, (tx, ty) in enumerate(SPH_TEATS, 1):
            u.append(circle(tx, ty, 5, P['teat'], ink, wd, id=f'sphere-teat-{i}'))
            u.append(circle(tx, ty, 1, P['tip'], ink, wd))
        e.append('<g id="sphere-udder">' + ''.join(u) + '</g>')

    # ---- limbs
    def limb(kind, side, group_tf, limb_d):
        inner = path(limb_d, hide, ink, w) + path(HOOF, ink, ink, wd)
        g = f'<g transform="{group_tf}">{inner}</g>' if group_tf else inner
        if side == 'right':
            g = f'<g id="{pose}-{kind}-right" transform="matrix(-1,0,0,1,300,0)">{g}</g>'
        else:
            g = f'<g id="{pose}-{kind}-left">{g}</g>'
        return g

    if pose == 'cow':
        # the visible pair points straight down (hand slot, rotated 75°)
        e.append(limb('hand', 'left', 'rotate(75 62.485389 191.03907)', LIMB_COW))
        e.append(limb('hand', 'right', 'rotate(75 62.485389 191.03907)', LIMB_COW))
    else:
        e.append(limb('hand', 'left', '', LIMB_SPH))
        e.append(limb('hand', 'right', '', LIMB_SPH))
        e.append(limb('leg', 'left', 'rotate(-53.260645 150 150)', LIMB_SPH))
        e.append(limb('leg', 'right', 'rotate(-53.260645 150 150)', LIMB_SPH))

    # ---- head (identical coordinates in both poses — the face is invariant)
    h = []
    h.append(f'<g id="{pose}-ear-left">' + path(EAR_L_OUT, hide, ink, w)
             + path(EAR_L_IN, P['earin'], ink, wd) + '</g>')
    h.append(f'<g id="{pose}-ear-right">' + path(EAR_R_OUT, hide, ink, w)
             + path(EAR_R_IN, P['earin'], ink, wd) + '</g>')
    h.append(path(HORN_COW if pose == 'cow' else HORN_SPH, P['bone'], ink, wm,
                  id=f'{pose}-horn'))
    h.append(path(FACE, hide, ink, w, id=f'{pose}-face'))
    jaw = path(JAW, P['skin'], ink, wm, id=f'{pose}-jaw')
    if puff:
        jaw = ('<g transform="translate(150 107) scale(1.09) translate(-150 -107)">'
               + jaw + '</g>')
    h.append(jaw)
    h.append(f'<ellipse id="{pose}-mark" cx="165" cy="65" rx="20" ry="25" fill="{ink}"/>')

    # eyes: left drawn, right mirrored about x=300 (one axis, everywhere)
    def eye(side):
        ix, iy = IRIS_SLEEPY if eyes == 'sleepy' else EYE_C
        pr = 4.6 if eyes == 'dilated' else 2.5
        g = [circle(*EYE_C, 10, P['eyewhite'], ink, wd),
             circle(ix, iy, 5, P['iris'], ink, wd),
             circle(ix, iy, pr, ink, ink, wd)]
        if eyes == 'sleepy':
            g.append(path(LID_SLEEPY, hide, ink, wd))
        elif eyes == 'angry':
            g.append(path(LID_ANGRY, hide, ink, wd))
        tf = ' transform="matrix(-1,0,0,1,300,0)"' if side == 'right' else ''
        return f'<g id="{pose}-eye-{side}"{tf}>' + ''.join(g) + '</g>'

    h.append(eye('left'))
    h.append(eye('right'))
    if nostrils == 'open':
        h.append(circle(134.12498, 100, 5, ink, ink, wd))
        h.append(circle(165.87498, 100, 5, ink, ink, wd))
    else:  # pinched shut in the vacuum
        for nx in (134.12498, 165.87498):
            h.append(f'<line x1="{fmt(nx-4.5)}" y1="100" x2="{fmt(nx+4.5)}" y2="100" '
                     f'stroke="{ink}" stroke-width="2.6" stroke-linecap="round"/>')
    h.append(path(MOUTHS[mouth], 'none', ink, wd, id=f'{pose}-mouth',
                  extra=' stroke-linecap="round"'))
    e.append(f'<g id="{pose}-head">' + ''.join(h) + '</g>')

    if pose == 'sphere':
        e.append(tail(TAIL_SPH, 189.02722, 215.38995))

    return f'<g id="{pose}">' + ''.join(e) + '</g>'


def emit_ts():
    """Print the cow-geometry.ts module for the stage scene."""
    def pt(x, y):
        return f"{{ x: {fmt(x)}, y: {fmt(y)} }}"
    cow_tuft = [(COW_TAIL_START[0] + math.cos(math.radians(-35)) * 5.5 * i,
                 COW_TAIL_START[1] - math.sin(math.radians(-35)) * 5.5 * i, r)
                for i, r in ((1, 3.2), (2, 2.2))]
    sph_tuft = [(189.02722 + math.cos(math.radians(25)) * 5.5 * i,
                 215.38995 - math.sin(math.radians(25)) * 5.5 * i, r)
                for i, r in ((1, 3.2), (2, 2.2))]
    def tuft_ts(ts_):
        return '[' + ', '.join(f"{{ x: {fmt(x)}, y: {fmt(y)}, r: {r} }}" for x, y, r in ts_) + ']'
    def teats_ts(ts_):
        return '[' + ', '.join(pt(x, y) for x, y in ts_) + ']'
    print(f"""/**
 * Cow geometry for the morph scenes, in a shared 0 0 300 300 space.
 *
 * GENERATED from art/cow/gen_cow.py (mode ts) — extracted from the
 * author-drawn Inkscape sources (art/cow/*.source.svg). The spherical cow is
 * the original design; the standing cow is a hand-morph of it, so the head
 * is at IDENTICAL coordinates in both poses — only the body, horn, limbs,
 * udder and tail differ. Every shape is a circle or a circle arc.
 */

export const BODY_COW = {{ cx: 150, cy: 111.371, rx: 60, ry: 90 }};
export const BODY_SPHERE = {{ cx: 150, cy: 150, r: 120 }};

export const FACE = '{FACE}';
export const JAW = '{JAW}';
export const EAR_L_OUT = '{EAR_L_OUT}';
export const EAR_L_IN = '{EAR_L_IN}';
export const EAR_R_OUT = '{EAR_R_OUT}';
export const EAR_R_IN = '{EAR_R_IN}';
export const HORN_COW = '{HORN_COW}';
export const HORN_SPHERE = '{HORN_SPH}';
export const MARK = {{ cx: 165, cy: 65, rx: 20, ry: 25 }};

/** Mouth states — sad is the resting face. */
export const MOUTH = {{
  sad: '{MOUTHS["sad"]}',
  smile: '{MOUTHS["smile"]}',
  flat: '{MOUTHS["flat"]}',
  gasp: '{MOUTHS["gasp"]}',
  angry: '{MOUTHS["angry"]}',
}};

/** One eye, drawn as the LEFT eye; the right eye mirrors via MIRROR. */
export const EYE = {{
  cx: {fmt(EYE_C[0])}, cy: {fmt(EYE_C[1])}, r: 10,
  irisSleepy: {pt(*IRIS_SLEEPY)},
  irisR: 5, pupilR: 2.5, pupilDilatedR: 4.6,
  lidSleepy: '{LID_SLEEPY}',
  lidAngry: '{LID_ANGRY}',
}};

export const NOSTRIL = {{ leftX: 134.125, rightX: 165.875, y: 100, r: 5, sealHalf: 4.5 }};

export const LIMB_COW = '{LIMB_COW}';
export const LIMB_SPHERE = '{LIMB_SPH}';
export const HOOF = '{HOOF}';
/** Standing pose: the hand pair rotates straight down (pivot = shoulder). */
export const COW_HAND_TF = 'rotate(75 62.485 191.039)';
export const SPHERE_LEG_TF = 'rotate(-53.261 150 150)';
/** One mirror axis for every right-hand part. */
export const MIRROR = 'matrix(-1,0,0,1,300,0)';

export const TAIL_COW = {{
  d: '{TAIL_COW}',
  tip: {pt(*COW_TAIL_START)}, tipR: 5,
  tuft: {tuft_ts(cow_tuft)},
}};
export const TAIL_SPHERE = {{
  d: '{TAIL_SPH}',
  tip: {pt(189.02722, 215.38995)}, tipR: 5,
  tuft: {tuft_ts(sph_tuft)},
}};

export const UDDER_COW = {{
  sack: '{half_down(SACK_C[0], SACK_C[1], SACK_R, SACK_R)}',
  teats: {teats_ts(COW_TEATS)},
  teatRx: {fmt(TEAT_RX)}, teatRy: {fmt(TEAT_RY)}, tipR: {fmt(TIP_R)}, tipDy: {fmt(TEAT_RY * 0.65)},
}};
export const UDDER_SPHERE = {{
  cx: 150, cy: 200, r: 30,
  teats: {teats_ts(SPH_TEATS)}, teatR: 5, tipR: 1,
}};

/** Hide spots (ellipse + rotate), same count in both poses so they morph. */
export const SPOTS_COW = [
  {{ cx: 118, cy: 150, rx: 14, ry: 19, rot: -18 }},
  {{ cx: 186, cy: 96, rx: 9, ry: 13, rot: 14 }},
];
export const SPOTS_SPHERE = [
  {{ cx: 86, cy: 86, rx: 12, ry: 16, rot: -24 }},
  {{ cx: 117, cy: 247, rx: 10, ry: 7, rot: 12 }},
];

/** Half-ellipse teat, flat edge up, bulging down. */
export function teatPath(cx: number, cy: number, rx: number, ry: number): string {{
  return `M ${{cx - rx}} ${{cy}} A ${{rx}} ${{ry}} 0 0 0 ${{cx + rx}} ${{cy}} Z`;
}}""")


def svg(inner, w=300, h=300):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}mm" height="{h}mm">{inner}</svg>')


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'bw'
    if mode == 'bw':  # geometry-verification: original palette, no upgrades
        (OUT / 'clean-cow-bw.svg').write_text(
            svg(build('cow', BW, upgrades=False, mouth='sad')))
        (OUT / 'clean-sphere-bw.svg').write_text(
            svg(build('sphere', BW, upgrades=False, mouth='sad')))
        print('bw written')
    elif mode == 'essay':
        (OUT / 'cow-essay.svg').write_text(svg(build('cow', ESSAY)))
        (OUT / 'sphere-essay.svg').write_text(svg(build('sphere', ESSAY)))
        print('essay written')
    elif mode == 'ts':
        emit_ts()
    elif mode == 'states':
        # expression grid: (pose, mouth, eyes) per the beat map
        cells = [
            ('cow', 'sad', 'sleepy', 'once — sad'),
            ('cow', 'smile', 'sleepy', 'chemist — a bit of smile'),
            ('cow', 'flat', 'sleepy', 'physicist — flat'),
            ('sphere', 'flat', 'wide', 'sphere — eyes wide open'),
            ('sphere', 'gasp', 'dilated', 'vacuum — gasp, pinched, puffed'),
            ('sphere', 'angry', 'angry', 'rolling — angry'),
        ]
        for pose, m, ey, label in cells:
            f = OUT / f'state-{label.split(" ")[0]}-{m}-{ey}.svg'
            vac = m == 'gasp'
            f.write_text(svg(build(pose, ESSAY, mouth=m, eyes=ey,
                                   nostrils='closed' if vac else 'open', puff=vac)))
        print('states written')


if __name__ == '__main__':
    main()
