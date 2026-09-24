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
import { m } from '../paraglide/messages.js';

export { m };
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

type Message = (inputs?: Record<string, string>) => string;

/**
 * A line by its message key, with live values formatted for the locale. The
 * stage addresses lines by key (data), so it looks them up here rather than
 * importing each function; an unknown key comes back as itself, visibly, rather
 * than as a blank bubble.
 */
export function say(key: string, values: Record<string, number | string> = {}): string {
  const message = (m as unknown as Record<string, Message | undefined>)[key];
  if (!message) return key;
  const inputs: Record<string, string> = {};
  for (const [name, value] of Object.entries(values)) {
    inputs[name] = typeof value === 'number' ? formatNumber(value) : value;
  }
  return message(inputs);
}
