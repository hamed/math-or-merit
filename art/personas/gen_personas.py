#!/usr/bin/env python3
"""Cartoon personas for the two scientists of the spherical-cow joke:
the physicist (Einstein) and the chemist (Mendeleev).

Same visual language as the cow (art/cow/gen_cow.py): circle grammar,
essay ink-on-cream, tissue tints, three stroke tiers. Bust portraits in a
shared 0 0 300 300 space.
"""
import math, random, sys, pathlib

OUT = pathlib.Path(__file__).parent

P = dict(
    ink='#3c352b',
    skin='#efdcc0',
    skin2='#e2cdae',         # nose/ear tone
    hair='#ece4d0',          # grey-white hair
    hair2='#ddd2b8',         # hair shadow tone
    coat_e='#a89478',        # einstein: darker tweed
    sweater='#8a7a5f',
    coat_m='#d9cbae',        # mendeleev: light suit
    vest='#c4b393',
    iris_e='#5a4632',
    iris_m='#8a7a5f',        # pale, intense
    eyewhite='#fdf8ec',
    hat='#4a4236',           # farmer's felt hat
    coat_f='#b0a184',        # farmer's coat
    hair_m='#5f5340',        # musk: dark hair
    blazer='#6b5d49',        # musk: blazer
    tee='#e8e0cc',           # musk: tee

    w_out=4.5, w_mid=3, w_det=2,
)

def fmt(v):
    return f"{v:.2f}".rstrip('0').rstrip('.')

def pol(cx, cy, r, deg):
    a = math.radians(deg)
    return (cx + r * math.cos(a), cy + r * math.sin(a))

def circle(cx, cy, r, fill, w=None, extra=''):
    ww = P['w_mid'] if w is None else w
    return (f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}" fill="{fill}" '
            f'stroke="{P["ink"]}" stroke-width="{ww}"{extra}/>')

def ellipse(cx, cy, rx, ry, fill, w=None):
    ww = P['w_mid'] if w is None else w
    return (f'<ellipse cx="{fmt(cx)}" cy="{fmt(cy)}" rx="{fmt(rx)}" ry="{fmt(ry)}" '
            f'fill="{fill}" stroke="{P["ink"]}" stroke-width="{ww}"/>')

def cluster(circles, fill, w=None):
    """Union-look for a circle cluster: a stroked pass, then a fill-only pass
    on top — the outline survives only on the outer silhouette."""
    ww = P['w_mid'] if w is None else w
    out = [f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}" fill="{fill}" '
           f'stroke="{P["ink"]}" stroke-width="{ww}"/>' for x, y, r in circles]
    out += [f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}" fill="{fill}"/>'
            for x, y, r in circles]
    return ''.join(out)

def rell(cx, cy, rx, ry, rot, fill, w=None):
    ww = P['w_mid'] if w is None else w
    return (f'<ellipse cx="{fmt(cx)}" cy="{fmt(cy)}" rx="{fmt(rx)}" ry="{fmt(ry)}" '
            f'fill="{fill}" stroke="{P["ink"]}" stroke-width="{ww}" '
            f'transform="rotate({rot} {fmt(cx)} {fmt(cy)})"/>')

def path(d, fill, w=None, extra=''):
    ww = P['w_mid'] if w is None else w
    return (f'<path d="{d}" fill="{fill}" stroke="{P["ink"]}" '
            f'stroke-width="{ww}" stroke-linecap="round" stroke-linejoin="round"{extra}/>')

def stroke_arc(x1, y1, x2, y2, r, sweep=1, w=None, opacity=1.0):
    ww = P['w_det'] if w is None else w
    op = f' opacity="{opacity}"' if opacity != 1 else ''
    return (f'<path d="M {fmt(x1)} {fmt(y1)} A {fmt(r)} {fmt(r)} 0 0 {sweep} '
            f'{fmt(x2)} {fmt(y2)}" fill="none" stroke="{P["ink"]}" '
            f'stroke-width="{ww}" stroke-linecap="round"{op}/>')


