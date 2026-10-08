/**
 * The script's `.tex` source → a tree the build can read (script/GRAMMAR.md).
 *
 * A paragraph is the text between blank lines, and how it starts says what it
 * is: a bubble (`Name (manner): …`), actions (`\flip{blue}`), structure
 * (`\section{…}\label{…}`), UI strings (`description`), a figure, a formula
 * (`\[ … \]`), or — in the timeline — a stage direction.
 *
 * Two kinds of file. The **timeline** (script.tex, branches/) is the story in
 * order. A **unit** (cards/, widgets/) is content that doesn't know what it is:
 * a `\section{Title}`, then words, figures, formulas, strings. Whoever includes
 * it decides what it is — `\card{gini}` includes cards/gini.tex as a card. In a
 * unit, a plain paragraph is its words, not a direction, and nobody speaks.
 *
 * The parser never needs LaTeX installed and never guesses: a command outside
 * the grammar is an error with its file and line. Headless and pure: sources
 * in, tree and problems out. No fs here.
 */
import { ACTIONS, ATTACHMENTS, OPTIONAL_LAST_ARG } from './grammar.ts';
import { closeBrace, commands, parseInline, type Inline } from './inline.ts';

export interface Source {
  readonly file: string;
  readonly text: string;
}

export interface Problem {
  readonly file: string;
  readonly line: number;
  readonly level: 'error' | 'warning';
  readonly message: string;
}

export interface Action {
  readonly name: string;
  readonly opt?: string;
  /** Raw source of each braced argument. `\choice`'s first is words: see `choiceText`. */
  readonly args: readonly string[];
  readonly line: number;
}

export interface ListBody {
  /** `enumerate`: in order. `itemize`: any order. */
  readonly ordered: boolean;
  /** Each item's lines. */
  readonly items: readonly (readonly Inline[])[][];
  /** Each item's option, `\item[hold 3]`: how many beats it holds (0 when none). */
  readonly holds: readonly number[];
  readonly line: number;
}

/** One line of a bubble, an action paragraph or a unit's words, in source order. */
export type Line =
  | { readonly k: 'text'; readonly nodes: readonly Inline[]; readonly line: number }
  | { readonly k: 'cue'; readonly action: Action }
  | { readonly k: 'attach'; readonly nodes: readonly Inline[]; readonly line: number }
  | { readonly k: 'list'; readonly list: ListBody };

export interface Figure {
  readonly kind: 'figure';
  /** Source, for printing back. */
  readonly raw: string;
  /** What the stage draws there (`\plot{lorenz}`); code owns the picture. */
  readonly plot?: string;
  readonly thumb?: string;
  readonly axes?: readonly (readonly Inline[])[];
  readonly caption?: readonly Inline[];
  readonly label?: string;
  readonly line: number;
}

export type Item =
  | {
      readonly kind: 'structure';
      readonly level: 'part' | 'section' | 'subsection';
      readonly star: boolean;
      readonly short?: string;
      readonly title: string;
      readonly label?: string;
      readonly line: number;
    }
  | {
      readonly kind: 'bubble';
      /** `<scene label>.<n>`, n counting bubbles only. Set by `parseScript`. */
      id: string;
      readonly speaker: string;
      /** The name as written, in this language. */
      readonly name: string;
      readonly manner: readonly string[];
      readonly body: readonly Line[];
      readonly line: number;
    }
  | { readonly kind: 'actions'; readonly body: readonly Line[]; readonly line: number }
  | { readonly kind: 'direction'; readonly text: string; readonly nodes: readonly Inline[]; readonly line: number }
  /** A unit's words: each line a line on screen. */
  | { readonly kind: 'words'; readonly body: readonly Line[]; readonly line: number }
  | { readonly kind: 'formula'; readonly tex: string; readonly line: number }
  | {
      readonly kind: 'strings';
      readonly entries: readonly { readonly key: string; readonly nodes: readonly Inline[]; readonly line: number }[];
      readonly line: number;
    }
  | Figure
  | { readonly kind: 'comment'; readonly text: string; readonly line: number };

