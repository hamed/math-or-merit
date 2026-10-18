import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  // two pages: the stage, and the about page its byline links to
  build: { rollupOptions: { input: ['index.html', 'about.html'] } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // One worker: this laptop runs short of memory; a test run must never be what tips it over.
    maxWorkers: 1,
    // The long simulations (the demo, a big history's replay) run 4–6 s here when the machine is busy:
    // a timeout is not a finding.
    testTimeout: 20_000,
  },
});
