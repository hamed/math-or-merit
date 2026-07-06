/**
 * The single GSAP entry point for the whole project (ADR-013).
 *
 * GUARD: this is the only file allowed to import from 'gsap'. GSAP is a
 * presentation-layer tool; `src/lib/sim/` and `src/lib/research/` must never
 * reach it — the boundary test greps for stray imports.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

export { gsap, ScrollTrigger, MorphSVGPlugin };
