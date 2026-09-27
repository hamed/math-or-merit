/**
 * Math as the script writes it — `$…$` in a line, `\[ … \]` on its own —
 * typeset by KaTeX (ADR-019; the brief: "KaTeX on the web"). Imported only
 * when a card with math opens, so nobody else pays for it.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** One formula, as HTML (and MathML for screen readers). */
export function tex(source: string, display: boolean): string {
  return katex.renderToString(source, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' });
}

/** A line of words with `$…$` in it, as HTML: the words escaped, the math typeset. */
export function lineWithMath(line: string): string {
  return line
    .split(/(\$[^$]+\$)/)
    .map((part) => (part.length > 2 && part.startsWith('$') && part.endsWith('$') ? tex(part.slice(1, -1), false) : escape(part)))
    .join('');
}

/** Whether a line has math to typeset. */
export const hasMath = (line: string): boolean => /\$[^$]+\$/.test(line);
