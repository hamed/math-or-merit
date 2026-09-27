import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * The script is the story (ADR-019): every word, the order, the waits. Before
 * anything else reads messages/en.json or the story, compile script/*.tex into
 * them; in dev, again on every save of a .tex file, so an edit shows on the
 * stage at once. A script that breaks the grammar writes nothing: the page
 * keeps the last good version and the error shows in the terminal and on the
 * page's overlay.
 */
function script(): Plugin {
  const root = resolve(__dirname, 'script');
  const run = async () => {
    const { compileScript } = await import('./scripts/script-compile.ts');
    return compileScript(root, __dirname);
  };
  return {
    name: 'script',
    enforce: 'pre',
    async config() {
      const { errors } = await run();
      for (const e of errors) console.error(e);
    },
    configureServer(server) {
      server.watcher.add(root);
      server.watcher.on('change', async (file) => {
        if (!file.startsWith(root) || !file.endsWith('.tex')) return;
        const { errors, written } = await run();
        if (errors.length) {
          for (const e of errors) server.config.logger.error(e);
          server.ws.send({ type: 'error', err: { message: errors.join('\n'), stack: '', plugin: 'script' } });
        } else if (written.length) server.config.logger.info(`script: ${written.map((w) => w.slice(__dirname.length + 1)).join(', ')}`);
      });
    },
  };
}

// Project-page deploys live under /<repo>/; local dev and any root-domain host
// use '/'. BASE_PATH is set by the Pages workflow, so nothing here needs editing
// if the site later moves to its own domain.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    script(),
    // Every reader-facing word is a message (ADR-017 A2), compiled from the
    // script (ADR-019) into messages/en.json. The locale is only ever chosen on
    // purpose (localStorage), never from the browser: a Farsi browser must not
    // land in an untranslated right-to-left page.
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['localStorage', 'baseLocale'],
      // typed output, so `tsc --noEmit` (CI's check) sees the messages' types
      emitTsDeclarations: true,
    }),
    svelte(),
  ],
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
    },
  },
  test: {
    environment: 'node',
    // archive/ holds superseded code kept only for reference; its tests must not
    // gate the build. Vitest's `exclude` replaces the defaults rather than
    // extending them, so the usual entries are repeated here.
    exclude: ['**/node_modules/**', '**/dist/**', 'archive/**', 'tests/browser/**'],
  },
});
