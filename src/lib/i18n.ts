/**
 * The locale seam, in one place (ADR-017 A2, ADR-006).
 *
 * Words come from Paraglide's compiled messages (`m`), generated from
 * `messages/{locale}.json`, which is itself generated from `notes/prose.md`.
 * Numbers never go through string concatenation: they are formatted here for
 * the active locale, so Farsi gets Persian digits, and handed to a message as a
 * named value.
 */
import { getLocale, getTextDirection } from '../paraglide/runtime.js';

export { m } from '../paraglide/messages.js';
export { getLocale, getTextDirection };

/** A whole number or a plain decimal, in the active locale's digits. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(), options).format(value);
}

/**
 * The one `dir` attribute the whole layout follows (ADR-006). Everything is
 * logical CSS except the title words and the two protagonists, which keep
 * their PHYSICAL sides in every locale — the political association is spatial
 * (D19, A2).
 */
export function applyLocaleToDocument(root: HTMLElement = document.documentElement): void {
  root.lang = getLocale();
  root.dir = getTextDirection();
}
