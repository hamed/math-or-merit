import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { plain } from './inline.ts';
import { lint } from './lint.ts';
import { parseScript, walk, wordsOf, type Script } from './parse.ts';
import { printFile } from './print.ts';
import { diffSkeleton, skeleton } from './skeleton.ts';

const FIX = join(import.meta.dirname, 'fixtures');
const SCRIPT = join(import.meta.dirname, '..', '..', '..', 'script');
const read = (dir: string, file: string) => ({ file, text: readFileSync(join(dir, file), 'utf8') });

const golden = (file = 'golden.tex', lang = 'en') =>
  parseScript({ lang, decl: read(FIX, lang === 'en' ? 'decl.tex' : 'decl-fa.tex'), files: [read(FIX, file)] });

/** A one-file script from a string, for the lint rules. */
const one = (text: string, lang = 'en') => parseScript({ lang, decl: read(FIX, 'decl.tex'), files: [{ file: 'x.tex', text }] });
const errors = (script: Script) => lint(script).filter((p) => p.level === 'error').map((p) => p.message);

const squash = (s: string) => s.replace(/\s+/g, '');

describe('the golden sample (brief §9)', () => {
  it('parses without a problem', () => {
    expect(lint(golden())).toEqual([]);
  });

  it('parses to the checked-in tree', () => {
    const tree = JSON.stringify(golden().files, null, 2) + '\n';
    const path = join(FIX, 'golden.json');
    if (!existsSync(path)) writeFileSync(path, tree);
    expect(tree).toBe(readFileSync(path, 'utf8'));
  });

  it('numbers bubbles by panel, counting bubbles only', () => {
    const ids = [...walk(golden())].flatMap(({ item }) => (item.kind === 'bubble' ? [item.id] : []));
    expect(ids.slice(0, 8)).toEqual(['round2.1', 'round2.2', 'round2.3', 'round2.4', 'round2.5', 'round2.6', 'round2.7', 'round2.8']);
    expect(ids.slice(8)).toEqual(['offer.1', 'offer.2', 'cow.1']);
  });

  it('keeps line breaks inside a bubble and attaches the claim', () => {
    const bubble = [...walk(golden())].map(({ item }) => item).find((i) => i.kind === 'bubble' && i.id === 'round2.6');
    if (bubble?.kind !== 'bubble') throw new Error('no round2.6');
    expect(wordsOf(bubble).map((l) => plain(l))).toEqual(['Yes. That way everybody can keep playing.']);
    expect(bubble.body.map((l) => l.k)).toEqual(['text', 'attach']);
  });
});

describe('round trip: parse → print → the same source', () => {
  const files: { dir: string; file: string }[] = [
    { dir: FIX, file: 'golden.tex' },
    { dir: FIX, file: 'golden-fa.tex' },
  ];
  for (const sub of ['', 'fa', 'branches', join('fa', 'branches')]) {
    const dir = join(SCRIPT, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.tex') && !['main.tex', 'main-fa.tex', 'decl.tex'].includes(f)) files.push({ dir, file: join(sub, f) });
    }
  }
  for (const { dir, file } of files) {
    it(file, () => {
      const lang = file.startsWith('fa') || file.includes('-fa') ? 'fa' : 'en';
      const declDir = dir === FIX ? FIX : join(SCRIPT, lang === 'fa' ? 'fa' : '');
      const declFile = dir === FIX ? (lang === 'fa' ? 'decl-fa.tex' : 'decl.tex') : 'decl.tex';
      const source = readFileSync(join(dir === FIX ? FIX : SCRIPT, dir === FIX ? file : file), 'utf8');
      const script = parseScript({ lang, decl: read(declDir, declFile), files: [{ file, text: source }] });
      expect(script.problems.filter((p) => p.level === 'error')).toEqual([]);
      expect(squash(printFile(script.files[0]))).toBe(squash(source));
    });
  }
});

