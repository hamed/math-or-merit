/** Reads script/ the way main.tex does: its files, in its order, for one language. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseScript, type Script } from '../src/lib/script/parse.ts';

export const ROOT = join(import.meta.dirname, '..', 'script');

/** The files main.tex reads, in its order, for one language. */
export function loadScript(lang: string): Script | null {
  const dir = lang === 'en' ? ROOT : join(ROOT, lang);
  if (!existsSync(join(dir, 'decl.tex'))) return null;
  const main = readFileSync(join(ROOT, 'main.tex'), 'utf8');
  const names = [...main.matchAll(/\\scriptinput\{\\langdir ([^}]+)\}/g)].map((m) => `${m[1]}.tex`);
  const read = (name: string) => ({ file: join(lang === 'en' ? '' : lang, name), text: readFileSync(join(dir, name), 'utf8') });
  return parseScript({
    lang,
    decl: read('decl.tex'),
    files: names.filter((name) => existsSync(join(dir, name))).map(read),
  });
}
