import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // One worker: this laptop runs short of memory; a test run must never be what tips it over.
    maxWorkers: 1,
  },
});
