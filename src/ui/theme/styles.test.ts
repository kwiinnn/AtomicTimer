import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, PALETTE_IDS, UI_STYLE_IDS, type CustomTheme, type PaletteChoice } from '../../core/settings';
import { compositeOver, contrastRatio, mix } from './palettes';
import { resolveTheme } from './resolve';
import { effectiveSurface, STYLE_TOKENS } from './styles';

const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

test('compositeOver blends a colour at an alpha over a background', () => {
  const [r, g, b] = channels(compositeOver('#000000', 0.5, '#ffffff'));
  for (const c of [r, g, b]) expect(Math.abs(c! - 128)).toBeLessThanOrEqual(1);
  expect(compositeOver('#123456', 1, '#ffffff')).toBe('#123456');
  expect(compositeOver('#123456', 0, '#ffffff')).toBe('#ffffff');
});

test('mix interpolates between two colours', () => {
  expect(mix('#000000', '#ffffff', 0.25)).toBe('#404040');
  expect(mix('#102030', '#ffffff', 0)).toBe('#102030');
});

test('material tokens describe today\'s look', () => {
  expect(STYLE_TOKENS.material).toEqual({
    radius: 8, control: 'default',
    content: { fillAlpha: 1, blurPx: 0, saturate: 1, lens: false },
    float: { fillAlpha: 1, blurPx: 0, saturate: 1, lens: false },
    border: 'none', shadow: 'material',
  });
});

test('radius follows the style', () => {
  expect(UI_STYLE_IDS.map(id => STYLE_TOKENS[id].radius)).toEqual([8, 24, 12, 12, 0]);
});

test('only glass floating surfaces lens', () => {
  for (const id of UI_STYLE_IDS) {
    expect(STYLE_TOKENS[id].content.lens).toBe(false);
    expect(STYLE_TOKENS[id].float.lens).toBe(id === 'glass');
  }
});

describe('text reads on every surface', () => {
  const customs: CustomTheme[] = [
    { from: '#fafafa', to: '#f0f0f0', accent: '#ff4081', angle: 0 },
    { from: '#000000', to: '#101010', accent: '#ff4081', angle: 0 },
  ];
  const cases: { label: string; palette: PaletteChoice; customTheme: CustomTheme }[] = [
    ...PALETTE_IDS.map(palette => ({ label: palette, palette, customTheme: DEFAULT_SETTINGS.customTheme })),
    ...customs.map((customTheme, i) => ({ label: `custom${i}`, palette: 'custom' as const, customTheme })),
  ];
  for (const c of cases) {
    for (const themeMode of ['light', 'dark'] as const) {
      test(`${c.label} / ${themeMode}`, () => {
        const r = resolveTheme({ palette: c.palette, customTheme: c.customTheme, themeMode }, false);
        for (const style of UI_STYLE_IDS) {
          for (const kind of ['content', 'float'] as const) {
            for (const stop of r.stops) {
              const surface = effectiveSurface(style, kind, r, stop);
              expect(contrastRatio(r.ink, surface), `${c.label}/${r.mode}/${style}/${kind} on ${stop}`).toBeGreaterThanOrEqual(4.5);
            }
          }
        }
      });
    }
  }
});
