/**
 * script/*.tex → what the app reads (ADR-019, the switch): messages/en.json and
 * src/lib/content/story.gen.ts. Lint first: a script with errors writes
 * nothing, so the game keeps the last good version. A file is written only
 * when it changes, so saving an unchanged script reloads nothing.
 *
 * Run by `npm run script:compile`, by the build, and by the dev server on
 * every save of a .tex file (vite.config.ts).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from '../src/lib/script/compile.ts';
import { lint } from '../src/lib/script/lint.ts';
import { loadScript, ROOT } from './script-load.ts';

export interface CompileResult {
  /** Errors that stopped the write, as `script/<file>:<line>: <message>`. */
  readonly errors: readonly string[];
  /** Files that changed. */
  readonly written: readonly string[];
}

const SCHEMA = 'https://inlang.com/schema/inlang-message-format';

function write(path: string, text: string, written: string[]): void {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return;
  writeFileSync(path, text);
  written.push(path);
}

export function compileScript(root: string = ROOT, repo: string = join(root, '..')): CompileResult {
  const script = loadScript('en', root);
  if (!script) return { errors: ['script/decl.tex is missing'], written: [] };
  const errors = lint(script)
    .filter((p) => p.level === 'error')
    .map((p) => `script/${p.file}:${p.line}: ${p.message}`);
  if (errors.length) return { errors, written: [] };
  const { story, messages, problems } = compile(script);
  if (problems.length) return { errors: problems.map((p) => `script/${p}`), written: [] };
  const written: string[] = [];
  write(join(repo, 'messages', 'en.json'), JSON.stringify({ $schema: SCHEMA, ...messages }, null, 2) + '\n', written);
  write(
    join(repo, 'src', 'lib', 'content', 'story.gen.ts'),
    '// Generated from script/*.tex by scripts/script-compile.ts — edit the script, not this file.\n' +
      "import type { Story } from '../script/compile';\n\n" +
      `export const STORY: Story = ${JSON.stringify(story, null, 2)};\n`,
    written,
  );
  return { errors: [], written };
}
