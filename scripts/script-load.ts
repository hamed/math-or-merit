/** Reads script/ the way main.tex does: its files, in its order, for one language. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseScript, type Script } from '../src/lib/script/parse.ts';

/** Folders of units: content that doesn't know what it is until something includes it. */
export const UNIT_DIRS = ['cards', 'widgets'];

export const ROOT = join(import.meta.dirname, '..', 'script');

/** The files main.tex reads, in its order, for one language. */
export function loadScript(lang: string, root: string = ROOT): Script | null {
  const dir = lang === 'en' ? root : join(root, lang);
  if (!existsSync(join(dir, 'decl.tex'))) return null;
  const main = readFileSync(join(root, 'main.tex'), 'utf8');
  const names = [...main.matchAll(/\\scriptinput\{\\langdir ([^}]+)\}/g)].map((m) => `${m[1]}.tex`);
  const read = (name: string) => ({ file: join(lang === 'en' ? '' : lang, name), text: readFileSync(join(dir, name), 'utf8') });
  const units = UNIT_DIRS.flatMap((sub) =>
    existsSync(join(dir, sub))
      ? readdirSync(join(dir, sub))
          .filter((f) => f.endsWith('.tex'))
          .sort()
          .map((f) => read(join(sub, f)))
      : [],
  );
  return parseScript({
    lang,
    decl: read('decl.tex'),
    files: names.filter((name) => existsSync(join(dir, name))).map(read),
    units,
  });
}
