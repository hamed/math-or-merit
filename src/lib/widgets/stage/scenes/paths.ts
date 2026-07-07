/**
 * Hand-authored silhouette paths for the morph scenes (480 × 280 viewBox).
 * Single closed paths morph best (MorphSVG); faces/limbs are overlay groups
 * that fade or retract, never morph. All paths project-drawn — no external
 * assets, no license burden.
 */

/** Cow torso blob, centered near (240, 152). */
export const COW_BODY =
  'M 175 120 ' +
  'C 190 100 220 94 245 96 ' +
  'C 275 98 305 102 318 118 ' +
  'C 332 136 330 168 318 186 ' +
  'C 300 200 270 206 240 204 ' +
  'C 210 206 185 200 172 184 ' +
  'C 160 166 162 138 175 120 Z';

/** The spherical cow: a circle of radius 62 centered at (240, 150). */
export const SPHERE =
  'M 240 88 ' +
  'C 274.2 88 302 115.8 302 150 ' +
  'C 302 184.2 274.2 212 240 212 ' +
  'C 205.8 212 178 184.2 178 150 ' +
  'C 178 115.8 205.8 88 240 88 Z';
