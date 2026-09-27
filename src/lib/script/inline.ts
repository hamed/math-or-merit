/**
 * The words inside a line: text, emphasis, size, math, live values, notes.
 *
 * Text nodes keep their source exactly (`\%`, `--`, `~` included), so printing
 * a line back gives the same source; `plain()` is what a reader would see.
 * Anything the grammar doesn't list is an error, never a guess.
 */
import { ESCAPES, INLINE, SIZES } from './grammar.ts';

export type Inline =
  | { readonly t: 'text'; readonly v: string }
  | { readonly t: 'cmd'; readonly name: string; readonly args: readonly Inline[][] }
  | { readonly t: 'size'; readonly size: string; readonly body: readonly Inline[] }
  | { readonly t: 'math'; readonly v: string };

export interface InlineResult {
  readonly nodes: Inline[];
  readonly errors: string[];
}

/** The index just past the brace group that opens at `open`, or -1 if it never closes. */
export function closeBrace(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

export function parseInline(src: string): InlineResult {
  const errors: string[] = [];
  const nodes = parseRun(src, errors);
  return { nodes, errors };
}

function parseRun(src: string, errors: string[]): Inline[] {
  const out: Inline[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push({ t: 'text', v: text });
    text = '';
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '%') {
      errors.push('a bare % starts a comment in LaTeX; write \\% for a percent sign');
      text += c;
      i++;
    } else if (c === '$') {
      const end = src.indexOf('$', i + 1);
      if (/\d/.test(src[i + 1] ?? '')) errors.push('$ before a digit opens math; write \\$ for dollars');
      if (end === -1) {
        errors.push('math opened with $ never closes');
        text += src.slice(i);
        break;
      }
      flush();
      out.push({ t: 'math', v: src.slice(i + 1, end) });
      i = end + 1;
    } else if (c === '\\') {
      const next = src[i + 1] ?? '';
      if (ESCAPES.has(next)) {
        text += c + next;
        i += 2;
        continue;
      }
      const name = /^[A-Za-z]+/.exec(src.slice(i + 1))?.[0];
      if (!name) {
        errors.push(`unknown escape \\${next}`);
        text += c;
        i++;
        continue;
      }
      const spec = INLINE[name];
      if (!spec) {
        errors.push(`\\${name} is not part of the grammar`);
        // swallow its arguments too, so one mistake is one error
        let j = i + 1 + name.length;
        while (src[j] === '{' && closeBrace(src, j) !== -1) j = closeBrace(src, j);
        text += src.slice(i, j);
        i = j;
        continue;
      }
      flush();
      i += 1 + name.length;
      const args: Inline[][] = [];
      while (args.length < spec.max) {
        let j = i;
        while (src[j] === ' ' && args.length > 0) j++;
        if (src[j] !== '{') break;
        const end = closeBrace(src, j);
        if (end === -1) {
          errors.push(`\\${name}{ never closes`);
          i = src.length;
          break;
        }
        args.push(parseRun(src.slice(j + 1, end - 1), errors));
        i = end;
      }
      if (args.length < spec.min) errors.push(`\\${name} needs ${spec.min} argument(s)`);
      out.push({ t: 'cmd', name, args });
    } else if (c === '{') {
      const end = closeBrace(src, i);
      const size = /^\{\\([A-Za-z]+)\s/.exec(src.slice(i));
      if (end === -1) {
        errors.push('a { never closes');
        text += src.slice(i);
        break;
      }
      if (!size || !SIZES.has(size[1])) {
        errors.push('a {…} group must be {\\large …} or {\\Large …}');
        text += src.slice(i, end);
        i = end;
        continue;
      }
      flush();
      out.push({ t: 'size', size: size[1], body: parseRun(src.slice(i + size[0].length, end - 1), errors) });
      i = end;
    } else if (c === '}') {
      errors.push('a } closes nothing');
      text += c;
      i++;
    } else {
      text += c;
      i++;
    }
  }
  flush();
  return out;
}

/** Source text for a run of inline nodes. */
export function printInline(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => {
      if (n.t === 'text') return n.v;
      if (n.t === 'math') return `$${n.v}$`;
      if (n.t === 'size') return `{\\${n.size} ${printInline(n.body)}}`;
      return `\\${n.name}${n.args.map((a) => `{${printInline(a)}}`).join('')}`;
    })
    .join('');
}

/** Decode the typographic source of a text node into what the reader sees. */
export function decodeText(v: string): string {
  return v
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/``/g, '“')
    .replace(/''/g, '”')
    .replace(/~/g, ' ')
    .replace(/\\([%$&#_{}])/g, '$1');
}

/**
 * What the reader sees, with live values as `{name}`, emphasis dropped and
 * size as `**…**` — the message format the build reads today (messages/*.json).
 * Notes (`\todo`, `\marginpar`, `\adapt`, `\label`, `\footnote`) are not words.
 */
export function plain(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => {
      if (n.t === 'text') return decodeText(n.v);
      if (n.t === 'math') return n.v;
      if (n.t === 'size') return `**${plain(n.body)}**`;
      switch (n.name) {
        case 'emph':
        case 'textbf':
        case 'gls':
          return plain(n.args[0] ?? []);
        case 'val':
          return `{${plain(n.args[0] ?? [])}}`;
        case 'plural':
          return plain(n.args[1] ?? []);
        default:
          return '';
      }
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The commands of a run, including nested ones. */
export function commands(nodes: readonly Inline[]): Extract<Inline, { t: 'cmd' }>[] {
  const out: Extract<Inline, { t: 'cmd' }>[] = [];
  for (const n of nodes) {
    if (n.t === 'cmd') {
      out.push(n);
      for (const a of n.args) out.push(...commands(a));
    } else if (n.t === 'size') out.push(...commands(n.body));
  }
  return out;
}
