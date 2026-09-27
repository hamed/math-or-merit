/**
 * The script → what the app reads: a story (the steps, in order, with their
 * actions, choices and conditions) and the messages (every word, by key).
 *
 * Generic: this knows the grammar, not the stage. It never says what a step
 * means for a particular scene; the stage reads the steps and decides. Keys
 * come from the script's own ids (`round2.3` → `round2_3`), UI strings keep
 * their `\item[key]`, cards number their lines (`card_gini_1`).
 *
 * Headless and pure: a parsed script in, plain data out. No fs here.
 */
import { plain, type Inline } from './inline.ts';
import { ACTIONS } from './grammar.ts';
import { choiceText, commands, conditionOf, unitId, type Action, type Item, type Line, type Script } from './parse.ts';

export interface StoryAction {
  readonly name: string;
  readonly opt?: string;
  readonly args: readonly string[];
}

/** What a choice does: nothing (go on), jump to a label, answer a fact, or do an action (its source). */
export interface StoryChoice {
  readonly key: string;
  readonly target: string;
}

export interface StoryCondition {
  readonly kind: 'when' | 'on';
  /** The fact (`bet`) or the event (`first-move`). */
  readonly name: string;
  /** For `when`: the value (`coffee`). */
  readonly value?: string;
}

export interface StoryBubble {
  readonly who: string;
  readonly manner: readonly string[];
  readonly key: string;
}

export interface StoryGroup {
  readonly cond: StoryCondition;
  readonly bubbles: readonly StoryBubble[];
}

export type StoryWait = 'reader' | 'chat' | 'action' | 'auto' | 'when';

export interface StoryStep {
  /** `round2.3` for a bubble, `round1.a2` for the second action paragraph of a scene, `guess.w1` for a run of `\when` bubbles. */
  readonly id: string;
  /** Where it is written, for errors and for jumping to it. */
  readonly at: string;
  readonly scene: string;
  /** The talk clears here: the first step of an act. */
  readonly act: boolean;
  readonly who: string | null;
  readonly manner: readonly string[];
  /** The bubble's words. */
  readonly key?: string;
  /** Or its variants, one shown at a time. */
  readonly variants?: { readonly ordered: boolean; readonly keys: readonly string[] };
  readonly cues: readonly StoryAction[];
  readonly choices: readonly StoryChoice[];
  /** An action's list body: the title's reel words. */
  readonly body?: readonly string[];
  /** How many beats each body item holds (`\item[hold 3]`), and the item in bold, where a reel lands. */
  readonly bodyHolds?: readonly number[];
  readonly bodyAnswer?: number;
  /** A run of `\when` bubbles: what plays, by condition. */
  readonly groups?: readonly StoryGroup[];
  /** `\on` bubbles written after this step: reactions during it. */
  readonly reactions?: readonly StoryGroup[];
  /** A bubble that `interrupts`: shown beside this one. */
  readonly beside?: StoryBubble;
  /** The live values its words need (`\\val{count}` → `count`). */
  readonly vals?: readonly string[];
  readonly wait: StoryWait;
}

export type CardBlock =
  | { readonly kind: 'line'; readonly key: string }
  | { readonly kind: 'formula'; readonly tex: string }
  | { readonly kind: 'plot'; readonly id: string };

export interface StoryCard {
  readonly title: string;
  readonly blocks: readonly CardBlock[];
  readonly toy?: string;
}

export interface Story {
  /** decl.tex's timing: beat, perword, minread, nudge, in seconds. */
  readonly timing: Readonly<Record<string, number>>;
  /** The stage's timeline: script.tex, in order. */
  readonly steps: readonly StoryStep[];
  /** Side trips (branches/), by their scene label. */
  readonly branches: Readonly<Record<string, readonly StoryStep[]>>;
  /** Every act and scene label → the id of its first step. */
  readonly labels: Readonly<Record<string, string>>;
  readonly cards: Readonly<Record<string, StoryCard>>;
}

export interface Compiled {
  readonly story: Story;
  /** key → words, in the message format the build reads (`{value}`, ` / ` between lines, `**louder**`). */
  readonly messages: Readonly<Record<string, string>>;
  /** Anything that could not become data. Empty for a script that passes lint. */
  readonly problems: readonly string[];
}

const READER = new Set(Object.entries(ACTIONS).flatMap(([name, spec]) => (spec.kind === 'reader' && name !== 'choice' ? [name] : [])));
const ANSWER = /^[a-z][a-z0-9-]*=[a-z0-9][a-z0-9-]*$/;

/** Words as the build shows them: like `plain`, but math keeps its `$…$` for the page to typeset. */
export function messageOf(nodes: readonly Inline[]): string {
  const piece = (n: Inline): string => {
    if (n.t === 'math') return `$${n.v}$`;
    if (n.t === 'size') return `**${n.body.map(piece).join('')}**`;
    if (n.t === 'cmd' && (n.name === 'emph' || n.name === 'textbf')) return (n.args[0] ?? []).map(piece).join('');
    if (n.t === 'cmd' && n.name === 'gls') return (n.args[1] ?? n.args[0] ?? []).map(piece).join('');
    // text, live values, notes: as the reader sees them (spaces kept, notes dropped)
    return n.t === 'text' ? plainText(n) : plain([n]);
  };
  return nodes.map(piece).join('').replace(/\s+/g, ' ').trim();
}

