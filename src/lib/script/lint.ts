/**
 * The checks a whole script must pass before its PDF is built (GRAMMAR.md §8).
 * Parse errors come from `parseScript`; these are the rules that need the
 * whole script at once: labels, conditions, targets, lengths, manners.
 */
import { ACTIONS, AIM_WORDS, MANNERS, MAX_WORDS } from './grammar.ts';
import { commands, plain } from './inline.ts';
import { actionsOf, choiceText, walk, wordsOf, type Action, type Problem, type Script } from './parse.ts';

const CONDITION = /^([a-z][a-z0-9-]*)=([a-z0-9][a-z0-9-]*)$/;
const PAIRS = /^\s*[a-z][a-z0-9-]*\s*=\s*[^,=\s]+(\s*,\s*[a-z][a-z0-9-]*\s*=\s*[^,=\s]+)*\s*$/;

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function lint(script: Script): Problem[] {
  const problems: Problem[] = [...script.problems];
  const labels = new Map<string, string>();
  const facts = new Set(script.decl.facts);
  const events = new Set(script.decl.events);

  for (const { file, item } of walk(script)) {
    if (item.kind === 'structure' && item.level !== 'part' && !item.star && !item.label) {
      problems.push({ file, line: item.line, level: 'error', message: `\\${item.level}{${item.title}} needs a \\label` });
    }
    const label =
      item.kind === 'structure'
        ? item.label
        : item.kind === 'bubble'
          ? item.body.flatMap((l) => (l.k === 'attach' ? commands(l.nodes) : [])).find((c) => c.name === 'label')?.args[0]
          : undefined;
    const labelText = label === undefined ? undefined : typeof label === 'string' ? label : plain(label);
    if (labelText) {
      if (labels.has(labelText)) {
        problems.push({ file, line: item.line, level: 'error', message: `label "${labelText}" is used twice (first ${labels.get(labelText)})` });
      }
      labels.set(labelText, `${file}:${item.line}`);
    }
  }
  const structureLabels = new Set<string>();
  for (const { item } of walk(script)) if (item.kind === 'structure' && item.label) structureLabels.add(item.label);

  const at = (file: string, line: number, message: string, level: Problem['level'] = 'error') =>
    problems.push({ file, line, level, message });

  const checkAction = (file: string, a: Action) => {
    const arg = a.args[0] ?? '';
    switch (a.name) {
      case 'when': {
        const m = CONDITION.exec(arg.trim());
        if (!m) at(file, a.line, `\\when takes exactly one fact=value; "${arg}" goes to the owner (the tripwire)`);
        else if (!facts.has(m[1])) at(file, a.line, `"${m[1]}" is not a declared fact (decl.tex)`);
        break;
      }
      case 'on':
        if (!events.has(arg.trim())) at(file, a.line, `"${arg}" is not a declared event (decl.tex); \\on takes exactly one`);
        break;
      case 'expect':
      case 'params':
        if (!PAIRS.test(arg)) at(file, a.line, `\\${a.name} takes key=value pairs: "${arg}"`);
        break;
      case 'pick':
        if (![...structureLabels].some((l) => l.startsWith(`${arg}:`))) at(file, a.line, `\\pick{${arg}}: no section is labelled ${arg}:…`);
        break;
      case 'choice': {
        const target = (a.args[1] ?? '').trim();
        if (!plain(choiceText(a))) at(file, a.line, 'a choice with no words');
        if (!target) break;
        const cond = CONDITION.exec(target);
        if (cond) {
          if (!facts.has(cond[1])) at(file, a.line, `"${cond[1]}" is not a declared fact (decl.tex)`);
        } else if (target.startsWith('\\')) {
          const name = /^\\([A-Za-z]+)/.exec(target)?.[1];
          if (!name || !ACTIONS[name]) at(file, a.line, `a choice acts with an action from the grammar: "${target}"`);
        } else if (!structureLabels.has(target)) at(file, a.line, `a choice jumps to a section or scene label: "${target}" is none`);
        break;
      }
    }
  };

  for (const { file, item } of walk(script)) {
    for (const a of actionsOf(item)) checkAction(file, a);
    if (item.kind !== 'bubble') continue;
    for (const m of item.manner) if (!MANNERS.has(m)) at(file, item.line, `manner "${m}" is kept as a delivery hint`, 'warning');
    if (script.lang !== 'en') continue;
    const variants = item.body.find((l) => l.k === 'list');
    const texts = variants
      ? variants.list.items.map((lines) => lines.map((l) => plain(l)).join(' '))
      : [wordsOf(item).map((l) => plain(l)).join(' ')];
    for (const t of texts) {
      const n = wordCount(t);
      if (n > MAX_WORDS) at(file, item.line, `${n} words: a bubble holds at most ${MAX_WORDS}`);
      else if (n > AIM_WORDS) at(file, item.line, `${n} words: the aim is ${AIM_WORDS}`, 'warning');
    }
  }
  return problems;
}