# --------------------------------------------------------------- shared face
def eye(cx, cy, rw, iris, lid_deg=18, tilt=0, iris_r=3.2, pupil_r=1.6):
    """White + iris + pupil + heavy upper lid as a filled chord cap
    (the cow's eyelid construction). lid_deg: bigger = lid sits higher."""
    e = [circle(cx, cy, rw, P['eyewhite'], w=P['w_det'])]
    e.append(circle(cx, cy + rw * 0.18, iris_r, iris, w=P['w_det']))
    e.append(f'<circle cx="{fmt(cx)}" cy="{fmt(cy + rw * 0.18)}" r="{fmt(pupil_r)}" fill="{P["ink"]}"/>')
    a1, a2 = 180 + lid_deg, 360 - lid_deg
    x1, y1 = pol(cx, cy, rw, a1)
    x2, y2 = pol(cx, cy, rw, a2)
    tf = f' transform="rotate({tilt} {fmt(cx)} {fmt(cy)})"' if tilt else ''
    e.append(f'<path d="M {fmt(x1)} {fmt(y1)} A {fmt(rw)} {fmt(rw)} 0 1 1 {fmt(x2)} {fmt(y2)} Z" '
             f'fill="{P["skin"]}" stroke="{P["ink"]}" stroke-width="{P["w_det"]}"{tf}/>')
    return ''.join(e)


def wild_hair(cx, cy, base_r, a_from, a_to, spike, seed=3, steps=13):
    """Electric halo: spiky closed silhouette from a_from to a_to (degrees,
    screen coords), alternating outer spike tips and inner valleys, joined
    by small arcs. Returns a filled path d."""
    rnd = random.Random(seed)
    pts = []
    n = steps
    for i in range(n + 1):
        a = a_from + (a_to - a_from) * i / n
        if i % 2 == 0:  # valley
            r = base_r + 6 + rnd.uniform(0, 4)
        else:           # spike tip
            # spikes longest at the top, shorter at the sides
            topness = math.sin(math.radians((a % 360) - 270) / 1.0)
            topness = 1 - abs(((a % 360) - 270) / max(abs(a_from - 270), 1))
            r = base_r + spike * (0.55 + 0.45 * topness) + rnd.uniform(-3, 6)
        pts.append(pol(cx, cy, r, a))
    d = f'M {fmt(pts[0][0])} {fmt(pts[0][1])} '
    for i in range(1, len(pts)):
        x, y = pts[i]
        sweep = 1 if i % 2 == 1 else 0  # bulge out to tips, curl into valleys
        d += f'A 16 16 0 0 {sweep} {fmt(x)} {fmt(y)} '
    # close along the head edge
    d += f'A {fmt(base_r)} {fmt(base_r)} 0 0 0 {fmt(pts[0][0])} {fmt(pts[0][1])} Z'
    return d


