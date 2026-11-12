import { alpha } from '@mui/material/styles';
import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, UI_STYLE_IDS } from '../../core/settings';
import { makeTheme } from './makeTheme';
import { resolveTheme } from './resolve';
import { surfaceSx } from './surface';

const r = resolveTheme({ palette: 'indigo', customTheme: DEFAULT_SETTINGS.customTheme, themeMode: 'light' }, false);
const css = (v: unknown) => JSON.stringify(v);

test("material keeps today's theme", () => {
  const t = makeTheme(r, 'X');
  expect(Object.keys(t.components!)).toEqual(['MuiCssBaseline', 'MuiAppBar']);
  expect(t.shape.borderRadius).toBe(8);
  expect(t.uiStyle).toBe('material');
  const m = makeTheme(r, 'X', 'material');
  expect(css(m.components)).toBe(css(t.components));
  expect(css(m.palette)).toBe(css(t.palette));
});

test('radius follows the style', () => {
  expect(UI_STYLE_IDS.map(s => makeTheme(r, 'X', s).shape.borderRadius)).toEqual([8, 24, 12, 12, 0]);
});

test('glass floating layers reference the lens variable, content panels do not', () => {
  const t = makeTheme(r, 'X', 'glass');
  expect(css(t.components!.MuiAppBar!.styleOverrides)).toContain('var(--lens,)');
  expect(css(t.components!.MuiDialog!.styleOverrides)).toContain('var(--lens,)');
  expect(css(t.components!.MuiPaper!.styleOverrides)).not.toContain('var(--lens');
  expect(css(t.components!.MuiPaper!.styleOverrides)).toContain('blur(20px)');
});

test('glass adds timing and reduced-transparency rules', () => {
  const glass = css(makeTheme(r, 'X', 'glass').components!.MuiCssBaseline!.styleOverrides);
  expect(glass).toContain('body[data-timing=\\"true\\"]');
  expect(glass).toContain('prefers-reduced-transparency');
  const material = css(makeTheme(r, 'X').components!.MuiCssBaseline!.styleOverrides);
  expect(material).not.toContain('data-timing');
  expect(material).not.toContain('prefers-reduced-transparency');
});

test('brutalist draws heavy borders and hard shadows', () => {
  const paper = css(makeTheme(r, 'X', 'brutalist').components!.MuiPaper!.styleOverrides);
  expect(paper).toContain(`2px solid ${r.ink}`);
  expect(paper).toContain(`4px 4px 0 ${r.ink}`);
});

test('surfaceSx keeps material panes identical', () => {
  expect(surfaceSx('content', { materialAlpha: 0.75 })(makeTheme(r, 'X')))
    .toEqual({ backgroundColor: alpha('#ffffff', 0.75), backdropFilter: 'blur(14px)' });
  expect(surfaceSx('content')(makeTheme(r, 'X')))
    .toEqual({ backgroundColor: alpha('#ffffff', 0.6), backdropFilter: 'blur(14px)' });
});

test('surfaceSx follows other styles', () => {
  expect(surfaceSx('content')(makeTheme(r, 'X', 'outline'))).toMatchObject({ backgroundColor: alpha('#ffffff', 0), boxShadow: 'none' });
});