/** A text node's words with their spaces: `plain` trims, which would glue words to a value beside them. */
function plainText(n: Extract<Inline, { t: 'text' }>): string {
  return plain([{ t: 'text', v: `x${n.v}x` }]).slice(1, -1);
}

const keyOf = (id: string) => id.replace(/[.:-]/g, '_');
const texts = (body: readonly Line[]) => body.flatMap((l) => (l.k === 'text' ? [l.nodes] : []));
const toAction = (a: Action): StoryAction => ({ name: a.name, ...(a.opt !== undefined ? { opt: a.opt } : {}), args: a.args.map((x) => x.trim()) });

export function compile(script: Script): Compiled {
  const messages: Record<string, string> = {};
  const problems: string[] = [];
  const labels: Record<string, string> = {};
  const branches: Record<string, StoryStep[]> = {};
  let main: StoryStep[] = [];

  const say = (key: string, text: string) => {
    if (key in messages && messages[key] !== text) problems.push(`two different texts for the key ${key}`);
    messages[key] = text;
  };
  for (const [id, name] of script.decl.speakers) say(`name_${id}`, name);

  // ---- the timeline: script.tex and the side trips
  for (const file of script.files.filter((f) => f.mode === 'timeline')) {
    const steps: StoryStep[] = [];
    let scene = '';
    let act = false;
    let pendingLabels: string[] = [];
    let actions = 0;
    let runs = 0;
    let run: (StoryStep & { groups: StoryGroup[] }) | null = null;
    const push = (step: StoryStep) => {
      steps.push(step);
      for (const l of pendingLabels) labels[l] = step.id;
      pendingLabels = [];
      act = false;
      run = null;
    };
    const last = () => steps[steps.length - 1] as (StoryStep & Record<string, unknown>) | undefined;
    const choicesOf = (id: string, list: readonly Action[]) =>
      list.map((a, k) => {
        const key = `${keyOf(id)}_choice_${k + 1}`;
        say(key, messageOf(choiceText(a)));
        return { key, target: (a.args[1] ?? '').trim() };
      });

    for (const item of file.items) {
      const at = `${file.file}:${item.line}`;
      if (item.kind === 'structure') {
        if (item.level === 'section') act = true;
        if (item.level === 'subsection' && item.label) scene = item.label;
        if (item.label) pendingLabels.push(item.label);
        if (item.level === 'subsection') [actions, runs] = [0, 0];
        run = null;
        continue;
      }
      if (item.kind === 'strings') {
        for (const e of item.entries) say(keyOf(e.key), messageOf(e.nodes));
        continue;
      }
      if (item.kind !== 'bubble' && item.kind !== 'actions') continue;
      const cues = item.body.flatMap((l) => (l.k === 'cue' ? [l.action] : []));

      if (item.kind === 'bubble') {
        const key = keyOf(item.id);
        const lines = texts(item.body);
        const list = item.body.find((l) => l.k === 'list');
        const condition = conditionOf(item);
        const bubble = (): StoryBubble => {
          say(key, lines.map(messageOf).join(' / '));
          return { who: item.speaker, manner: [...item.manner], key };
        };
        if (condition) {
          const cond: StoryCondition =
            condition.name === 'on'
              ? { kind: 'on', name: condition.args[0].trim() }
              : { kind: 'when', name: condition.args[0].split('=')[0].trim(), value: condition.args[0].split('=')[1]?.trim() };
          const same = (g: StoryGroup) => g.cond.kind === cond.kind && g.cond.name === cond.name && g.cond.value === cond.value;
          if (cond.kind === 'on') {
            const before = last();
            if (!before) {
              problems.push(`${at}: a reaction (\\on) needs a step before it`);
              continue;
            }
            const reactions = (before.reactions ?? []) as StoryGroup[];
            const g = reactions.find(same);
            if (g) (g.bubbles as StoryBubble[]).push(bubble());
            else reactions.push({ cond, bubbles: [bubble()] });
            (before as { reactions?: StoryGroup[] }).reactions = reactions;
            continue;
          }
          if (!run) {
            const id = `${scene}.w${++runs}`;
            const step = { id, at, scene, act, who: null, manner: [], cues: [], choices: [], wait: 'when' as const, groups: [] as StoryGroup[] };
            push(step);
            run = step;
          }
          const current = run as StoryStep & { groups: StoryGroup[] };
          const g = current.groups.find(same);
          if (g) (g.bubbles as StoryBubble[]).push(bubble());
          else current.groups.push({ cond, bubbles: [bubble()] });
          continue;
        }
        if (item.manner.includes('interrupts')) {
          const before = last();
          if (before) {
            (before as { beside?: StoryBubble }).beside = bubble();
            continue;
          }
        }
        let variants: StoryStep['variants'];
        if (list?.k === 'list') {
          const keys = list.list.items.map((lns, k) => {
            const vk = `${key}_${k + 1}`;
            say(vk, lns.map(messageOf).join(' / '));
            return vk;
          });
          variants = { ordered: list.list.ordered, keys };
        } else say(key, lines.map(messageOf).join(' / '));
        const choices = cues.filter((a) => a.name === 'choice');
        const vals = [...new Set(lines.flatMap((l) => commands(l)).filter((c) => c.name === 'val').map((c) => plain(c.args[0] ?? [])))];
        const holds = cues.some((a) => READER.has(a.name)) || choices.some((a) => ANSWER.test((a.args[1] ?? '').trim()));
        const wait: StoryWait = holds ? 'action' : item.manner.includes('teletype') ? 'auto' : item.manner.includes('flow') ? 'chat' : 'reader';
        push({
          id: item.id,
          at,
          scene,
          act,
          who: item.speaker,
          manner: [...item.manner],
          ...(variants ? { variants } : { key }),
          cues: cues.filter((a) => a.name !== 'choice').map(toAction),
          choices: choicesOf(item.id, choices),
          ...(vals.length ? { vals } : {}),
          wait,
        });
        continue;
      }

      // an action paragraph: settings belong to the step before; anything else is a step
      if (cues.every((a) => ['expect', 'params', 'keep'].includes(a.name)) && last()) {
        (last()!.cues as StoryAction[]).push(...cues.map(toAction));
        continue;
      }
      const id = `${scene}.a${++actions}`;
      const list = item.body.find((l) => l.k === 'list');
      const body =
        list?.k === 'list'
          ? list.list.items.map((lns, k) => {
              const bk = `${keyOf(id)}_${k + 1}`;
              say(bk, lns.map(messageOf).join(' / '));
              return bk;
            })
          : undefined;
      const choices = cues.filter((a) => a.name === 'choice');
      const answer = list?.k === 'list' ? list.list.items.findIndex((lns) => lns[0]?.some((n) => n.t === 'cmd' && n.name === 'textbf')) : -1;
      push({
        id,
        at,
        scene,
        act,
        who: null,
        manner: [],
        cues: cues.filter((a) => a.name !== 'choice').map(toAction),
        choices: choicesOf(id, choices),
        ...(body ? { body } : {}),
        ...(list?.k === 'list' && list.list.holds.some(Boolean) ? { bodyHolds: list.list.holds } : {}),
        ...(answer >= 0 ? { bodyAnswer: answer } : {}),
        wait: cues.some((a) => READER.has(a.name)) || choices.length ? 'action' : 'auto',
      });
    }
    if (/(^|\/)branches\//.test(file.file)) branches[steps[0]?.scene ?? unitId(file.file)] = steps;
    else main = [...main, ...steps];
  }

  // ---- units: cards (title, lines, formulas, pictures, a toy) and widgets (strings)
  const cards: Record<string, StoryCard> = {};
  for (const file of script.files.filter((f) => f.mode === 'unit')) {
    const id = unitId(file.file);
    const isCard = /(^|\/)cards\//.test(file.file);
    const blocks: CardBlock[] = [];
    let title = '';
    let toy: string | undefined;
    let n = 0;
    for (const item of file.items as readonly Item[]) {
      if (item.kind === 'strings') for (const e of item.entries) say(keyOf(e.key), messageOf(e.nodes));
      if (!isCard) continue;
      if (item.kind === 'structure') {
        title = `card_${keyOf(id)}_title`;
        say(title, messageOf(parseTitle(item.title)));
      } else if (item.kind === 'words') {
        for (const nodes of texts(item.body)) {
          const key = `card_${keyOf(id)}_${++n}`;
          say(key, messageOf(nodes));
          blocks.push({ kind: 'line', key });
        }
      } else if (item.kind === 'formula') {
        blocks.push({ kind: 'formula', tex: item.tex.replace(/^\\\[/, '').replace(/\\\]$/, '').trim() });
      } else if (item.kind === 'figure' && (item.plot ?? item.thumb)) {
        blocks.push({ kind: 'plot', id: (item.plot ?? item.thumb)! });
      } else if (item.kind === 'actions') {
        for (const l of item.body) if (l.k === 'cue' && l.action.name === 'toy') toy = l.action.args[0].trim();
      }
    }
    if (isCard) cards[id] = { title, blocks, ...(toy ? { toy } : {}) };
  }

  const timing = Object.fromEntries(Object.entries(script.decl.timing).map(([k, v]) => [k, parseFloat(v)]));
  return { story: { timing, steps: main, branches, labels, cards }, messages, problems };
}

function parseTitle(title: string): Inline[] {
  // a title is plain words; anything richer is kept as text
  return [{ t: 'text', v: title }];
}