# ------------------------------------------------------------------ einstein
def einstein():
    e = []
    HX, HY, HR = 150, 132, 46

    # coat: rounded tweed shoulders, sweater in the V
    e.append(path('M 54 300 A 165 165 0 0 1 114 204 L 150 194 L 186 204 '
                  'A 165 165 0 0 1 246 300 Z', P['coat_e'], w=P['w_out']))
    e.append(path('M 120 300 L 124 208 L 150 198 L 176 208 L 180 300 Z',
                  P['sweater'], w=P['w_mid']))
    e.append(path('M 124 208 L 110 238 L 120 300', 'none', w=P['w_det']))
    e.append(path('M 176 208 L 190 238 L 180 300', 'none', w=P['w_det']))
    rnd = random.Random(7)
    for _ in range(30):
        x, y = rnd.uniform(60, 240), rnd.uniform(226, 296)
        if 110 < x < 190:
            continue
        e.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="1.3" fill="{P["ink"]}" opacity="0.22"/>')

    # neck (short, wide)
    e.append(path(f'M 134 {HY + 34} L 134 202 L 166 202 L 166 {HY + 34} Z',
                  P['skin'], w=P['w_det']))

    # ears + head first — the hair paints over the head's top edge
    e.append(circle(HX - HR - 2, HY + 10, 9, P['skin2'], w=P['w_det']))
    e.append(circle(HX + HR + 2, HY + 10, 9, P['skin2'], w=P['w_det']))
    e.append(circle(HX, HY, HR, P['skin'], w=P['w_out']))

    # the hair: an irregular, side-heavy cloud (unioned cluster)
    e.append(cluster([(98, 104, 20), (88, 126, 13), (107, 79, 22), (132, 63, 24),
                      (161, 60, 22), (188, 72, 21), (206, 92, 17), (212, 116, 12),
                      (79, 107, 8), (222, 103, 7), (148, 47, 11), (117, 54, 9),
                      (186, 52, 8)], P['hair']))
    # frizz texture: a few interior arcs only
    e.append(stroke_arc(112, 92, 122, 74, 20, 1, w=2, opacity=0.4))
    e.append(stroke_arc(150, 70, 162, 56, 20, 1, w=2, opacity=0.4))
    e.append(stroke_arc(190, 92, 200, 78, 20, 1, w=2, opacity=0.4))
    # flyaway wisps
    e.append(stroke_arc(70, 100, 60, 88, 16, 0, w=2))
    e.append(stroke_arc(228, 96, 238, 84, 16, 1, w=2))
    e.append(stroke_arc(152, 38, 158, 26, 14, 1, w=2))
    e.append(stroke_arc(108, 47, 100, 36, 14, 0, w=2))

    # forehead wrinkles
    e.append(stroke_arc(130, 102, 170, 102, 62, 1, w=2, opacity=0.5))
    e.append(stroke_arc(134, 110, 166, 110, 62, 1, w=2, opacity=0.5))

    # brows: thick and expressive, inner ends lifted (kind, tired)
    e.append(path('M 120 121 A 26 26 0 0 1 142 116', 'none', w=4.6))
    e.append(path('M 158 116 A 26 26 0 0 1 180 121', 'none', w=4.6))

    # eyes
    e.append(eye(133, 130, 6.5, P['iris_e'], lid_deg=16, tilt=5))
    e.append(eye(167, 130, 6.5, P['iris_e'], lid_deg=16, tilt=-5))
    e.append(stroke_arc(127, 140, 139, 140, 11, 0, w=2, opacity=0.45))
    e.append(stroke_arc(161, 140, 173, 140, 11, 0, w=2, opacity=0.45))

    # walrus mustache: two drooping ellipses, the nose blob resting on top
    e.append(rell(137, 167, 17, 7.5, 24, P['hair']))
    e.append(rell(163, 167, 17, 7.5, -24, P['hair']))
    e.append(ellipse(150, 153, 8.5, 7, P['skin2'], w=P['w_det']))
    # mouth shadow + smile creases
    e.append(stroke_arc(145, 177, 155, 177, 14, 0, w=2, opacity=0.55))
    e.append(stroke_arc(124, 152, 119, 163, 15, 0, w=2, opacity=0.4))
    e.append(stroke_arc(176, 152, 181, 163, 15, 1, w=2, opacity=0.4))

    return ''.join(e)


# ----------------------------------------------------------------- mendeleev
def mendeleev():
    e = []
    HX, HY, HR = 150, 106, 42

    # coat: broader, light suit, wide lapels
    e.append(path('M 44 300 A 175 175 0 0 1 106 192 L 150 180 L 194 192 '
                  'A 175 175 0 0 1 256 300 Z', P['coat_m'], w=P['w_out']))
    e.append(path('M 122 300 L 126 200 L 150 188 L 174 200 L 178 300 Z',
                  P['vest'], w=P['w_mid']))
    e.append(path('M 126 200 L 98 250 L 118 300', 'none', w=P['w_det']))
    e.append(path('M 174 200 L 202 250 L 182 300', 'none', w=P['w_det']))

    # neck
    e.append(path(f'M 138 {HY + 30} L 138 192 L 162 192 L 162 {HY + 30} Z',
                  P['skin'], w=P['w_det']))

    # ears + head first — high bare forehead
    e.append(circle(HX - HR - 2, HY + 8, 9, P['skin2'], w=P['w_det']))
    e.append(circle(HX + HR + 2, HY + 8, 9, P['skin2'], w=P['w_det']))
    e.append(circle(HX, HY, HR, P['skin'], w=P['w_out']))

    # long hair, swept back: crown tufts + side locks to the shoulders
    e.append(cluster([(122, 72, 14), (144, 65, 16), (166, 68, 15), (184, 78, 13),
                      (105, 96, 17), (99, 122, 15), (95, 148, 14), (93, 172, 13),
                      (195, 96, 17), (201, 122, 15), (205, 148, 14), (207, 172, 13)],
                     P['hair2']))
    e.append(stroke_arc(120, 90, 112, 112, 30, 0, w=2, opacity=0.4))
    e.append(stroke_arc(182, 92, 190, 114, 30, 1, w=2, opacity=0.4))

    # the beard: a tapering unioned cluster — broad at the cheeks,
    # chest-length tip
    e.append(cluster([(116, 136, 15), (184, 136, 15), (150, 150, 13),
                      (130, 146, 14), (170, 146, 14),
                      (112, 160, 16), (188, 160, 16),
                      (122, 184, 18), (178, 184, 18),
                      (136, 206, 19), (164, 206, 19),
                      (150, 224, 20), (141, 246, 12), (159, 246, 12),
                      (150, 260, 10)], P['hair']))
    # flowing curl texture, sparse
    e.append(stroke_arc(130, 168, 134, 206, 55, 0, w=2, opacity=0.45))
    e.append(stroke_arc(150, 176, 150, 220, 65, 1, w=2, opacity=0.45))
    e.append(stroke_arc(170, 168, 166, 206, 55, 1, w=2, opacity=0.45))
    e.append(stroke_arc(144, 232, 147, 254, 35, 0, w=2, opacity=0.45))
    # stray curls at the edges
    e.append(stroke_arc(100, 172, 94, 184, 12, 0, w=2))
    e.append(stroke_arc(200, 172, 206, 184, 12, 1, w=2))
    e.append(stroke_arc(152, 270, 158, 278, 10, 1, w=2))

    # forehead wrinkles
    e.append(stroke_arc(132, 78, 168, 78, 60, 1, w=2, opacity=0.45))
    e.append(stroke_arc(136, 86, 164, 86, 60, 1, w=2, opacity=0.45))

    # brows: bushy, straight, low
    e.append(path('M 121 97 L 143 95', 'none', w=4.8))
    e.append(path('M 157 95 L 179 97', 'none', w=4.8))

    # eyes: pale, focused squint
    e.append(eye(133, 105, 6, P['iris_m'], lid_deg=8, tilt=2))
    e.append(eye(167, 105, 6, P['iris_m'], lid_deg=8, tilt=-2))
    e.append(stroke_arc(121, 104, 119, 110, 8, 0, w=2, opacity=0.4))
    e.append(stroke_arc(179, 104, 181, 110, 8, 1, w=2, opacity=0.4))

    # mustache blending into the beard, nose bulb resting on top
    e.append(rell(138, 142, 15, 7, 20, P['hair2'], w=P['w_det']))
    e.append(rell(162, 142, 15, 7, -20, P['hair2'], w=P['w_det']))
    e.append(ellipse(150, 130, 9, 7.5, P['skin2'], w=P['w_det']))

    return ''.join(e)


