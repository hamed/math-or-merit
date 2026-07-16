/**
 * Cow geometry for the morph scenes, in a shared 0 0 300 300 space.
 *
 * GENERATED from art/cow/gen_cow.py (mode ts) — extracted from the
 * author-drawn Inkscape sources (art/cow/*.source.svg). The spherical cow is
 * the original design; the standing cow is a hand-morph of it, so the head
 * is at IDENTICAL coordinates in both poses — only the body, horn, limbs,
 * udder and tail differ. Every shape is a circle or a circle arc.
 */

export const BODY_COW = { cx: 150, cy: 111.371, rx: 60, ry: 90 };
export const BODY_SPHERE = { cx: 150, cy: 150, r: 120 };

export const FACE = 'm 150.00015,30.000236 a 120,120 0 0 0 -43.72912,8.251176 450,450 0 0 0 18.20509,71.527418 65,65 0 0 0 25.52403,5.22139 65,65 0 0 0 25.52402,-5.22139 450,450 0 0 0 18.20457,-71.527418 120,120 0 0 0 -43.72859,-8.251176 z';
export const JAW = 'm 150.00015,90.000191 a 60,60 0 0 0 -37.61786,13.356289 40,40 0 0 0 37.61786,26.64334 40,40 0 0 0 37.61734,-26.64334 60,60 0 0 0 -37.61734,-13.356289 z';
export const EAR_L_OUT = 'M 107.75156,47.39659 A 60,60 0 0 0 90.000191,90.000191 25,25 0 0 0 115.00022,65.000167 25,25 0 0 0 107.75156,47.39659 Z';
export const EAR_L_IN = 'M 112.87631,54.917061 A 60,60 0 0 0 91.232674,89.969702 25,25 0 0 0 115.00022,65.000167 25,25 0 0 0 112.87631,54.917061 Z';
export const EAR_R_OUT = 'M 192.24873,47.39659 A 25,25 0 0 0 185.00008,65.000167 25,25 0 0 0 210.0001,90.000191 60,60 0 0 0 192.24873,47.39659 Z';
export const EAR_R_IN = 'M 187.12553,54.91241 A 25,25 0 0 0 185.00008,65.000167 25,25 0 0 0 208.77485,89.970219 60,60 0 0 0 187.12553,54.91241 Z';
export const HORN_COW = 'M 150.00015,63.397968 A 120,120 0 0 1 58.691508,20.889452 200,200 0 0 0 150.00015,43.398155 200,200 0 0 0 241.30878,20.889452 120,120 0 0 1 150.00015,63.397968 Z';
export const HORN_SPHERE = 'M 150.00015,30.000236 A 120,120 0 0 0 58.691508,72.508752 200,200 0 0 1 150.00015,50.000049 200,200 0 0 1 241.30878,72.508752 120,120 0 0 0 150.00015,30.000236 Z';
export const MARK = { cx: 165, cy: 65, rx: 20, ry: 25 };

/** Mouth states — sad is the resting face. */
export const MOUTH = {
  sad: 'M 130 115.359 A 40 40 0 0 1 170 115.359',
  smile: 'M 136 112 A 40 40 0 0 0 164 112',
  flat: 'M 138 113 L 162 113',
  gasp: 'M 150 109.5 A 3.6 4.2 0 1 1 149.98 109.5 Z',
  angry: 'M 134 117 A 24 24 0 0 1 166 117',
};

/** One eye, drawn as the LEFT eye; the right eye mirrors via MIRROR. */
export const EYE = {
  cx: 131.364, cy: 72.201, r: 10,
  irisSleepy: { x: 132.082, y: 77.172 },
  irisR: 5, pupilR: 2.5, pupilDilatedR: 4.6,
  lidSleepy: 'm 124.93621,79.861327 a 10,10 0 0 1 -2.8656,-11.352506 10,10 0 0 1 9.87493,-6.291021 10,10 0 0 1 9.07781,7.394891 z',
  lidAngry: 'M 121.705 69.613 A 10 10 0 1 1 140.427 76.427 Z',
};

