import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Un solo MongoDB en memoria para toda la corrida; cada archivo usa su propia base.
    globalSetup: ['test/globalSetup.ts'],
    setupFiles: ['test/setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 120_000,
  },
});
