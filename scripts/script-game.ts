/**
 * The running game, described in the script's terms — the bridge between the
 * pair stage's step list (src/lib/widgets/stage/scenes/pair/script.ts) and
 * script/*.tex while the build still reads the former.
 *
 * `gameView()` says, for every step the stage plays, what the script must say
 * there: who speaks, in what manner, which words, which actions, how it waits.
 * `npm run script:diff` compares it with the parsed script, so "the script is
 * the current game" is checked, not hoped. When the build reads the script
 * instead (the switch), this file goes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BETS, PREDICTIONS } from '../src/lib/widgets/shared/runLog.svelte';
import { CALLS, PAIR_STEPS, REACTIONS, type PairStep, type Pose } from '../src/lib/widgets/stage/scenes/pair/script';

export const MESSAGES: Record<string, string> = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'messages', 'en.json'), 'utf8'));

export type Wait = 'reader' | 'chat' | 'action' | 'auto' | 'pick';

export interface StepView {
  /** The stage's step id (`r2.wait`), or `<id>:<part>` for a second bubble in one step. */
  readonly id: string;
  /** The talk clears here: a new act. */
  readonly act: boolean;
  readonly speaker: string | null;
  readonly manner: readonly string[];
  /** Message keys: the line, or the variants of a call. */
  readonly keys: readonly string[];
  /** The variants are the words (a call), rather than one line. */
  readonly variants: boolean;
  /** Actions, in canonical source form; choices as `\choice{key}{target}` with a message KEY. */
  readonly cues: readonly string[];
  readonly wait: Wait;
}

/** Lines the scene speaks in place of a step's own (Scenes 15–23): the words carry what the room shows. */
const SPOKEN: Record<string, { who: string; message: string }> = {
  'sort.there': REACTIONS.sortThere,
  'gini.value': REACTIONS.giniValue,
  'eff.end': REACTIONS.effEnd,
  'turn.busy': REACTIONS.turnBusy,
  'turn.start': REACTIONS.turnStart,
  'turn.now': REACTIONS.turnNow,
  'match.result': REACTIONS.matchResult,
  ...REACTIONS.effCases, // eff.room is among them
};

/** Steps whose line is picked from the pool by what happened. */
const PICKS: Record<string, string> = {
  'guess.react': 'bet',
  'run.banter': 'run',
  'why.after': 'why',
  'dial.said': 'dial',
};

/** The reader's choices at each step: message key and what the choice does (nothing = go on). */
function choicesOf(step: PairStep): [string, string?][] {
  const id = step.id;
  if (step.pose.choice) return [['more_choice_1', 'cow'], ['more_choice_2']];
  const link = (REACTIONS.links as Record<string, string>)[id];
  if (link) return [[link]];
  if (id === 'gini.toy') return [[REACTIONS.giniToy[0], '\\reveal{toy:gini}'], [REACTIONS.giniToy[1]]];
  if (id === 'end.longer') return [[REACTIONS.endChoice[0], '\\run[longer]'], [REACTIONS.endChoice[1]]];
  if (id === 'stop.how') return [[REACTIONS.stopStart, '\\run[game]']];
  if (id === 'sandbox.2') return [[REACTIONS.workshop, 'workshop']];
  if (id === 'run.again') return [[REACTIONS.runChoices[0], '\\run'], [REACTIONS.runChoices[1]]];
  if (id === 'guess.what') return PREDICTIONS.map((p, k) => [REACTIONS.guesses[k], `prediction=${p.id}`]);
  if (id === 'guess.stake') return BETS.map((b, k) => [REACTIONS.bets[k], `bet=${b}`]);
  return [];
}

export const choiceCue = (key: string, target?: string) => `\\choice{${key}}${target ? `{${target}}` : ''}`;

const added = (a: readonly string[], b: readonly string[]) => b.filter((x) => !a.includes(x));

/** What changed on the stage at this step, as script actions. */
function cuesOf(step: PairStep, prev: Pose): string[] {
  const p = step.pose;
  const c: string[] = [];
  const crowd = { idle: 'idle', paid: 'payout', two: 'two' } as Record<string, string>;
  if (p.crowd !== prev.crowd && crowd[p.crowd]) c.push(`\\crowd{${crowd[p.crowd]}}`);
  for (const w of ['merit', 'or', 'math', 'mark', 'coins'] as const) if (p[w] && !prev[w]) c.push(`\\reveal{${w}}`);
  if (p.compact && !prev.compact) c.push('\\hide{headline}');
  if (p.cleared && !prev.cleared) c.push('\\hide{words}');
  for (const who of ['red', 'blue'] as const) if (p.named[who] && !prev.named[who]) c.push(`\\meet{${who}}`);
  if (step.id === 'equal') c.push('\\equalize', `\\expect{blue=${p.holdings.blue}, red=${p.holdings.red}}`);
  if (step.action === 'ante') c.push(`\\stake{${p.table.blue}}`);
  if (step.action === 'toss') c.push(`\\flip{${p.flip}}`, `\\expect{blue=${p.holdings.blue}, red=${p.holdings.red}}`);
  else if (step.action !== 'empty' && p.flip !== prev.flip) c.push(p.flip === 'shown' ? '\\reveal{coin}' : '\\hide{coin}');
  if (step.action === 'room') c.push('\\crowd{room}');
  if (step.action === 'empty') c.push('\\crowd{empty}', `\\expect{blue=${p.holdings.blue}, red=${p.holdings.red}}`);
  if (step.action === 'run') c.push('\\run');
  if (step.action === 'arrange' && p.roomMode !== prev.roomMode) c.push(`\\arrange{${p.roomMode}}`);
  if (step.action === 'match') c.push('\\match');
  const lorenz = ['\\hide{lorenz}', '\\reveal{curve}', '\\reveal{diagonal}', '\\reveal{gap}'];
  if (p.lorenz !== prev.lorenz) c.push(lorenz[p.lorenz]);
  if (p.map !== prev.map && p.map > 0) c.push(p.map === 1 ? '\\reveal{map}' : '\\reveal{fit}');
  if (p.levy !== prev.levy && p.levy > 0) c.push(p.levy === 1 ? '\\levy{collect}' : '\\levy{return}');
  if (p.control !== prev.control) c.push(`\\control{${p.control ?? 'none'}}`);
  if (p.cardOpen !== prev.cardOpen) c.push(p.cardOpen ? `\\reveal{card:${p.cardOpen}}` : `\\hide{card:${prev.cardOpen}}`);
  for (const id of added(prev.cards, p.cards)) c.push(`\\card{${id}}`);
  for (const id of added(prev.thumbs, p.thumbs)) c.push(`\\pin{${id}}`);
  if (PICKS[step.id]) c.push(`\\pick{${PICKS[step.id]}}`);
  for (const [key, target] of choicesOf(step)) c.push(choiceCue(key, target));
  if (step.id === 'stop.how') c.push('\\pick{game}');
  return c;
}

