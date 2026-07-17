#!/usr/bin/env python3
"""Full-body cast for the essay, two grammars per character:

  'circle' — strict circle/arc construction (the cow's grammar)
  'loose'  — simple geometric shapes and curves, whatever fits

Characters: einstein (physicist), curie (chemist), musk (young, slim,
receding hairline, almost no chin — after the inbox references), farmer.
Essay ink-on-cream, tissue tints, three stroke tiers, 0 0 300 300 space.
"""
import math, random, pathlib, sys

OUT = pathlib.Path(__file__).parent

P = dict(
    ink='#3c352b',
    skin='#efdcc0', skin2='#e2cdae',
    hairgrey='#ece4d0', hairgrey2='#ddd2b8',
    hairdark='#5f5340',
    eyewhite='#fdf8ec',
    iris='#5a4632',
    tweed='#a89478', sweater='#8a7a5f', trousers='#8d7f68',
    dress='#514738', collar='#fdf8ec',
    shirt='#a99a7f', jeans='#7d735f',
    coat_f='#b0a184', hat='#4a4236',
    flask='#fdf8ec',
    w1=4.5, w2=3, w3=2,
)

def fmt(v):
    return f"{v:.2f}".rstrip('0').rstrip('.')

def pol(cx, cy, r, deg):
    a = math.radians(deg)
    return (cx + r * math.cos(a), cy + r * math.sin(a))

def C(cx, cy, r, fill, w=None, extra=''):
    ww = P['w2'] if w is None else w
    return (f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}" fill="{fill}" '
            f'stroke="{P["ink"]}" stroke-width="{ww}"{extra}/>')

def E(cx, cy, rx, ry, fill, w=None, rot=0):
    ww = P['w2'] if w is None else w
    tf = f' transform="rotate({rot} {fmt(cx)} {fmt(cy)})"' if rot else ''
    return (f'<ellipse cx="{fmt(cx)}" cy="{fmt(cy)}" rx="{fmt(rx)}" ry="{fmt(ry)}" '
            f'fill="{fill}" stroke="{P["ink"]}" stroke-width="{ww}"{tf}/>')

def R(x, y, w_, h, rx, fill, sw=None):
    ww = P['w2'] if sw is None else sw
    return (f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w_)}" height="{fmt(h)}" '
            f'rx="{fmt(rx)}" fill="{fill}" stroke="{P["ink"]}" stroke-width="{ww}"/>')

def Pth(d, fill, w=None, extra=''):
    ww = P['w2'] if w is None else w
    return (f'<path d="{d}" fill="{fill}" stroke="{P["ink"]}" stroke-width="{ww}" '
            f'stroke-linecap="round" stroke-linejoin="round"{extra}/>')

def arc(x1, y1, x2, y2, r, sweep=1, w=None, op=1.0):
    ww = P['w3'] if w is None else w
    o = f' opacity="{op}"' if op != 1 else ''
    return (f'<path d="M {fmt(x1)} {fmt(y1)} A {fmt(r)} {fmt(r)} 0 0 {sweep} '
            f'{fmt(x2)} {fmt(y2)}" fill="none" stroke="{P["ink"]}" '
            f'stroke-width="{ww}" stroke-linecap="round"{o}/>')

def cluster(circles, fill, w=None):
    ww = P['w2'] if w is None else w
    out = [f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}" fill="{fill}" '
           f'stroke="{P["ink"]}" stroke-width="{ww}"/>' for x, y, r in circles]
    out += [f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(r)}" fill="{fill}"/>'
            for x, y, r in circles]
    return ''.join(out)

_mask_n = 0
def cut_circle(cx, cy, r, bites, fill, w=None):
    """A big circle with pieces cut out (mask): bites = [(x, y, r), ...].
    The stroke rides the mask edge via a slightly smaller white core."""
    global _mask_n
    _mask_n += 1
    mid = f'cut{_mask_n}'
    ww = P['w2'] if w is None else w
    m = [f'<mask id="{mid}">',
         f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r + ww)}" fill="#fff"/>']
    m += [f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(br)}" fill="#000"/>'
          for x, y, br in bites]
    m.append('</mask>')
    # stroke pass: bigger ink circle under; fill pass: the fill circle — both
    # masked, so the cutouts carve through stroke and fill together
    body = (f'<g mask="url(#{mid})">'
            f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}" fill="{P["ink"]}"/>'
            f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r - ww)}" fill="{fill}"/>'
            f'</g>')
    # redraw the bite rims in ink, clipped to the circle, so every cut reads
    # as a drawn notch instead of a gap in the outline
    rims = [f'<clipPath id="{mid}c"><circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}"/></clipPath>',
            f'<g clip-path="url(#{mid}c)">']
    rims += [f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{fmt(br)}" fill="none" '
             f'stroke="{P["ink"]}" stroke-width="{ww}"/>' for x, y, br in bites]
    rims.append('</g>')
    return ''.join(m) + body + ''.join(rims)


