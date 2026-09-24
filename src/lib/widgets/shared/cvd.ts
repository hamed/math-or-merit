/**
 * Colour-vision checks for the palette, headless (A5, brief 4.2).
 *
 * The protagonists must stay findable in a costumed crowd for readers with
 * colour-vision deficiency, and against the neutral wash before they are
 * introduced. This is the measurement: colours are composited over the paper
 * the way the canvas draws them, simulated for the three dichromacies with the
 * Machado, Oliveira & Fernandes (2009) matrices at full severity, and compared
 * with CIEDE2000.
 */

export type Vision = 'normal' | 'protan' | 'deutan' | 'tritan';
export const VISIONS: readonly Vision[] = ['normal', 'protan', 'deutan', 'tritan'];

type Rgb = readonly [number, number, number];
export interface Lab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}

/** The essay's paper, `--paper`. */
export const PAPER = '#f4efe4';

// Machado et al. 2009, severity 1.0; applied to LINEAR sRGB.
const MACHADO: Record<Exclude<Vision, 'normal'>, readonly number[]> = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};

/** `#rrggbb` or `rgb(r g b / a%)` → 0..1 channels and alpha. */
export function parseColor(css: string): { rgb: Rgb; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255], alpha: 1 };
  }
  const rgb = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i.exec(css.trim());
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] === '%' ? 100 : 1);
    return { rgb: [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255], alpha };
  }
  throw new RangeError(`unparsed colour: ${css}`);
}

/** Source-over onto an opaque backdrop, in sRGB — what a canvas does. */
export function over(css: string, backdrop: string = PAPER, extraAlpha = 1): Rgb {
  const top = parseColor(css);
  const bottom = parseColor(backdrop).rgb;
  const a = top.alpha * extraAlpha;
  return [0, 1, 2].map((i) => top.rgb[i] * a + bottom[i] * (1 - a)) as unknown as Rgb;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (c: number) => Math.min(1, Math.max(0, c));

export function simulate(rgb: Rgb, vision: Vision): Rgb {
  if (vision === 'normal') return rgb;
  const m = MACHADO[vision];
  const [r, g, b] = rgb.map(toLinear);
  return [
    toGamma(clamp01(m[0] * r + m[1] * g + m[2] * b)),
    toGamma(clamp01(m[3] * r + m[4] * g + m[5] * b)),
    toGamma(clamp01(m[6] * r + m[7] * g + m[8] * b)),
  ];
}

export function toLab(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map(toLinear);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIEDE2000 (Sharma, Wu & Dalal 2005). */
export function deltaE2000(p: Lab, q: Lab): number {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(p.a, p.b);
  const C2 = Math.hypot(q.a, q.b);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const a1 = (1 + G) * p.a;
  const a2 = (1 + G) * q.a;
  const C1p = Math.hypot(a1, p.b);
  const C2p = Math.hypot(a2, q.b);
  const hue = (b: number, a: number) => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h < 0 ? h + 360 : h;
  };
  const h1 = hue(p.b, a1);
  const h2 = hue(q.b, a2);
  const dL = q.L - p.L;
  const dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p !== 0) {
    dh = h2 - h1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh * rad) / 2);
  const Lbar = (p.L + q.L) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbar = h1 + h2;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1 - h2) > 180) hbar += h1 + h2 < 360 ? 360 : -360;
    hbar /= 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hbar - 30) * rad) +
    0.24 * Math.cos(2 * hbar * rad) +
    0.32 * Math.cos((3 * hbar + 6) * rad) -
    0.2 * Math.cos((4 * hbar - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt(
    (dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh),
  );
}

/** ΔE between two colours as a reader with `vision` sees them on the paper. */
export function seenDelta(a: Rgb, b: Rgb, vision: Vision): number {
  return deltaE2000(toLab(simulate(a, vision)), toLab(simulate(b, vision)));
}
