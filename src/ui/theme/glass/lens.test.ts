import { describe, expect, test } from 'vitest';
import { bucket, lensFor, supportsLens } from './lens';

describe('supportsLens', () => {
  const yes = {
    chrome: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    webview: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  };
  const no = {
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
    firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  };
  for (const [name, ua] of Object.entries(yes)) test(`${name} lenses`, () => expect(supportsLens(ua)).toBe(true));
  for (const [name, ua] of Object.entries(no)) test(`${name} stays frosted`, () => expect(supportsLens(ua)).toBe(false));
  test('Chromium client hints win', () => expect(supportsLens(no.safari, [{ brand: 'Chromium' }])).toBe(true));
});

test('bucket rounds up to 16px steps', () => {
  expect([1, 16, 17, 100].map(bucket)).toEqual([16, 16, 32, 112]);
});

test('lensFor gives each exact size its own filter but shares the map per size bucket', () => {
  const a = lensFor(100, 60, 24), b = lensFor(110, 62, 24), c = lensFor(200, 60, 24);
  expect(a.id).not.toBe(b.id);
  expect(a.mapKey).toBe(b.mapKey);
  expect(c.mapKey).not.toBe(a.mapKey);
  expect(a).toMatchObject({ id: 'lens-100x60r24', w: 100, h: 60 });
  expect(lensFor(100, 40, 999).mapKey).toBe(lensFor(100, 40, 20).mapKey); // radius clamps to half the short side
});