# ------------------------------------------------------------- shared pieces
def eye(cx, cy, rw, lid_deg=16, tilt=0, iris_r=2.8, pupil_r=1.4):
    e = [C(cx, cy, rw, P['eyewhite'], w=P['w3'])]
    e.append(C(cx, cy + rw * 0.18, iris_r, P['iris'], w=P['w3']))
    e.append(f'<circle cx="{fmt(cx)}" cy="{fmt(cy + rw * 0.18)}" r="{fmt(pupil_r)}" fill="{P["ink"]}"/>')
    x1, y1 = pol(cx, cy, rw, 180 + lid_deg)
    x2, y2 = pol(cx, cy, rw, 360 - lid_deg)
    tf = f' transform="rotate({tilt} {fmt(cx)} {fmt(cy)})"' if tilt else ''
    e.append(f'<path d="M {fmt(x1)} {fmt(y1)} A {fmt(rw)} {fmt(rw)} 0 1 1 {fmt(x2)} {fmt(y2)} Z" '
             f'fill="{P["skin"]}" stroke="{P["ink"]}" stroke-width="{P["w3"]}"{tf}/>')
    return ''.join(e)

def shoes(y=289):
    return (E(133, y, 15, 6.5, P['ink'], w=P['w3'])
            + E(167, y, 15, 6.5, P['ink'], w=P['w3']))


# ------------------------------------------------------------------ einstein
def einstein_head(e, HY=104, HR=38):
    """Head with the cut-circle hair: one big circle, pieces bitten out."""
    HX = 150
    e.append(C(HX - HR - 1, HY + 8, 7.5, P['skin2'], w=P['w3']))
    e.append(C(HX + HR + 1, HY + 8, 7.5, P['skin2'], w=P['w3']))
    e.append(C(HX, HY, HR, P['skin'], w=P['w1']))
    # hair: one big circle riding high, the face bitten out low so real mass
    # stays on top and at the sides; rim bites spark the upper edge
    bites = [(HX, HY + 22, HR + 6)]           # the face scoop
    rnd = random.Random(4)
    for a in (206, 235, 262, 288, 315, 338):
        x, y = pol(HX, HY - 18, 56, a + rnd.uniform(-5, 5))
        bites.append((x, y, rnd.uniform(6, 9)))
    e.append(cut_circle(HX, HY - 18, 56, bites, P['hairgrey']))
    # brows, eyes, wrinkles
    e.append(arc(133, 82, 167, 82, 52, 1, w=2, op=0.5))
    e.append(arc(136, 89, 164, 89, 52, 1, w=2, op=0.5))
    e.append(Pth('M 126 95 A 22 22 0 0 1 143 91', 'none', w=4))
    e.append(Pth('M 157 91 A 22 22 0 0 1 174 95', 'none', w=4))
    e.append(eye(136, 102, 5.5, lid_deg=15, tilt=5))
    e.append(eye(164, 102, 5.5, lid_deg=15, tilt=-5))
    # nose on mustache
    e.append(E(139, 130, 13.5, 6, 20, P['hairgrey']) if False else '')
    e.append(f'<ellipse cx="139" cy="130" rx="13.5" ry="6" fill="{P["hairgrey"]}" '
             f'stroke="{P["ink"]}" stroke-width="{P["w2"]}" transform="rotate(20 139 130)"/>')
    e.append(f'<ellipse cx="161" cy="130" rx="13.5" ry="6" fill="{P["hairgrey"]}" '
             f'stroke="{P["ink"]}" stroke-width="{P["w2"]}" transform="rotate(-20 161 130)"/>')
    e.append(E(150, 119, 7, 6, P['skin2'], w=P['w3']))
    e.append(arc(146, 139, 154, 139, 12, 0, w=2, op=0.5))

