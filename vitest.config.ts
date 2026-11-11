import { defineConfig } from 'vitest/config';

// Unit tests run in node by default; UI tests opt in with `// @vitest-environment jsdom`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