export interface Decl {
  /** id → name */
  readonly speakers: ReadonlyMap<string, string>;
  /** name → id */
  readonly names: ReadonlyMap<string, string>;
  readonly facts: readonly string[];
  readonly events: readonly string[];
  readonly timing: Readonly<Record<string, string>>;
}

export type Mode = 'timeline' | 'unit';

export interface ScriptFile {
  readonly file: string;
  readonly mode: Mode;
  readonly items: readonly Item[];
}

export interface Script {
  readonly lang: string;
  readonly decl: Decl;
  readonly files: readonly ScriptFile[];
  readonly problems: readonly Problem[];
}

// ---- small readers ----------------------------------------------------------

/** `\name[opt]{a}{b}` at the start of `src`: the action and what is left over. */
function readCommand(src: string): { name: string; opt?: string; args: string[]; rest: string } | null {
  const m = /^\\([A-Za-z]+)/.exec(src);
  if (!m) return null;
  let i = m[0].length;
  let opt: string | undefined;
  if (src[i] === '[') {
    const end = src.indexOf(']', i);
    if (end === -1) return null;
    opt = src.slice(i + 1, end);
    i = end + 1;
  }
  const args: string[] = [];
  while (src[i] === '{') {
    const end = closeBrace(src, i);
    if (end === -1) return null;
    args.push(src.slice(i + 1, end - 1));
    i = end;
  }
  return { name: m[1], ...(opt !== undefined ? { opt } : {}), args, rest: src.slice(i) };
}

const COMMENT = /^\s*%/;

/** Open braces minus closed ones, escapes aside. */
function braceDepth(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === '{') depth++;
    else if (s[i] === '}') depth--;
  }
  return depth;
}
const HEAD = /^([^\s:()\\{}$%]+)\s*(?:\(([^)]*)\))?\s*:(?:\s+(.*))?$/;

/** A line that holds only attachment commands (`\label`, `\marginpar`, `\todo`, `\adapt`). */
function isAttachmentLine(line: string): boolean {
  const { nodes, errors } = parseInline(line.trim());
  if (errors.length) return false;
  return nodes.every((n) => (n.t === 'cmd' && ATTACHMENTS.has(n.name)) || (n.t === 'text' && !n.v.trim()));
}

// ---- declarations -------------------------------------------------------------

export function parseDecl(src: Source): { decl: Decl; problems: Problem[] } {
  const problems: Problem[] = [];
  const speakers = new Map<string, string>();
  const names = new Map<string, string>();
  let facts: string[] = [];
  let events: string[] = [];
  const timing: Record<string, string> = {};
  const list = (s: string) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  src.text.split('\n').forEach((raw, k) => {
    const line = raw.trim();
    if (!line || COMMENT.test(line)) return;
    for (const piece of line.split(/(?=\\)/).map((p) => p.trim()).filter(Boolean)) {
      const cmd = readCommand(piece);
      const bad = (message: string) => problems.push({ file: src.file, line: k + 1, level: 'error', message });
      if (!cmd || cmd.rest.trim()) {
        bad(`not a declaration: ${piece}`);
        continue;
      }
      if (cmd.name === 'speaker' && cmd.args.length === 2) {
        speakers.set(cmd.args[0], cmd.args[1]);
        names.set(cmd.args[1], cmd.args[0]);
      } else if (cmd.name === 'facts') facts = list(cmd.args[0] ?? '');
      else if (cmd.name === 'events') events = list(cmd.args[0] ?? '');
      else if (['beat', 'perword', 'minread', 'nudge'].includes(cmd.name)) timing[cmd.name] = cmd.args[0] ?? '';
      else bad(`\\${cmd.name} is not a declaration`);
    }
  });
  return { decl: { speakers, names, facts, events, timing }, problems };
}

// ---- one file -------------------------------------------------------------------