def einstein(style):
    e = []
    if style == 'circle':
        # trousers: two round columns, then a round tweed belly
        e.append(shoes())
        e.append(R(124, 208, 22, 78, 11, P['trousers']))
        e.append(R(154, 208, 22, 78, 11, P['trousers']))
        e.append(C(150, 196, 44, P['tweed'], w=P['w1']))
        e.append(Pth('M 138 156 L 134 214 A 40 30 0 0 0 166 214 L 162 156 Z',
                     P['sweater'], w=P['w2']))  # sweater in the V
        # arms: drooping sausages
        e.append(E(114, 196, 11, 34, P['tweed'], rot=12))
        e.append(E(186, 196, 11, 34, P['tweed'], rot=-12))
        e.append(C(109, 228, 8, P['skin'], w=P['w3']))
        e.append(C(191, 228, 8, P['skin'], w=P['w3']))
    else:
        # loose: slouchy jacket trapezoid, soft shoulders, baggy trousers
        e.append(shoes())
        e.append(Pth('M 126 210 L 122 286 L 146 286 L 148 214 Z', P['trousers']))
        e.append(Pth('M 174 210 L 178 286 L 154 286 L 152 214 Z', P['trousers']))
        e.append(Pth('M 108 226 A 100 100 0 0 1 118 162 A 40 26 0 0 1 182 162 '
                     'A 100 100 0 0 1 192 226 L 150 234 Z', P['tweed'], w=P['w1']))
        e.append(Pth('M 138 160 L 134 226 L 150 232 L 166 226 L 162 160 Z',
                     P['sweater'], w=P['w2']))
        e.append(E(104, 194, 10, 32, P['tweed'], rot=14))
        e.append(E(196, 194, 10, 32, P['tweed'], rot=-14))
        e.append(C(99, 224, 8, P['skin'], w=P['w3']))
        e.append(C(201, 224, 8, P['skin'], w=P['w3']))
    e.append(R(140, 138, 20, 24, 8, P['skin'], sw=P['w3']))  # neck
    einstein_head(e)
    return ''.join(e)


# --------------------------------------------------------------------- curie
def curie_head(e, HY=100, HR=36):
    HX = 150
    e.append(C(HX, HY, HR, P['skin'], w=P['w1']))
    if True:
        # hair: swept-up dark mass with a loose bun — cut-circle top + bun
        bites = [(HX, HY + 26, HR + 12)]
        for a, br in ((205, 9), (335, 9)):
            x, y = pol(HX, HY - 8, 50, a)
            bites.append((x, y, br))
        e.append(cut_circle(HX, HY - 8, 46, bites, P['hairdark']))
        e.append(C(HX, HY - 48, 13, P['hairdark'], w=P['w2']))      # the bun
        # frizz high at the temples
        e.append(cluster([(HX - 36, HY - 26, 8), (HX + 36, HY - 26, 8)], P['hairdark'], w=P['w3']))
        e.append(arc(HX - 22, HY - 34, HX - 6, HY - 40, 24, 1, w=2, op=0.5))
        e.append(arc(HX + 6, HY - 40, HX + 22, HY - 34, 24, 1, w=2, op=0.5))
    # serious, direct
    e.append(Pth(f'M {HX - 24} {HY - 9} L {HX - 8} {HY - 11}', 'none', w=3.4))
    e.append(Pth(f'M {HX + 8} {HY - 11} L {HX + 24} {HY - 9}', 'none', w=3.4))
    e.append(eye(HX - 15, HY, 5.5, lid_deg=12, tilt=2))
    e.append(eye(HX + 15, HY, 5.5, lid_deg=12, tilt=-2))
    e.append(arc(HX - 20, HY + 9, HX - 11, HY + 9, 9, 0, w=2, op=0.4))
    e.append(arc(HX + 11, HY + 9, HX + 20, HY + 9, 9, 0, w=2, op=0.4))
    e.append(E(HX, HY + 13, 5.5, 6.5, P['skin2'], w=P['w3']))
    e.append(arc(HX - 7, HY + 25, HX + 7, HY + 25, 18, 0, w=2.6))

def flask(x, y, s=1.0):
    """A little erlenmeyer in the chemist's hand."""
    return (Pth(f'M {fmt(x - 5*s)} {fmt(y - 14*s)} L {fmt(x + 5*s)} {fmt(y - 14*s)} '
                f'L {fmt(x + 11*s)} {fmt(y + 6*s)} A {fmt(9*s)} {fmt(9*s)} 0 0 1 '
                f'{fmt(x - 11*s)} {fmt(y + 6*s)} Z', P['flask'], w=P['w3'])
            + C(x - 2*s, y - 20*s, 2.2*s, 'none', w=1.6)
            + C(x + 3*s, y - 26*s, 1.7*s, 'none', w=1.6))

