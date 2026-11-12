import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from '../../core/settings';
import { backgroundCss, glassBlobs } from './AppBackground';
import { resolveTheme } from './resolve';

const r = resolveTheme({ palette: 'indigo', customTheme: DEFAULT_SETTINGS.customTheme, themeMode: 'dark' }, false);

test('glass blobs sit over the gradient when there is no photo', () => {
  const css = backgroundCss(r, null, glassBlobs(r));
  expect(css.startsWith('radial-gradient(')).toBe(true);
  expect(css.endsWith(r.gradient)).toBe(true);
  expect(glassBlobs(r).match(/radial-gradient\(/g)).toHaveLength(4);
});

test('a photo replaces the blobs', () => {
  expect(backgroundCss(r, { url: 'u', dim: 0.4 }, glassBlobs(r))).not.toContain('radial-gradient');
});

test('no blobs leaves the plain gradient', () => {
  expect(backgroundCss(r, null)).toBe(r.gradient);
  expect(backgroundCss(r, null, null)).toBe(r.gradient);
});
