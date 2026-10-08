/**
 * The script is the story (ADR-019): every word, the order, the waits. Before
 * anything else reads messages/en.json or the story, compile script/*.tex into
 * them; in dev, again on every save of a .tex file, so an edit shows on the
 * stage at once. A script that breaks the grammar writes nothing: the dev
 * server keeps the last good page and shows the error in the terminal and on
 * the page's overlay — but a production build stops, or it would ship the last
 * good words as if they were the new ones (PR #21 review).
 */
import type { Plugin } from 'vite';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CompileResult } from './script-compile.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The compiler in a fresh process each time, so a running server never keeps an old one. */
function compileFresh(): CompileResult {
  const out = spawnSync(process.execPath, [resolve(REPO, 'scripts/script.ts'), 'compile', '--json'], { encoding: 'utf8' });
  try {
    return JSON.parse(out.stdout);
  } catch {
    // the compiler did not run, or said nothing readable: that is a failed compile too
    return { errors: [out.stderr || out.stdout || out.error?.message || 'script compile failed'], written: [] };
  }
}

export function scriptPlugin(run: () => CompileResult = compileFresh): Plugin {
  const root = resolve(REPO, 'script');
  return {
    name: 'script',
    enforce: 'pre',
    config(_config, env) {
      const { errors } = run();
      for (const e of errors) console.error(e);
      if (errors.length && env.command === 'build') throw new Error(`the script does not compile:\n${errors.join('\n')}`);
    },
    configureServer(server) {
      server.watcher.add(root);
      server.watcher.on('change', (file) => {
        if (!file.startsWith(root) || !file.endsWith('.tex')) return;
        const { errors, written } = run();
        if (errors.length) {
          for (const e of errors) server.config.logger.error(e);
          server.ws.send({ type: 'error', err: { message: errors.join('\n'), stack: '', plugin: 'script' } });
        } else if (written.length) server.config.logger.info(`script: ${written.map((w) => w.slice(REPO.length + 1)).join(', ')}`);
      });
    },
  };
}
