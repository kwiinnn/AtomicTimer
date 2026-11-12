import { alpha } from '@mui/material/styles';
import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, PALETTE_IDS, UI_STYLE_IDS } from '../../core/settings';
import { makeTheme } from './makeTheme';
import { resolveTheme } from './resolve';
import { compositeOver, contrastRatio } from './palettes';
import { phoneCardSx, surfaceSx, tileDepthSx } from './surface';

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
  // MUI 9 has no per-anchor class on the paper, so the override reads ownerState.anchor.
  const t = makeTheme(r, 'X', 'glass');
  const paper = t.components!.MuiDrawer!.styleOverrides!.paper as (p: { ownerState: { anchor?: string }; theme: typeof t }) => Record<string, unknown>;
  expect(paper({ ownerState: { anchor: 'bottom' }, theme: t })).toMatchObject({ borderRadius: '24px 24px 0 0' });
  expect(paper({ ownerState: { anchor: 'left' }, theme: t })).toMatchObject({ borderRadius: '0 24px 24px 0' });
  expect(paper({ ownerState: { anchor: 'right' }, theme: t })).toMatchObject({ borderRadius: '24px 0 0 24px' });
  expect(paper({ ownerState: { anchor: 'top' }, theme: t })).toMatchObject({ borderRadius: '0 0 24px 24px' });
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

test('glass tab capsule is inset from the pill edge', () => {
  const ind = makeTheme(r, 'X', 'glass').components!.MuiTabs!.styleOverrides!.indicator;
  expect(ind).toMatchObject({ top: 0, height: '100%', boxSizing: 'border-box', border: '4px solid transparent', backgroundClip: 'padding-box' });
});

test('glass tabs have no touch ripple but keep a focus outline', () => {
  const tab = makeTheme(r, 'X', 'glass').components!.MuiTab!;
  expect(tab.defaultProps).toMatchObject({ disableRipple: true });
  expect(css(tab.styleOverrides)).toContain('Mui-focusVisible');
  expect(css(tab.styleOverrides)).toContain('"WebkitTapHighlightColor":"transparent"');
});

test('glass tab capsule flows: springy slide plus a stretch on every switch', () => {
  const t = makeTheme(r, 'X', 'glass').components!;
  expect(css(t.MuiTabs!.styleOverrides!.indicator)).toMatch(/left \d+ms cubic-bezier\([^)]*1\.\d+/);
  const base = css(t.MuiCssBaseline!.styleOverrides);
  expect(base).toContain('@keyframes glass-flow-a');
  expect(base).toContain('@keyframes glass-flow-b');
  expect(base).toContain('.glass-tabs[data-flow=\\"a\\"] .MuiTabs-indicator');
  expect(base).toContain('prefers-reduced-motion');
});

test('phone glass cards use px spacing, not theme spacing units', () => {
  expect(phoneCardSx(8)(makeTheme(r, 'X', 'glass'))).toMatchObject({ margin: '8px', padding: '8px' });
  expect(phoneCardSx(8)(makeTheme(r, 'X'))).toEqual({});
});

test('glass time tiles stay readable in every palette, whatever is behind them', () => {
  for (const palette of PALETTE_IDS) {
    for (const themeMode of ['light', 'dark'] as const) {
      const rr = resolveTheme({ palette, customTheme: DEFAULT_SETTINGS.customTheme, themeMode }, false);
      const bg = tileDepthSx(makeTheme(rr, 'X', 'glass')).backgroundColor as string;
      const [cr, cg, cb, ca] = bg.match(/[\d.]+/g)!.map(Number);
      const hex = `#${[cr, cg, cb].map(v => Math.round(v!).toString(16).padStart(2, '0')).join('')}`;
      for (const behind of ['#000000', '#ffffff']) {
        expect(contrastRatio(rr.ink, compositeOver(hex, ca!, behind)), `${palette}/${themeMode} over ${behind}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});
