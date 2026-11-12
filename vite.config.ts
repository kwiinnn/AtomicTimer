import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { keepInPrecache } from './src/pwa/precacheFilter.ts';

const PRIMARY = '#3f51b5';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Atomic Timer',
        short_name: 'Atomic Timer',
        description: 'Speedcubing timer with WCA scrambles, sessions and statistics.',
        display: 'standalone',
        theme_color: PRIMARY,
        background_color: '#121212',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // cubing.js ships its scramble search as many lazily loaded chunks; precache all of them for offline use.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        clientsClaim: false,
        // Optional fonts are not precached (hundreds of subset files); see src/pwa/precacheFilter.ts.
        manifestTransforms: [async entries => ({ manifest: entries.filter(e => keepInPrecache(e.url)), warnings: [] })],
        runtimeCaching: [
          {
            // Fonts chosen in the Theme page: cached on first use so they keep working offline.
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 300, maxAgeSeconds: 365 * 24 * 3600 } },
          },
        ],
      },
    }),
  ],
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