def rect(x, y, w, h, rx, fill, sw=None):
    ww = P['w_mid'] if sw is None else sw
    return (f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" '
            f'rx="{fmt(rx)}" fill="{fill}" stroke="{P["ink"]}" stroke-width="{ww}"/>')


# -------------------------------------------------------------------- farmer
def farmer():
    """The farmer whose cow stopped giving milk (after the Bakewell
    engraving): wide-brimmed hat, side curls, jowls, buttoned coat."""
    e = []
    HX, HY, HR = 150, 124, 43

    # coat: heavy, buttoned, high collar with a white shirt wedge
    e.append(path('M 50 300 A 170 170 0 0 1 112 202 L 150 190 L 188 202 '
                  'A 170 170 0 0 1 250 300 Z', P['coat_f'], w=P['w_out']))
    e.append(path('M 141 248 L 140 210 L 150 198 L 160 210 L 159 248 Z',
                  P['eyewhite'], w=P['w_mid']))
    # collar flaps + buttons
    e.append(path('M 140 210 L 122 222 L 132 240', 'none', w=P['w_det']))
    e.append(path('M 160 210 L 178 222 L 168 240', 'none', w=P['w_det']))
    for by in (232, 252, 272, 292):
        e.append(circle(133, by, 2.2, P['ink'], w=0.1))

    # neck
    e.append(path(f'M 136 {HY + 30} L 136 200 L 164 200 L 164 {HY + 30} Z',
                  P['skin'], w=P['w_det']))

    # head with jowls (unioned: round face + heavy lower cheeks)
    e.append(cluster([(HX, HY, HR), (133, 152, 15), (167, 152, 15), (150, 158, 16)],
                     P['skin'], w=P['w_out']))
    # double-chin crease
    e.append(stroke_arc(138, 172, 162, 172, 22, 0, w=2, opacity=0.5))

    # side curls under the brim
    e.append(cluster([(103, 112, 13), (99, 132, 12), (103, 150, 11),
                      (197, 112, 13), (201, 132, 12), (197, 150, 11)],
                     P['hair2']))
    e.append(stroke_arc(96, 122, 104, 142, 16, 0, w=2, opacity=0.45))
    e.append(stroke_arc(204, 122, 196, 142, 16, 1, w=2, opacity=0.45))

    # the hat: flat-topped crown + broad swooping brim
    e.append(path('M 112 94 L 116 52 A 44 12 0 0 1 184 52 L 188 94 '
                  'A 90 26 0 0 0 112 94 Z', P['hat'], w=P['w_mid']))
    e.append(path('M 62 92 A 130 130 0 0 1 238 92 A 150 30 0 0 1 150 104 '
                  'A 150 30 0 0 1 62 92 Z', P['hat'], w=P['w_mid']))

    # face: steady, unimpressed
    e.append(path('M 124 112 L 144 112', 'none', w=3.6))
    e.append(path('M 156 112 L 176 112', 'none', w=3.6))
    e.append(eye(134, 122, 6, P['iris_e'], lid_deg=14, tilt=2))
    e.append(eye(166, 122, 6, P['iris_e'], lid_deg=14, tilt=-2))
    e.append(ellipse(150, 140, 7.5, 8.5, P['skin2'], w=P['w_det']))
    # small pursed mouth
    e.append(stroke_arc(142, 157, 158, 157, 24, 0, w=2.6))

    return ''.join(e)