describe('lint', () => {
  it('rejects an undeclared speaker', () => {
    expect(errors(one('Green: Hello.'))).toEqual(['"Green" is not a declared speaker (decl.tex)']);
  });

  it('rejects a command outside the grammar', () => {
    expect(errors(one('\\vspace{1em}'))).toEqual(['\\vspace is not part of the grammar']);
    expect(errors(one('Blue: Look \\underline{here}.'))).toEqual(['\\underline is not part of the grammar']);
  });

  it('catches the % and $ traps', () => {
    expect(errors(one('Red: Half is 50%.'))).toEqual(['a bare % starts a comment in LaTeX; write \\% for a percent sign']);
    expect(errors(one('Red: It costs $5 and $6.'))).toEqual(['$ before a digit opens math; write \\$ for dollars']);
    expect(errors(one('Red: It costs \\$5, half is 50\\%.'))).toEqual([]);
  });

  it('trips on a compound condition, and on undeclared facts and events', () => {
    const pool = (cond: string) => one(`\\section{X}\\label{news:x}\n${cond}\n\nRed: Hi.`);
    expect(errors(pool('\\when{winner=blue}'))).toEqual([]);
    expect(errors(pool('\\when{winner=blue and bet=all}'))[0]).toMatch(/tripwire/);
    expect(errors(pool('\\when{mood=good}'))).toEqual(['"mood" is not a declared fact (decl.tex)']);
    expect(errors(pool('\\on{thunder}'))[0]).toMatch(/not a declared event/);
  });

  it('wants a label on every section and scene', () => {
    expect(errors(one('\\subsection{Round two}'))).toEqual(['\\subsection{Round two} needs a \\label']);
  });

  it('holds a bubble to 18 words, and warns above 12', () => {
    const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    expect(errors(one(`Red: ${words(19)}.`))).toEqual(['19 words: a bubble holds at most 18']);
    expect(lint(one(`Red: ${words(13)}.`)).map((p) => p.level)).toEqual(['warning']);
    expect(lint(one(`Red: ${words(19)}.`, 'fa'))).toEqual([]);
  });

  it('allows a list only as the body of a bubble or an action', () => {
    expect(errors(one('\\begin{itemize}\n\\item A\n\\end{itemize}'))[0]).toMatch(/must follow/);
    expect(errors(one('Red:\n\\begin{enumerate}\n\\item Hi.\n\\item Hello?\n\\end{enumerate}'))).toEqual([]);
    expect(errors(one('\\reveal{math}\n\\begin{enumerate}\n\\item Stars\n\\end{enumerate}'))).toEqual([]);
  });

  it('checks where a choice goes: nowhere, a label, an answer, or an action', () => {
    const at = (target: string) => one(`\\section{A}\\label{a}\n\nRed: Pick.\n\\choice{Go}${target}`);
    expect(errors(at(''))).toEqual([]);
    expect(errors(at('{a}'))).toEqual([]);
    expect(errors(at('{bet=all}'))).toEqual([]);
    expect(errors(at('{\\run}'))).toEqual([]);
    expect(errors(at('{nowhere}'))[0]).toMatch(/is none/);
    expect(errors(at('{\\dance}'))[0]).toMatch(/action from the grammar/);
  });

  it('warns on a manner word it does not know', () => {
    expect(lint(one('Red (laughs): Ha.')).map((p) => p.message)).toEqual(['manner "laughs" is kept as a delivery hint']);
  });
});

describe('skeleton', () => {
  it('is the same in English and Farsi, whatever the bubbles', () => {
    const diff = diffSkeleton(golden(), golden('golden-fa.tex', 'fa'));
    expect(diff.mismatches).toEqual([]);
    expect(diff.extra).toEqual([]);
    expect(diff.missing).toEqual(['offer', 'guess', 'cow']);
  });

  it('fails loudly on a broken translation', () => {
    const diff = diffSkeleton(golden(), golden('broken-fa.tex', 'fa'));
    expect(diff.mismatches).toEqual([
      { label: 'round2', source: '\\stake{2}', translation: '\\stake{3}', at: 'broken-fa.tex:18' },
    ]);
  });

  it('holds structure, actions and choice targets, never words', () => {
    expect(skeleton(golden()).map((b) => b.label)).toEqual([
      'section game',
      'subsection round2',
      '\\expect{blue=4, red=12}',
      '\\stake{2}',
      '\\card{rule}',
      '\\flip{blue}',
      'subsection offer',
      '\\choice{cow}',
      '\\choice{guess}',
      'subsection guess',
      'section cow',
      '\\return',
    ]);
  });
});