export function parseFile(src: Source, decl: Decl, mode: Mode = 'timeline'): { items: Item[]; problems: Problem[] } {
  const items: Item[] = [];
  const problems: Problem[] = [];
  const lines = src.text.split('\n');
  const err = (line: number, message: string, level: Problem['level'] = 'error') =>
    problems.push({ file: src.file, line, level, message });

  // paragraphs, with their line numbers (1-based)
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }
    const start = i;
    while (i < lines.length && lines[i].trim()) i++;
    const para = lines.slice(start, i).map((text, k) => ({ text, line: start + k + 1 }));

    // comments before and after the paragraph are their own items
    const lead: typeof para = [];
    while (para.length && COMMENT.test(para[0].text)) lead.push(para.shift()!);
    const trail: typeof para = [];
    while (para.length && COMMENT.test(para[para.length - 1].text)) trail.unshift(para.pop()!);
    for (const c of lead) items.push({ kind: 'comment', text: c.text.trim(), line: c.line });
    const middle = para.filter((p) => COMMENT.test(p.text));
    for (const c of middle) err(c.line, 'a comment inside a paragraph: put it on its own line before the paragraph');
    const body = para.filter((p) => !COMMENT.test(p.text));
    if (body.length) items.push(...paragraph(body, decl, err, mode));
    for (const c of [...middle, ...trail]) items.push({ kind: 'comment', text: c.text.trim(), line: c.line });
  }
  return { items, problems };
}

type Err = (line: number, message: string, level?: Problem['level']) => void;
type Raw = { text: string; line: number };

