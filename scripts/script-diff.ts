/**
 * How the script differs from the game that is running now.
 *
 *   npm run script:diff
 *
 * Until the build reads the script, this is the list of edits waiting to be
 * carried into the game: every step compared (who, manner, wait, actions,
 * words), every pool section, and every message the build still reads from
 * messages/en.json. Zero differences means the script IS the current game.
 * Exit code 1 when anything differs.
 */
import { parseInline, plain, type Inline } from '../src/lib/script/inline.ts';
import { choiceText, conditionOf, walk, type Action, type Script } from '../src/lib/script/parse.ts';
import { loadScript } from './script-load.ts';
import { gameView, MESSAGES, type Group, type StepView } from './script-game';

const SETTINGS = new Set(['expect', 'params', 'keep', 'when', 'on']);
const READER_ACTIONS = new Set(['meet', 'equalize']);

interface Step {
  readonly at: string;
  readonly act: boolean;
  readonly speaker: string | null;
  readonly manner: string[];
  readonly words: string[];
  readonly cues: string[];
  readonly wait: string;
  /** A conditioned run: its groups, each condition with the speakers and manners that play under it. */
  readonly groups?: { cond: string; bubbles: { speaker: string; manner: string[]; words: string }[] }[];
}

const cueOf = (a: Action) =>
  a.name === 'choice'
    ? `\\choice{${plain(choiceText(a))}}${a.args[1] !== undefined ? `{${a.args[1].trim()}}` : ''}`
    : `\\${a.name}${a.opt !== undefined ? `[${a.opt}]` : ''}${a.args.map((x) => `{${x.trim()}}`).join('')}`;

const lineText = (lines: readonly (readonly Inline[])[]) => lines.map((l) => plain(l)).join(' / ');

/** The script's steps: every bubble and every action paragraph that plays; a run of conditioned bubbles is one step. */
function scriptSteps(script: Script, file: string): Step[] {
  const out: Step[] = [];
  let act = true;
  let run: Step | null = null;
  for (const { file: f, item } of walk(script, 'timeline')) {
    if (f !== file) continue;
    if (item.kind === 'structure') {
      run = null;
      if (item.level === 'section') act = true;
    }
    if (item.kind !== 'bubble' && item.kind !== 'actions') continue;
    const actions = item.body.flatMap((l) => (l.k === 'cue' ? [l.action] : []));
    const at = `${file}:${item.line}`;
    const condition = conditionOf(item);
    if (condition && item.kind === 'bubble') {
      const kind = condition.name;
      const cond = cueOf(condition);
      if (!run || run.wait !== kind) {
        run = { at, act, speaker: null, manner: [], words: [], cues: [], wait: kind, groups: [] };
        out.push(run);
        act = false;
      }
      let g = run.groups!.find((x) => x.cond === cond);
      if (!g) run.groups!.push((g = { cond, bubbles: [] }));
      const words = lineText(item.body.flatMap((l) => (l.k === 'text' ? [l.nodes] : [])));
      g.bubbles.push({ speaker: item.speaker, manner: [...item.manner], words });
      run.words.push(words);
      run.cues.push(...actions.filter((a) => a !== condition).map(cueOf));
      continue;
    }
    run = null;
    const cues = actions.map(cueOf);
    if (item.kind === 'actions') {
      if (actions.every((a) => SETTINGS.has(a.name)) && out.length) {
        out[out.length - 1].cues.push(...cues);
        continue;
      }
      const wait = actions.some((a) => READER_ACTIONS.has(a.name)) ? 'action' : 'auto';
      out.push({ at, act, speaker: null, manner: [], words: [], cues, wait });
    } else {
      const list = item.body.find((l) => l.k === 'list');
      const words = list?.k === 'list' ? list.list.items.map(lineText) : [lineText(item.body.flatMap((l) => (l.k === 'text' ? [l.nodes] : [])))];
      const holds = actions.some((a) => READER_ACTIONS.has(a.name) || (a.name === 'choice' && /^[a-z-]+=/.test(a.args[1] ?? '')));
      const wait = holds ? 'action' : item.manner.includes('teletype') ? 'auto' : item.manner.includes('flow') ? 'chat' : 'reader';
      out.push({ at, act, speaker: item.speaker, manner: [...item.manner], words, cues, wait });
    }
    act = false;
  }
  return out;
}

/** The game's steps in the same shape, with message keys turned into words. */
function gameSteps(): (Step & { id: string })[] {
  return gameView().map((v: StepView) => ({
    id: v.id,
    at: v.id,
    act: v.act,
    speaker: v.speaker,
    manner: [...v.manner],
    words: v.keys.map((k) => MESSAGES[k]),
    cues: v.cues.map((c) => {
      const m = /^\\choice\{([a-z0-9_]+)\}(.*)$/.exec(c);
      return m ? `\\choice{${MESSAGES[m[1]]}}${m[2]}` : c;
    }),
    wait: v.wait,
    ...(v.groups
      ? {
          words: v.groups.flatMap((g: Group) => g.bubbles.map((b) => MESSAGES[b.key])),
          groups: v.groups.map((g: Group) => ({
            cond: g.cond,
            bubbles: g.bubbles.map((b) => ({ speaker: b.speaker, manner: [...b.manner], words: MESSAGES[b.key] })),
          })),
        }
      : {}),
  }));
}

