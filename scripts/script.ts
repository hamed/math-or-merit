/**
 * The script's command line.
 *
 *   node scripts/script.ts lint [--brief]   check every language; exit 1 on an error
 *   node scripts/script.ts print <file>      the canonical source of one file
 *   node scripts/script.ts compile           messages/en.json and the story the app reads
 *
 * The PDF build runs `lint --brief` before every LuaLaTeX pass (script/.latexmkrc),
 * so a broken script never makes a PDF. Files are read in the order main.tex
 * inputs them.
 */
import { lint } from '../src/lib/script/lint.ts';
import type { Problem } from '../src/lib/script/parse.ts';
import { printFile } from '../src/lib/script/print.ts';
import { diffSkeleton } from '../src/lib/script/skeleton.ts';
import { compileScript } from './script-compile.ts';
import { loadScript } from './script-load.ts';

function report(problems: readonly Problem[], brief: boolean): number {
  const errors = problems.filter((p) => p.level === 'error');
  const warnings = problems.filter((p) => p.level === 'warning');
  for (const p of errors) console.error(`script/${p.file}:${p.line}: error: ${p.message}`);
  if (!brief) for (const p of warnings) console.warn(`script/${p.file}:${p.line}: warning: ${p.message}`);
  const tail = brief && warnings.length ? ' (npm run script:lint lists the warnings)' : '';
  console.error(`script lint: ${errors.length} error(s), ${warnings.length} warning(s)${tail}`);
  return errors.length;
}

const [command = 'lint', ...rest] = process.argv.slice(2);

if (command === 'lint') {
  const en = loadScript('en');
  if (!en) throw new Error('script/decl.tex is missing');
  const problems: Problem[] = [...lint(en)];
  const fa = loadScript('fa');
  if (fa) {
    problems.push(...lint(fa));
    const diff = diffSkeleton(en, fa);
    for (const m of diff.mismatches) {
      const [file, line] = m.at.split(':');
      problems.push({ file, line: Number(line), level: 'error', message: `skeleton differs from English under "${m.label}": ${m.translation} where English has ${m.source}` });
    }
    for (const label of diff.extra) problems.push({ file: 'fa', line: 0, level: 'error', message: `"${label}" is not in the English script` });
  }
  process.exit(report(problems, rest.includes('--brief')) ? 1 : 0);
} else if (command === 'compile') {
  const { errors, written } = compileScript();
  if (rest.includes('--json')) {
    // for the dev server (vite.config.ts), which reports the errors itself
    console.log(JSON.stringify({ errors, written }));
    process.exit(0);
  }
  for (const e of errors) console.error(e);
  console.log(errors.length ? 'script compile: not written' : `script compile: ${written.length ? written.join(', ') : 'up to date'}`);
  process.exit(errors.length ? 1 : 0);
} else if (command === 'print') {
  const lang = rest[0]?.startsWith('fa/') ? 'fa' : 'en';
  const script = loadScript(lang);
  const file = script?.files.find((f) => f.file === rest[0]);
  if (!file) throw new Error(`not a script file: ${rest[0]}`);
  process.stdout.write(printFile(file));
} else {
  console.error(`unknown command: ${command}`);
  process.exit(2);
}