function paragraph(para: Raw[], decl: Decl, err: Err, mode: Mode): Item[] {
  const first = para[0].text.trim();
  const line = para[0].line;

  if (/^\\(part|section|subsection)\b/.test(first)) return structure(para, err, mode);
  if (/^\\begin\{description\}/.test(first)) return [strings(para, err)];
  if (/^\\begin\{figure\}/.test(first)) return [figure(para, err)];
  if (first.startsWith('\\[')) return [formula(para, err)];
  if (/^\\begin\{(itemize|enumerate)\}/.test(first)) {
    err(line, 'a list must follow a bubble head (Name:) or an action');
    return [direction(para, err)];
  }
  const cmd = /^\\([A-Za-z]+)/.exec(first)?.[1];
  if (cmd && ACTIONS[cmd]) return [{ kind: 'actions', body: lines(para, err, false), line }];
  if (mode === 'unit') return [{ kind: 'words', body: lines(para, err, true), line }];

  const head = HEAD.exec(first);
  if (head && !/^\d/.test(head[1])) {
    const speaker = decl.names.get(head[1]);
    if (!speaker) {
      err(line, `"${head[1]}" is not a declared speaker (decl.tex)`);
      return [direction(para, err)];
    }
    const manner = (head[2] ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const rest = head[3]?.trim() ?? '';
    const tail = rest ? [{ text: rest, line }, ...para.slice(1)] : para.slice(1);
    const body = lines(tail, err, true);
    if (!body.some((l) => l.k === 'text' || l.k === 'list')) err(line, 'a bubble with no words');
    if (body.some((l) => l.k === 'text') && body.some((l) => l.k === 'list')) {
      err(line, 'a bubble has lines or a list of variants, not both');
    }
    return [{ kind: 'bubble', id: '', speaker, name: head[1], manner, body, line }];
  }
  // any other command is an inline error, reported once by the direction
  return [direction(para, err)];
}

function direction(para: Raw[], err: Err): Item {
  const text = para.map((p) => p.text.trim()).join('\n');
  const { nodes, errors } = parseInline(text.replace(/\n/g, ' '));
  for (const e of errors) err(para[0].line, e);
  return { kind: 'direction', text, nodes, line: para[0].line };
}

function formula(para: Raw[], err: Err): Item {
  const tex = para.map((p) => p.text.trim()).join('\n');
  if (!tex.endsWith('\\]')) err(para[0].line, 'a formula opened with \\[ must close with \\] in the same paragraph');
  return { kind: 'formula', tex, line: para[0].line };
}

function figure(para: Raw[], err: Err): Figure {
  const raw = para.map((p) => p.text).join('\n');
  let plot: string | undefined;
  let thumb: string | undefined;
  let axes: Inline[][] | undefined;
  let caption: Inline[] | undefined;
  let label: string | undefined;
  const words = (s: string, at: number) => {
    const { nodes, errors } = parseInline(s);
    for (const e of errors) err(at, e);
    return nodes;
  };
  for (const p of para.slice(1)) {
    const t = p.text.trim();
    if (t === '\\end{figure}') break;
    for (let rest = t; rest.trim(); ) {
      const cmd = readCommand(rest.trim());
      if (!cmd) {
        err(p.line, `inside a figure, only \\plot, \\thumb, \\axes, \\caption and \\label: "${rest.trim()}"`);
        break;
      }
      if (cmd.name === 'plot' && cmd.args.length === 1) plot = cmd.args[0].trim();
      else if (cmd.name === 'thumb' && cmd.args.length === 1) thumb = cmd.args[0].trim();
      else if (cmd.name === 'axes' && cmd.args.length === 2) axes = cmd.args.map((a) => words(a, p.line));
      else if (cmd.name === 'caption' && cmd.args.length === 1) caption = words(cmd.args[0], p.line);
      else if (cmd.name === 'label' && cmd.args.length === 1) label = cmd.args[0].trim();
      else err(p.line, `inside a figure, only \\plot{id}, \\thumb{id}, \\axes{x}{y}, \\caption{…} and \\label{…}: \\${cmd.name}`);
      rest = cmd.rest;
    }
  }
  if (para[para.length - 1].text.trim() !== '\\end{figure}') err(para[0].line, 'figure never ends');
  if (!plot && !thumb) err(para[0].line, 'a figure needs \\plot{id} or \\thumb{id}: what is drawn there');
  return {
    kind: 'figure',
    raw,
    ...(plot !== undefined ? { plot } : {}),
    ...(thumb !== undefined ? { thumb } : {}),
    ...(axes ? { axes } : {}),
    ...(caption ? { caption } : {}),
    ...(label !== undefined ? { label } : {}),
    line: para[0].line,
  };
}

function structure(para: Raw[], err: Err, mode: Mode): Item[] {
  const first = para[0];
  const src = first.text.trim();
  const m = /^\\(part|section|subsection)(\*?)/.exec(src)!;
  let i = m[0].length;
  let short: string | undefined;
  if (src[i] === '[') {
    const end = src.indexOf(']', i);
    short = src.slice(i + 1, end);
    i = end + 1;
  }
  let title = '';
  let label: string | undefined;
  if (src[i] !== '{') err(first.line, `\\${m[1]} needs a title`);
  else {
    const end = closeBrace(src, i);
    title = src.slice(i + 1, end - 1);
    const rest = src.slice(end).trim();
    const lab = /^\\label\{([^}]*)\}$/.exec(rest);
    if (lab) label = lab[1];
    else if (rest) err(first.line, `after the title, only \\label{…}: "${rest}"`);
  }
  const out: Item[] = [
    {
      kind: 'structure',
      level: m[1] as 'part' | 'section' | 'subsection',
      star: m[2] === '*',
      ...(short !== undefined ? { short } : {}),
      title,
      ...(label !== undefined ? { label } : {}),
      line: first.line,
    },
  ];
  if (para.length > 1) {
    const rest = para.slice(1);
    // a unit's title may be followed straight away by its words
    out.push(
      mode === 'unit' && !/^\\[A-Za-z]+/.test(rest[0].text.trim())
        ? { kind: 'words', body: lines(rest, err, true), line: rest[0].line }
        : { kind: 'actions', body: lines(rest, err, false), line: rest[0].line },
    );
  }
  return out;
}

