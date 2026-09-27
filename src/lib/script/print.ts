/**
 * The tree → canonical `.tex`. Printing what was parsed gives back the source
 * (whitespace aside): the round-trip test that proves the grammar covers the
 * whole file.
 */
import { printInline } from './inline.ts';
import type { Action, Item, Line, ScriptFile } from './parse.ts';

function printAction(a: Action): string {
  return `\\${a.name}${a.opt !== undefined ? `[${a.opt}]` : ''}${a.args.map((x) => `{${x}}`).join('')}`;
}

function printLines(body: readonly Line[]): string[] {
  return body.flatMap((l) => {
    if (l.k === 'text' || l.k === 'attach') return [printInline(l.nodes)];
    if (l.k === 'cue') return [printAction(l.action)];
    const env = l.list.ordered ? 'enumerate' : 'itemize';
    return [`\\begin{${env}}`, ...l.list.items.flatMap((lines) => lines.map((x, k) => `${k ? '' : '\\item '}${printInline(x)}`)), `\\end{${env}}`];
  });
}

export function printItem(item: Item): string {
  switch (item.kind) {
    case 'comment':
      return item.text;
    case 'structure':
      return `\\${item.level}${item.star ? '*' : ''}${item.short !== undefined ? `[${item.short}]` : ''}{${item.title}}${item.label !== undefined ? `\\label{${item.label}}` : ''}`;
    case 'direction':
      return item.text;
    case 'figure':
      return item.raw;
    case 'strings':
      return ['\\begin{description}', ...item.entries.map((e) => `\\item[${e.key}] ${printInline(e.nodes)}`), '\\end{description}'].join('\n');
    case 'actions':
    case 'words':
      return printLines(item.body).join('\n');
    case 'formula':
      return item.tex;
    case 'bubble': {
      const head = `${item.name}${item.manner.length ? ` (${item.manner.join(', ')})` : ''}:`;
      const [first, ...rest] = item.body;
      if (first?.k === 'text') return [`${head} ${printInline(first.nodes)}`, ...printLines(rest)].join('\n');
      return [head, ...printLines(item.body)].join('\n');
    }
  }
}

export function printFile(file: ScriptFile): string {
  return file.items.map(printItem).join('\n\n') + '\n';
}