const shape = (s: Step) =>
  [
    s.speaker,
    [...s.manner].sort().join(','),
    s.wait,
    [...s.cues].sort().join(' '),
    s.act,
    (s.groups ?? []).map((g) => `${g.cond}:${g.bubbles.map((b) => `${b.speaker}(${[...b.manner].sort().join(',')})`).join(',')}`).join(';'),
  ].join('|');

/** Longest common subsequence of two lists by key: the pairs that line up. */
function align<A, B>(a: A[], b: B[], ka: (x: A) => string, kb: (x: B) => string): [number, number][] {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = ka(a[i]) === kb(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ka(a[i]) === kb(b[j])) pairs.push([i++, j++]);
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

const show = (s: Step) =>
  s.groups
    ? s.groups.map((g) => `${g.cond} ${g.bubbles.map((b) => `${b.speaker}: ${b.words}`).join(' / ')}`).join(' | ')
    : `${s.speaker ?? '(actions)'}${s.manner.length ? ` (${s.manner.join(', ')})` : ''}: ${s.words.join(' | ') || s.cues.join(' ')}`;

const script = loadScript('en');
if (!script) throw new Error('script/decl.tex is missing');
const problems: string[] = [];

// ---- steps ----
const mine = scriptSteps(script, 'script.tex');
const theirs = gameSteps();
const pairs = align(mine, theirs, shape, shape);
const pairedMine = new Set(pairs.map(([i]) => i));
const pairedTheirs = new Set(pairs.map(([, j]) => j));
mine.forEach((s, i) => pairedMine.has(i) || problems.push(`${s.at}: only in the script: ${show(s)}`));
theirs.forEach((s, j) => pairedTheirs.has(j) || problems.push(`game step ${s.id}: only in the game: ${show(s)}`));
let sameWords = 0;
for (const [i, j] of pairs) {
  const a = mine[i].words.join(' | ');
  const b = theirs[j].words.join(' | ');
  if (a === b) sameWords++;
  else problems.push(`${mine[i].at} (${theirs[j].id}): words differ\n    script: ${a}\n    game:   ${b}`);
}

// ---- every message the build reads ----
const texts = new Set<string>();
const strings = new Map<string, string>();
for (const { file, item } of walk(script)) {
  if (item.kind === 'strings') for (const e of item.entries) strings.set(e.key.replace(/\./g, '_'), plain(e.nodes));
  // a card's title and lines are words the reader sees; a widget file's title is only a heading
  if (item.kind === 'structure' && /(^|\/)cards\//.test(file)) texts.add(plain(parseInline(item.title).nodes));
  if (item.kind === 'words') for (const l of item.body) if (l.k === 'text') texts.add(plain(l.nodes));
  if (item.kind === 'bubble' || item.kind === 'actions') {
    for (const l of item.body) {
      if (l.k === 'list') for (const lines of l.list.items) texts.add(lineText(lines));
      if (l.k === 'cue' && l.action.name === 'choice') texts.add(plain(choiceText(l.action)));
    }
    if (item.kind === 'bubble') texts.add(lineText(item.body.flatMap((l) => (l.k === 'text' ? [l.nodes] : []))));
  }
}
for (const [id, name] of script.decl.speakers) if (`name_${id}` in MESSAGES) strings.set(`name_${id}`, name);
let used = 0;
const keys = Object.keys(MESSAGES).filter((k) => k !== '$schema');
for (const key of keys) {
  const value = MESSAGES[key];
  if (strings.has(key)) {
    if (strings.get(key) === value) used++;
    else problems.push(`message ${key}: differs\n    script: ${strings.get(key)}\n    game:   ${value}`);
  } else if (texts.has(value)) used++;
  else problems.push(`message ${key}: not in the script: ${value}`);
}
const values = new Set(keys.map((k) => MESSAGES[k]));
for (const t of texts) if (t && !values.has(t)) problems.push(`new words, not in the game yet: ${t}`);
for (const k of strings.keys()) if (!(k in MESSAGES)) problems.push(`UI string ${k.replace(/_/g, '.')} is not in the game yet`);

for (const p of problems) console.log(p);
console.log(
  `script vs game: steps ${pairs.length}/${theirs.length} line up (${sameWords} with the same words), ` +
    `messages ${used}/${keys.length} — ${problems.length} difference(s)`,
);
process.exit(problems.length ? 1 : 0);

