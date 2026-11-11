import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  optimizeDeps: { exclude: ['cubing'] },
  worker: { format: 'es' },
  build: {
    // No preload deps, so the helper never touches `document` when called from the worker.
    modulePreload: false,
    rolldownOptions: {
      output: {
        // cubing.js's worker imports Vite's preload helper. Keep it in its own chunk so the worker
        // does not import (and execute) the app entry chunk, which touches `document`.
        codeSplitting: { groups: [{ name: 'preload-helper', test: /preload-helper/ }] },
      },
    },
  },
});