def curie(style):
    e = []
    if style == 'circle':
        # bell skirt as a big circle sunk into the floor line
        e.append(f'<clipPath id="sk"><rect x="60" y="120" width="180" height="172"/></clipPath>')
        e.append(f'<g clip-path="url(#sk)">{C(150, 292, 74, P["dress"], w=P["w1"])}</g>')
        e.append(f'<line x1="{76.5}" y1="292" x2="{223.5}" y2="292" stroke="{P["ink"]}" stroke-width="{P["w2"]}"/>')
        e.append(E(150, 194, 27, 42, P['dress'], w=P['w1']))
    else:
        # loose: A-line dress with a soft flare
        e.append(Pth('M 128 168 L 106 288 A 160 40 0 0 0 194 288 L 172 168 Z',
                     P['dress'], w=P['w1']))
        e.append(Pth('M 130 226 A 60 20 0 0 0 170 226', 'none', w=2, extra=' opacity="0.4"'))
    # sleeves + hands; the chemist holds her flask
    e.append(E(122, 190, 10, 32, P['dress'], rot=16))
    e.append(E(178, 190, 10, 32, P['dress'], rot=-16))
    e.append(C(112, 219, 7.5, P['skin'], w=P['w3']))
    e.append(C(188, 219, 7.5, P['skin'], w=P['w3']))
    # high collar
    e.append(R(140, 134, 20, 22, 7, P['dress'], sw=P['w3']))
    # the chemist's flask, in front of the hand
    e.append(flask(104, 200, 1.0))
    curie_head(e)
    return ''.join(e)


# ---------------------------------------------------------------------- musk
def musk_head(e, style):
    """Young Musk, after the inbox references: face wide at the brow, slab
    cheeks, almost no chin; deep temple recession with a front tuft."""
    # face: wide at the brow, slab cheeks tapering hard inward, bottom nearly
    # flat and barely wider than the neck — the chin just never happens
    if style == 'rect':
        e.append(R(102, 92, 13, 24, 5, P['skin2'], sw=P['w3']))
        e.append(R(185, 92, 13, 24, 5, P['skin2'], sw=P['w3']))
        e.append(Pth('M 116 58 L 184 58 A 8 8 0 0 1 192 66 L 192 100 '
                     'L 168 148 A 20 8 0 0 1 132 148 L 108 100 L 108 66 '
                     'A 8 8 0 0 1 116 58 Z', P['skin'], w=P['w1']))
    else:
        e.append(E(107, 102, 7, 11, P['skin2'], w=P['w3']))
        e.append(E(193, 102, 7, 11, P['skin2'], w=P['w3']))
        e.append(Pth('M 110 72 A 42 34 0 0 1 190 72 L 191 98 '
                     'A 120 120 0 0 1 166 148 A 22 10 0 0 1 134 148 '
                     'A 120 120 0 0 1 109 98 Z', P['skin'], w=P['w1']))
    # receding hair: thin fuzz set back on the crown, deep temple notches,
    # one lonely front island
    e.append(Pth('M 124 64 A 34 22 0 0 1 176 64 L 179 72 A 40 30 0 0 0 121 72 Z',
                 P['hairdark'], w=P['w3']))
    e.append(E(150, 62, 7, 4, P['hairdark'], w=P['w3']))
    # thin raised brows; heavy lids drooping toward the outer corners
    e.append(arc(124, 90, 142, 88, 30, 1, w=2.4))
    e.append(arc(158, 88, 176, 90, 30, 1, w=2.4))
    e.append(eye(134, 100, 5.5, lid_deg=4, tilt=-10, iris_r=2.6, pupil_r=1.3))
    e.append(eye(166, 100, 5.5, lid_deg=4, tilt=10, iris_r=2.6, pupil_r=1.3))
    e.append(E(150, 116, 4.5, 6, P['skin2'], w=P['w3']))
    # the smirk: shallow, one corner up, a hint of lower lip
    e.append(Pth('M 137 132 A 26 26 0 0 0 162 129', 'none', w=2.6))
    e.append(arc(144, 139, 157, 138, 20, 0, w=2, op=0.45))

