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

test('the sx radius unit is about half the panel radius, so 2× cards match the style', () => {
  // Hand-built cards use sx borderRadius 1–2 (× shape.borderRadius); panels get the full radius in px.
  expect(UI_STYLE_IDS.map(s => makeTheme(r, 'X', s).shape.borderRadius)).toEqual([8, 12, 6, 6, 0]);
});

test('glass floating layers reference the lens variable, content panels do not', () => {
  const t = makeTheme(r, 'X', 'glass');
  expect(css(t.components!.MuiAppBar!.styleOverrides)).toContain('var(--lens,)');
  expect(css(t.components!.MuiDialog!.styleOverrides)).toContain('var(--lens,)');
  expect(css(t.components!.MuiPaper!.styleOverrides)).not.toContain('var(--lens');
  expect(css(t.components!.MuiPaper!.styleOverrides)).toContain('blur(20px)');
});

test('glass adds the timing rule globally and reduced transparency per surface', () => {
  const glass = makeTheme(r, 'X', 'glass').components!;
  expect(css(glass.MuiCssBaseline!.styleOverrides)).toContain('body[data-timing=\\"true\\"]');
  expect(css(glass.MuiPaper!.styleOverrides)).toContain('prefers-reduced-transparency');
  expect(css(glass.MuiAppBar!.styleOverrides)).toContain('prefers-reduced-transparency');
  const material = makeTheme(r, 'X').components!;
  expect(css(material.MuiCssBaseline!.styleOverrides)).not.toContain('data-timing');
  expect(css(material)).not.toContain('prefers-reduced-transparency');
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

test('surfaceSx radius is in px, not theme spacing units', () => {
  // sx multiplies bare numbers by shape.borderRadius, so the radius must be an explicit px string.
  expect(surfaceSx('content')(makeTheme(r, 'X', 'glass'))).toMatchObject({ borderRadius: '24px' });
});

// --- Final review fixes ---

test('snackbar text uses the ink colour in every style', () => {
  for (const s of UI_STYLE_IDS.filter(s => s !== 'material')) {
    for (const mode of ['light', 'dark'] as const) {
      const rr = resolveTheme({ palette: 'indigo', customTheme: DEFAULT_SETTINGS.customTheme, themeMode: mode }, false);
      expect(makeTheme(rr, 'X', s).components!.MuiSnackbarContent!.styleOverrides!.root, `${s}/${mode}`).toMatchObject({ color: rr.ink });
    }
  }
});

test('flat keeps the keyboard focus ripple', () => {
  const base = makeTheme(r, 'X', 'flat').components!.MuiButtonBase!.defaultProps!;
  expect(base.disableRipple).toBeFalsy();
  expect(base.disableTouchRipple).toBe(true);
});

test('outline keeps each button colour (error stays red)', () => {
  const t = makeTheme(r, 'X', 'outline');
  const contained = t.components!.MuiButton!.styleOverrides!.contained as (p: { ownerState: { color?: string }; theme: typeof t }) => Record<string, unknown>;
  expect(contained({ ownerState: { color: 'error' }, theme: t })).toMatchObject({ color: t.palette.error.main, border: `1px solid ${t.palette.error.main}` });
  expect(contained({ ownerState: { color: 'primary' }, theme: t })).toMatchObject({ color: t.palette.primary.main });
  expect(contained({ ownerState: { color: 'inherit' }, theme: t })).toMatchObject({ color: 'currentColor' });
});

test('drawer corners follow its anchor', () => {
  const paper = css(makeTheme(r, 'X', 'glass').components!.MuiDrawer!.styleOverrides!.paper);
  expect(paper).toContain('"&.MuiDrawer-paperAnchorBottom":{"borderRadius":"24px 24px 0 0"}');
  expect(paper).toContain('"&.MuiDrawer-paperAnchorLeft":{"borderRadius":"0 24px 24px 0"}');
});

test('reduced transparency is part of every glass surface, not only Papers', () => {
  const pane = css(surfaceSx('content', { edge: 'right' })(makeTheme(r, 'X', 'glass')));
  expect(pane).toContain('@media (prefers-reduced-transparency: reduce)');
  expect(pane).toContain('"backdropFilter":"none"');
});

test('glass bars blur more where the lens is unavailable', () => {
  // LensLayer lowers --glass-lens-blur to 3px only where the lens renders; elsewhere the frost stays at 12px.
  expect(css(makeTheme(r, 'X', 'glass').components!.MuiAppBar!.styleOverrides)).toContain('blur(var(--glass-lens-blur, 12px))');
});
