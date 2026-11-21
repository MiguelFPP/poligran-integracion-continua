import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// En CI se emiten reportes que Jenkins publica; en local no se escribe nada.
const isCi = process.env.CI === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    ...(isCi
      ? {
          reporters: ['default', 'junit'],
          outputFile: { junit: './reports/junit.xml' },
        }
      : {}),
    coverage: {
      provider: 'v8',
      reporter: isCi ? ['text', 'lcov', 'html'] : ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/generated/**'],
      thresholds: { statements: 60, lines: 60, branches: 50 },
    },
  },
});
