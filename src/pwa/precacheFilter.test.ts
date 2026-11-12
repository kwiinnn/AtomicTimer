import { expect, test } from 'vitest';
import { keepInPrecache } from './precacheFilter';

test('app shell, scripts and the bundled Quicksand font are precached', () => {
  for (const url of ['index.html', 'assets/index-abc.js', 'assets/index-abc.css', 'assets/search-worker-entry-x.js',
    'assets/quicksand-latin-700-normal-abc.woff2', 'pwa-192x192.png']) expect(keepInPrecache(url), url).toBe(true);
});
test('optional fonts are left to the runtime font cache', () => {
  for (const url of ['assets/inter-latin-400-normal-abc.woff2', 'assets/DSEG7Classic-Bold-abc.woff2',
    'assets/ibm-plex-serif-cyrillic-700-normal-x.woff2']) expect(keepInPrecache(url), url).toBe(false);
});
test('legacy .woff files are never precached (every supported browser uses woff2)', () => {
  expect(keepInPrecache('assets/quicksand-latin-700-normal-abc.woff')).toBe(false);
});
