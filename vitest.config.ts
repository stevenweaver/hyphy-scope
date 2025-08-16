import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte({ hot: !process.env.VITEST }),
    svelteTesting()
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true
  },
  resolve: {
    alias: {
      '$lib': new URL('./src/lib', import.meta.url).pathname
    },
    conditions: mode === 'test' ? ['browser'] : []
  }
}));