const WAITS: Record<PairStep['wait']['kind'], Wait> = { reader: 'reader', chat: 'chat', action: 'action', auto: 'auto' };

export function gameView(): StepView[] {
  const out: StepView[] = [];
  const first = PAIR_STEPS[0].pose;
  let prev: Pose = { ...first, teletype: false, crowd: 'away' };
  PAIR_STEPS.forEach((step, i) => {
    const cues = cuesOf(step, prev);
    prev = step.pose;
    const act = i === 0 || !!step.panel;
    const manner = [...(step.aside ? ['aside'] : []), ...(step.brief ? ['brief'] : [])];
    const line = step.lines?.[0];
    const spoken = SPOKEN[step.id];
    const caller = step.id === CALLS.red ? 'red' : step.id === CALLS.blue ? 'blue' : null;
    const base = { id: step.id, act, cues, variants: false };

    if (step.id === 'title.type') {
      out.push({ ...base, speaker: 'ledger', manner: ['teletype'], keys: ['open_headline'], wait: 'auto' });
    } else if (caller) {
      const keys = caller === 'red' ? REACTIONS.callRed : REACTIONS.callBlue;
      out.push({ ...base, speaker: caller, manner, keys: [...keys], variants: true, wait: 'action' });
    } else if (line?.who || spoken) {
      const who = line?.who ?? spoken.who;
      const wait = WAITS[step.wait.kind];
      out.push({ ...base, speaker: who, manner: wait === 'chat' ? [...manner, 'flow'] : manner, keys: [line?.message ?? spoken.message], wait });
    } else {
      out.push({ ...base, speaker: null, manner: [], keys: [], wait: PICKS[step.id] ? 'pick' : step.wait.kind === 'action' ? 'action' : 'auto' });
    }
    if (step.id === 'eff.try') {
      // the four-person toy's live readout, beside the offer
      out.push({ id: 'eff.try:readout', act: false, speaker: 'red', manner: ['aside', 'interrupts'], keys: [REACTIONS.effReadout.message], variants: false, cues: [], wait: 'reader' });
    }
  });
  return out;
}

/** Pool material: what each pool section must say, by label, in the order the lines play. */
export function poolView(): { label: string; condition: string; lines: { who: string; key: string; manner: string[] }[] }[] {
  const line = (l: { who: string; message: string }, manner: string[] = []) => ({ who: l.who, key: l.message, manner });
  return [
    { label: 'react:first-move', condition: '\\on{first-move}', lines: [line({ who: 'blue', message: REACTIONS.equalFirst }, ['flow'])] },
    { label: 'react:blue-reaches-eleven', condition: '\\on{blue-reaches-eleven}', lines: [line({ who: 'blue', message: REACTIONS.equalEleven }, ['flow'])] },
    {
      label: 'react:red-above-eight',
      condition: '\\on{red-above-eight}',
      lines: [line({ who: 'blue', message: REACTIONS.equalOverBlue }, ['flow']), line({ who: 'red', message: REACTIONS.equalOverRed }, ['flow'])],
    },
    ...BETS.map((b) => ({ label: `bet:${b}`, condition: `\\when{bet=${b}}`, lines: [line(REACTIONS.betLines[b], ['aside', 'flow'])] })),
    ...(['other', 'blue', 'red'] as const).map((w) => ({
      label: `run:${w}`,
      condition: `\\when{winner=${w}}`,
      lines: REACTIONS.runBanter[w].map((l) => line(l, ['flow'])),
    })),
    { label: 'why:once', condition: '\\when{runs=one}', lines: [line(REACTIONS.whyAfter)] },
    { label: 'why:again', condition: '\\when{runs=several}', lines: [line(REACTIONS.whyAgain)] },
    ...(['zero', 'slow', 'same', 'fast', 'all'] as const).map((k) => ({
      label: `dial:${k}`,
      condition: `\\when{stake=${k}}`,
      lines: [line(REACTIONS.dialSaid[k], ['flow'])],
    })),
    { label: 'game:won', condition: '\\when{game=won}', lines: [line(REACTIONS.stopWon)] },
    { label: 'game:lost', condition: '\\when{game=lost}', lines: [line(REACTIONS.stopLost)] },
  ];
}
