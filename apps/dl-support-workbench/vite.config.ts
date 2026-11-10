import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    strictPort: false,
    proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    server: { deps: { fallbackCJS: true, inline: [/^@fluentui\//] } },
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'html'],
      include: ['src/api/client.ts'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});