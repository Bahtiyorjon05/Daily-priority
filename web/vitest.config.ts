import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Until now the suite had no config and every test used relative imports, which
 * worked only because nothing under test resolved a `@/` path itself. The i18n
 * modules import their dictionaries as `@/messages/*`, so the alias has to
 * match the one in tsconfig or the app and the tests disagree about what a
 * module is.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