function strings(para: Raw[], err: Err): Item {
  const entries: { key: string; nodes: Inline[]; line: number }[] = [];
  for (const p of para.slice(1)) {
    const t = p.text.trim();
    if (t === '\\end{description}') break;
    const m = /^\\item\[([A-Za-z0-9._:-]+)\]\s*(.*)$/.exec(t);
    if (!m) {
      if (entries.length && !t.startsWith('\\item')) {
        // a continuation of the entry above
        const { nodes, errors } = parseInline(t);
        for (const e of errors) err(p.line, e);
        const last = entries[entries.length - 1];
        last.nodes = [...last.nodes, { t: 'text', v: ' ' }, ...nodes];
        continue;
      }
      err(p.line, 'a UI string is \\item[key] words');
      continue;
    }
    const { nodes, errors } = parseInline(m[2]);
    for (const e of errors) err(p.line, e);
    entries.push({ key: m[1], nodes, line: p.line });
  }
  if (para[para.length - 1].text.trim() !== '\\end{description}') err(para[0].line, 'description never ends');
  return { kind: 'strings', entries, line: para[0].line };
}

/** The lines of a bubble or a unit's words (words allowed), or of an action paragraph (no words). */
function lines(para: Raw[], err: Err, words: boolean): Line[] {
  const out: Line[] = [];
  for (let k = 0; k < para.length; k++) {
    const { line } = para[k];
    let text = para[k].text;
    // an attachment or an action may run over several lines: read on to its closing brace
    const lead = /^\s*\\([A-Za-z]+)/.exec(text)?.[1];
    if (lead && (ATTACHMENTS.has(lead) || ACTIONS[lead])) {
      while (braceDepth(text) > 0 && k + 1 < para.length) text += ' ' + para[++k].text.trim();
    }
    const t = text.trim();
    const env = /^\\begin\{(itemize|enumerate)\}$/.exec(t);
    if (env) {
      const items: Inline[][][] = [];
      const holds: number[] = [];
      let closed = false;
      for (k++; k < para.length; k++) {
        const u = para[k].text.trim();
        if (u === `\\end{${env[1]}}`) {
          closed = true;
          break;
        }
        const it = /^\\item(?:\[([^\]]*)\])?\s+(.*)$/.exec(u);
        const src = it ? it[2] : u;
        const { nodes, errors } = parseInline(src);
        for (const e of errors) err(para[k].line, e);
        if (it) {
          const opt = it[1]?.trim();
          const hold = opt === undefined ? 0 : Number(/^hold (\d+(?:\.\d+)?)$/.exec(opt)?.[1] ?? NaN);
          if (Number.isNaN(hold)) err(para[k].line, `an item's option is [hold n], n beats: "${opt}"`);
          holds.push(hold || 0);
          items.push([nodes]);
        }
        else if (items.length) items[items.length - 1].push(nodes);
        else err(para[k].line, 'a list line before its first \\item');
      }
      if (!closed) err(line, `\\begin{${env[1]}} never ends`);
      if (!words && !out.some((l) => l.k === 'cue')) err(line, 'a list must follow a bubble head (Name:) or an action');
      out.push({ k: 'list', list: { ordered: env[1] === 'enumerate', items, holds, line } });
      continue;
    }
    const cmd = /^\\([A-Za-z]+)/.exec(t)?.[1];
    if (cmd && ACTIONS[cmd]) {
      const action = actionLine(t, line, err);
      if (action) out.push({ k: 'cue', action });
      continue;
    }
    if (isAttachmentLine(t)) {
      out.push({ k: 'attach', nodes: parseInline(t).nodes, line });
      continue;
    }
    const { nodes, errors } = parseInline(t);
    for (const e of errors) err(line, e);
    if (!words) err(line, 'words in an action paragraph: a bubble needs a speaker, a direction a paragraph of its own');
    out.push({ k: 'text', nodes, line });
  }
  return out;
}

