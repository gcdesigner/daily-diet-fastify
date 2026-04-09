/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    fileParallelism: false,
    include: ['src/**/*.spec.ts'],
  },
})