# ---------------------------------------------------------------------- musk
def musk():
    """The spherical human, pre-sphere. The cow is circles; he is rectangles.
    (The essay later strips him into the same circle the cow became.)"""
    e = []

    # blazer over a tee: crisp rectangular shoulders
    e.append(rect(58, 208, 184, 92, 10, P['blazer'], sw=P['w_out']))
    e.append(rect(126, 212, 48, 88, 6, P['tee'], sw=P['w_mid']))
    # lapel lines
    e.append(path('M 126 212 L 108 236 L 118 300', 'none', w=P['w_det']))
    e.append(path('M 174 212 L 192 236 L 182 300', 'none', w=P['w_det']))

    # neck
    e.append(rect(136, 176, 28, 40, 6, P['skin'], sw=P['w_det']))

    # ears: small rectangles
    e.append(rect(102, 122, 12, 20, 5, P['skin2'], sw=P['w_det']))
    e.append(rect(186, 122, 12, 20, 5, P['skin2'], sw=P['w_det']))

    # the head: one rounded rectangle, jaw as wide as the brow
    e.append(rect(110, 78, 80, 108, 22, P['skin'], sw=P['w_out']))

    # hair: straight-edged cap, flat fringe with the faintest centre dip
    e.append(path('M 110 106 L 110 96 A 22 22 0 0 1 132 78 L 168 78 '
                  'A 22 22 0 0 1 190 96 L 190 106 L 176 102 L 150 100 '
                  'L 124 102 Z', P['hair_m'], w=P['w_mid']))

    # brows: flat bars
    e.append(rect(122, 116, 22, 4.5, 2, P['ink'], sw=0.6))
    e.append(rect(156, 116, 22, 4.5, 2, P['ink'], sw=0.6))
    # eyes: small, slightly narrowed (rectangular whites, of course)
    e.append(rect(126, 126, 15, 9, 4, P['eyewhite'], sw=P['w_det']))
    e.append(rect(159, 126, 15, 9, 4, P['eyewhite'], sw=P['w_det']))
    e.append(rect(131, 128, 6, 6, 2.4, P['iris_e'], sw=1))
    e.append(rect(163, 128, 6, 6, 2.4, P['iris_e'], sw=1))

    # nose: narrow vertical block
    e.append(rect(144, 132, 12, 22, 5, P['skin2'], sw=P['w_det']))

    # mouth: short flat bar with the faintest smirk tilt
    e.append(f'<rect x="138" y="164" width="24" height="4" rx="2" fill="{P["ink"]}" '
             f'transform="rotate(-3 150 166)"/>')
    # jaw definition: the rectangle jaw gets two corner shadow lines
    e.append(path('M 118 152 L 122 168', 'none', w=2, extra=' opacity="0.4"'))
    e.append(path('M 182 152 L 178 168', 'none', w=2, extra=' opacity="0.4"'))
    # chin crease
    e.append(path('M 144 176 L 156 176', 'none', w=2, extra=' opacity="0.5"'))

    return ''.join(e)


def svg(inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" '
            f'width="300mm" height="300mm">{inner}</svg>')


if __name__ == '__main__':
    (OUT / 'einstein.svg').write_text(svg(einstein()))
    (OUT / 'mendeleev.svg').write_text(svg(mendeleev()))
    (OUT / 'farmer.svg').write_text(svg(farmer()))
    (OUT / 'musk.svg').write_text(svg(musk()))
    print('written')