function actionLine(t: string, line: number, err: Err): Action | null {
  const cmd = readCommand(t);
  if (!cmd) {
    err(line, `can't read the action: ${t}`);
    return null;
  }
  const spec = ACTIONS[cmd.name];
  if (cmd.rest.trim()) err(line, `one action per line: "${cmd.rest.trim()}" follows \\${cmd.name}`);
  const min = OPTIONAL_LAST_ARG.has(cmd.name) ? spec.args - 1 : spec.args;
  if (cmd.args.length < min || cmd.args.length > spec.args) {
    err(line, `\\${cmd.name} takes ${min === spec.args ? spec.args : `${min} or ${spec.args}`} argument(s)`);
  }
  if (cmd.opt !== undefined && !spec.optional) err(line, `\\${cmd.name} takes no [option]`);
  // a choice's words are the reader's to read: the same rules as a bubble's
  if (cmd.name === 'choice') for (const e of parseInline(cmd.args[0] ?? '').errors) err(line, e);
  return { name: cmd.name, ...(cmd.opt !== undefined ? { opt: cmd.opt } : {}), args: cmd.args, line };
}

/** The words of a `\choice`. */
export function choiceText(action: Action): Inline[] {
  return parseInline(action.args[0] ?? '').nodes;
}

// ---- the whole script -------------------------------------------------------------

export interface ScriptSources {
  readonly lang: string;
  readonly decl: Source;
  /** The timeline, in reading order: script, branches. */
  readonly files: readonly Source[];
  /** Units: cards/*.tex, widgets/*.tex. */
  readonly units?: readonly Source[];
}

export function parseScript(sources: ScriptSources): Script {
  const { decl, problems: declProblems } = parseDecl(sources.decl);
  const problems: Problem[] = [...declProblems];
  const files: ScriptFile[] = [];
  const read = (src: Source, mode: Mode) => {
    const { items, problems: p } = parseFile(src, decl, mode);
    files.push({ file: src.file, mode, items });
    problems.push(...p);
  };
  for (const src of sources.files) read(src, 'timeline');
  for (const src of sources.units ?? []) read(src, 'unit');
  // bubble ids: <scene label>.<n>, n counting bubbles only
  let panel = '';
  let n = 0;
  for (const f of files) {
    for (const item of f.items) {
      if (item.kind === 'structure' && item.label && item.level !== 'part') {
        panel = item.label;
        n = 0;
      } else if (item.kind === 'bubble') item.id = `${panel}.${++n}`;
    }
  }
  return { lang: sources.lang, decl, files, problems };
}

/** Every item of the script, in reading order, with its file. */
export function* walk(script: Script, mode?: Mode): Generator<{ file: string; mode: Mode; item: Item }> {
  for (const f of script.files) {
    if (mode && f.mode !== mode) continue;
    for (const item of f.items) yield { file: f.file, mode: f.mode, item };
  }
}

/** Every action, whether a paragraph of its own or a cue inside a bubble. */
export function actionsOf(item: Item): Action[] {
  if (item.kind !== 'bubble' && item.kind !== 'actions') return [];
  return item.body.flatMap((l) => (l.k === 'cue' ? [l.action] : []));
}

/** The condition a bubble plays under, if any: its `\when` or `\on` cue. */
export function conditionOf(item: Item): Action | undefined {
  return item.kind === 'bubble' ? actionsOf(item).find((a) => a.name === 'when' || a.name === 'on') : undefined;
}

/** The inline runs of a bubble's words: its lines, or every line of every variant. */
export function wordsOf(item: Extract<Item, { kind: 'bubble' }>): Inline[][] {
  return item.body.flatMap((l) => (l.k === 'text' ? [[...l.nodes]] : l.k === 'list' ? l.list.items.flat().map((x) => [...x]) : []));
}

/** A unit's id: its file name without folder or extension (`cards/gini.tex` → `gini`). */
export function unitId(file: string): string {
  return file.replace(/^.*\//, '').replace(/\.tex$/, '');
}

export { commands };
