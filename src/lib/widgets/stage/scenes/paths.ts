/**
 * Hand-authored silhouette paths for the morph scenes (480 × 280 viewBox).
 * Single closed paths morph best (MorphSVG). All paths project-drawn — no
 * external assets, no license burden.
 *
 * The cow itself now lives in cow-geometry.ts (its own 300×300 space);
 * SPHERE stays here as the stage-space circle the cow becomes, which
 * PersonScene morphs the person into ("the same circle the cow became").
 */

/** The spherical cow: a circle of radius 62 centered at (240, 150). */
export const SPHERE =
  'M 240 88 ' +
  'C 274.2 88 302 115.8 302 150 ' +
  'C 302 184.2 274.2 212 240 212 ' +
  'C 205.8 212 178 184.2 178 150 ' +
  'C 178 115.8 205.8 88 240 88 Z';
