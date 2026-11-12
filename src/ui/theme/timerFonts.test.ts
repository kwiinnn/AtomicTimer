import { expect, test } from 'vitest';
import { TIMER_FONT_IDS } from '../../core/settings';
import { TIMER_FONTS } from './timerFonts';

test('every timer font has a label and a font stack with a fallback', () => {
  for (const id of TIMER_FONT_IDS) {
    expect(TIMER_FONTS[id].label, id).toBeTruthy();
    expect(TIMER_FONTS[id].family, id).toMatch(/, (system-ui|monospace|sans-serif)/);
  }
});
test('web fonts are loaded on demand, the system font needs nothing', () => {
  expect(TIMER_FONTS.system.load).toBeUndefined();
  for (const id of ['mono', 'digital', 'lcd'] as const) expect(typeof TIMER_FONTS[id].load, id).toBe('function');
});