def musk(style):
    e = []
    if style == 'rect':
        e.append(shoes())
        e.append(R(127, 212, 20, 74, 6, P['jeans']))
        e.append(R(153, 212, 20, 74, 6, P['jeans']))
        # slim buttoned shirt, narrow shoulders — no bodybuilding
        e.append(R(118, 164, 64, 56, 10, P['shirt'], sw=P['w1']))
        e.append(Pth('M 140 164 L 150 174 L 160 164', 'none', w=P['w3']))
        for by in (184, 198, 212):
            e.append(f'<circle cx="150" cy="{by}" r="1.8" fill="{P["ink"]}"/>')
        e.append(R(104, 170, 12, 44, 6, P['shirt']))
        e.append(R(184, 170, 12, 44, 6, P['shirt']))
        e.append(C(110, 220, 7, P['skin'], w=P['w3']))
        e.append(C(190, 220, 7, P['skin'], w=P['w3']))
        e.append(R(141, 148, 18, 20, 6, P['skin'], sw=P['w3']))  # thin neck
    else:
        e.append(shoes())
        e.append(Pth('M 130 214 L 126 286 L 146 286 L 149 216 Z', P['jeans']))
        e.append(Pth('M 170 214 L 174 286 L 154 286 L 151 216 Z', P['jeans']))
        e.append(Pth('M 120 220 L 122 176 A 30 18 0 0 1 178 176 L 180 220 '
                     'A 90 40 0 0 1 120 220 Z', P['shirt'], w=P['w1']))
        e.append(Pth('M 142 166 L 150 176 L 158 166', 'none', w=P['w3']))
        e.append(E(112, 194, 8.5, 28, P['shirt'], rot=10))
        e.append(E(188, 194, 8.5, 28, P['shirt'], rot=-10))
        e.append(C(107, 220, 7, P['skin'], w=P['w3']))
        e.append(C(193, 220, 7, P['skin'], w=P['w3']))
        e.append(R(142, 148, 16, 20, 7, P['skin'], sw=P['w3']))
    musk_head(e, style)
    return ''.join(e)


# -------------------------------------------------------------------- farmer
def farmer(style='loose'):
    e = []
    e.append(shoes())
    # knee-length coat with buttons
    e.append(Pth('M 118 258 L 112 176 A 46 30 0 0 1 188 176 L 182 258 Z',
                 P['coat_f'], w=P['w1']))
    e.append(R(126, 254, 20, 34, 6, P['trousers']))
    e.append(R(154, 254, 20, 34, 6, P['trousers']))
    e.append(Pth('M 143 258 L 144 186 L 150 178 L 156 186 L 157 258 Z',
                 P['eyewhite'], w=P['w3']))
    for by in (196, 214, 232, 248):
        e.append(f'<circle cx="{140}" cy="{by}" r="2" fill="{P["ink"]}"/>')
    e.append(E(108, 200, 10, 30, P['coat_f'], rot=12))
    e.append(E(192, 200, 10, 30, P['coat_f'], rot=-12))
    e.append(C(103, 228, 7.5, P['skin'], w=P['w3']))
    e.append(C(197, 228, 7.5, P['skin'], w=P['w3']))
    e.append(R(140, 142, 20, 22, 7, P['skin'], sw=P['w3']))
    # jowly head + curls + the hat
    e.append(cluster([(150, 112, 36), (136, 136, 12), (164, 136, 12), (150, 141, 13)],
                     P['skin'], w=P['w1']))
    e.append(arc(140, 152, 160, 152, 20, 0, w=2, op=0.5))
    e.append(cluster([(112, 104, 11), (108, 120, 10), (112, 135, 9),
                      (188, 104, 11), (192, 120, 10), (188, 135, 9)], P['hairgrey2']))
    e.append(Pth('M 120 84 L 123 52 A 36 10 0 0 1 177 52 L 180 84 '
                 'A 74 22 0 0 0 120 84 Z', P['hat'], w=P['w2']))
    e.append(Pth('M 78 84 A 105 105 0 0 1 222 84 A 120 24 0 0 1 150 94 '
                 'A 120 24 0 0 1 78 84 Z', P['hat'], w=P['w2']))
    # steady face
    e.append(Pth('M 128 102 L 144 102', 'none', w=3.2))
    e.append(Pth('M 156 102 L 172 102', 'none', w=3.2))
    e.append(eye(137, 110, 5, lid_deg=13, tilt=2))
    e.append(eye(163, 110, 5, lid_deg=13, tilt=-2))
    e.append(E(150, 124, 6, 7, P['skin2'], w=P['w3']))
    e.append(arc(143, 138, 157, 138, 22, 0, w=2.4))
    return ''.join(e)


def svg(inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" '
            f'width="300mm" height="300mm">{inner}</svg>')


if __name__ == '__main__':
    out = {
        'fb-einstein-circle': einstein('circle'),
        'fb-einstein-loose': einstein('loose'),
        'fb-curie-circle': curie('circle'),
        'fb-curie-loose': curie('loose'),
        'fb-musk-rect': musk('rect'),
        'fb-musk-loose': musk('loose'),
        'fb-farmer': farmer(),
    }
    for name, inner in out.items():
        (OUT / f'{name}.svg').write_text(svg(inner))
    print('written', len(out))
