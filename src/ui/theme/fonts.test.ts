import { expect, test } from 'vitest';
import { FONT_IDS, TIMER_FONT_IDS } from '../../core/settings';
import { FONTS, timerFamily } from './fonts';

test('every font has a label, a category and a stack ending in a generic fallback', () => {
  for (const id of FONT_IDS) {
    expect(FONTS[id].label, id).toBeTruthy();
    expect(['sans', 'serif', 'mono', 'display'], id).toContain(FONTS[id].category);
    expect(FONTS[id].family, id).toMatch(/, (system-ui|monospace|serif|sans-serif)$/);
  }
});
test('serif faces fall back to serif, mono faces to monospace', () => {
  for (const id of FONT_IDS) {
    if (FONTS[id].category === 'serif') expect(FONTS[id].family, id).toMatch(/serif$/);
    if (FONTS[id].category === 'mono') expect(FONTS[id].family, id).toMatch(/monospace$/);
  }
});
test('web fonts load on demand; Quicksand ships with the app and system needs nothing', () => {
  expect(FONTS.system.load).toBeUndefined();
  expect(FONTS.quicksand.load).toBeUndefined();
  for (const id of FONT_IDS.filter(i => i !== 'system' && i !== 'quicksand')) expect(typeof FONTS[id].load, id).toBe('function');
});
test('timer font "app" follows the app font', () => {
  expect(timerFamily('app', 'newsreader')).toBe(FONTS.newsreader.family);
  expect(timerFamily('lcd', 'newsreader')).toBe(FONTS.lcd.family);
  expect(TIMER_FONT_IDS[0]).toBe('app');
});
