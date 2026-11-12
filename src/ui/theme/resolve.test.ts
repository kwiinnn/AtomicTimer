import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, PALETTE_IDS } from '../../core/settings';
import { contrastRatio } from './palettes';
import { resolveTheme } from './resolve';

const base = { palette: DEFAULT_SETTINGS.palette, customTheme: DEFAULT_SETTINGS.customTheme, themeMode: DEFAULT_SETTINGS.themeMode };

describe('every preset is readable in both modes', () => {
  for (const palette of PALETTE_IDS) {
    for (const themeMode of ['light', 'dark'] as const) {
      test(`${palette} / ${themeMode}`, () => {
        const r = resolveTheme({ ...base, palette, themeMode }, false);
        expect(r.mode).toBe(themeMode);
        for (const stop of r.stops) {
          expect(contrastRatio(r.ink, stop), `text on ${stop}`).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(r.holding, stop), `holding on ${stop}`).toBeGreaterThanOrEqual(3);
          expect(contrastRatio(r.ready, stop), `ready on ${stop}`).toBeGreaterThanOrEqual(3);
        }
      });
    }
  }
});

test('system mode follows the OS preference', () => {
  expect(resolveTheme({ ...base, themeMode: 'system' }, true).mode).toBe('dark');
  expect(resolveTheme({ ...base, themeMode: 'system' }, false).mode).toBe('light');
});

test('gradient css uses the angle and both stops', () => {
  const r = resolveTheme({ ...base, palette: 'custom', customTheme: { from: '#102030', to: '#405060', angle: 45, accent: '#ff0000' } }, false);
  expect(r.gradient).toBe('linear-gradient(45deg, #102030, #405060)');
  expect(r.primary).toBe('#ff0000');
});

test('custom theme picks the ink that reads best, ignoring the mode setting', () => {
  const dark = resolveTheme({ ...base, themeMode: 'light', palette: 'custom', customTheme: { from: '#000000', to: '#1a1a40', angle: 0, accent: '#ff4081' } }, false);
  expect([dark.mode, dark.ink]).toEqual(['dark', '#ffffff']);
  const light = resolveTheme({ ...base, themeMode: 'dark', palette: 'custom', customTheme: { from: '#ffffff', to: '#fff3e0', angle: 0, accent: '#3f51b5' } }, true);
  expect(light.mode).toBe('light');
});