export const NOSTRIL = { leftX: 134.125, rightX: 165.875, y: 100, r: 5, sealHalf: 4.5 };

export const LIMB_COW = 'm 53.974622,104.86675 a 120.27679,75.266068 0 0 0 -24.03887,43.89508 100.23066,62.721723 0 0 0 20.029371,1.26505 100.23066,62.721723 0 0 0 50.115377,-8.40452 100.23066,62.721723 0 0 1 -46.105878,-36.75561 z';
export const LIMB_SPHERE = 'M 54.000321,77.999373 A 120,120 0 0 0 30.016772,147.98322 100,100 0 0 0 50.000049,150.00015 100,100 0 0 0 100.0001,136.60045 100,100 0 0 1 54.000321,77.999373 Z';
export const HOOF = 'm 114.94302,137.90778 a 15,15 0 0 1 -15.597211,13.67839 15,15 0 0 1 -14.34571,-14.98572 15,15 0 0 1 14.345709,-14.98572 15,15 0 0 1 15.597212,13.67838 l -14.94292,1.30734 z';
/** Standing pose: the hand pair rotates straight down (pivot = shoulder). */
export const COW_HAND_TF = 'rotate(75 62.485 191.039)';
export const SPHERE_LEG_TF = 'rotate(-53.261 150 150)';
/** One mirror axis for every right-hand part. */
export const MIRROR = 'matrix(-1,0,0,1,300,0)';

export const TAIL_COW = {
  d: 'M 235.057 83.993 a 120,120 0 0 1 -49.53754,54.14864 120,120 0 0 0 10.51047,0.46147 120,120 0 0 0 7.33185,-0.22428 120,120 0 0 0 31.69522,-54.38583 z',
  tip: { x: 235.057, y: 83.993 }, tipR: 5,
  tuft: [{ x: 239.562, y: 87.148, r: 3.2 }, { x: 244.067, y: 90.303, r: 2.2 }],
};
export const TAIL_SPHERE = {
  d: 'M 189.02722 215.38995 A 120 120 0 0 1 139.48968 269.53859 A 120 120 0 0 0 150.00015 270.00006 A 120 120 0 0 0 157.332 269.77578 A 120 120 0 0 0 189.02722 215.38995 z',
  tip: { x: 189.027, y: 215.39 }, tipR: 5,
  tuft: [{ x: 194.012, y: 213.066, r: 3.2 }, { x: 198.997, y: 210.741, r: 2.2 }],
};

export const UDDER_COW = {
  sack: 'M 123.131 174.502 A 26.869 26.869 0 0 0 176.869 174.502 Z',
  teats: [{ x: 141.163, y: 192.906 }, { x: 141.163, y: 193.283 }, { x: 158.288, y: 194.103 }, { x: 160.162, y: 192.906 }],
  teatRx: 2.687, teatRy: 4.478, tipR: 0.896, tipDy: 2.911,
};
export const UDDER_SPHERE = {
  cx: 150, cy: 200, r: 30,
  teats: [{ x: 139.393, y: 189.393 }, { x: 139.393, y: 210.607 }, { x: 160.607, y: 210.607 }, { x: 160.607, y: 189.393 }], teatR: 5, tipR: 1,
};

/** Hide spots (ellipse + rotate), same count in both poses so they morph. */
export const SPOTS_COW = [
  { cx: 118, cy: 150, rx: 14, ry: 19, rot: -18 },
  { cx: 186, cy: 96, rx: 9, ry: 13, rot: 14 },
];
export const SPOTS_SPHERE = [
  { cx: 86, cy: 86, rx: 12, ry: 16, rot: -24 },
  { cx: 117, cy: 247, rx: 10, ry: 7, rot: 12 },
];

/** Half-ellipse teat, flat edge up, bulging down. */
export function teatPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} Z`;
}
