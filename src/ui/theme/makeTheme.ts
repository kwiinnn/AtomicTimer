import { alpha, createTheme, lighten, type Components, type Theme } from '@mui/material/styles';
import type { UiStyle } from '../../core/settings';
import type { ResolvedTheme } from './resolve';
import { FLOAT_SELECTOR, PAPER, STYLE_TOKENS } from './styles';
import { layerCss } from './surface';

/**
 * Thin, neutral-grey scrollbars: no track, no arrow buttons.
 * Chrome and Safari use the ::-webkit-scrollbar pseudo-elements (finer control);
 * setting the standard properties there too would switch those off, so the
 * standard ones are only applied where the pseudo-elements don't exist (Firefox).
 */
function scrollbars(mode: 'light' | 'dark') {
  const grey = mode === 'dark' ? '255, 255, 255' : '0, 0, 0';
  const thumb = `rgba(${grey}, 0.2)`;
  const thumbHover = `rgba(${grey}, 0.35)`;
  return {
    '*::-webkit-scrollbar': { width: 8, height: 8, background: 'transparent' },
    '*::-webkit-scrollbar-track, *::-webkit-scrollbar-corner': { background: 'transparent' },
    '*::-webkit-scrollbar-button': { display: 'none' },
    // A 2px transparent border clipped away leaves a 4px pill inside the 8px gutter.
    '*::-webkit-scrollbar-thumb': { backgroundColor: thumb, backgroundClip: 'content-box', border: '2px solid transparent', borderRadius: 8 },
    '*::-webkit-scrollbar-thumb:hover': { backgroundColor: thumbHover },
    '@supports not selector(::-webkit-scrollbar)': {
      '*': { scrollbarWidth: 'thin', scrollbarColor: `${thumb} transparent` },
    },
  };
}

/** Glass-only global rules: no backdrop filters mid-solve, solid surfaces under reduced transparency. */
function glassGlobals(mode: 'light' | 'dark') {
  const off = { backdropFilter: 'none !important', WebkitBackdropFilter: 'none !important' };
  return {
    'body[data-timing="true"] *, body[data-timing="true"] *::before': off,
    '@media (prefers-reduced-transparency: reduce)': {
      [`${FLOAT_SELECTOR}, .MuiPaper-root`]: { ...off, backgroundColor: `${PAPER[mode]} !important`, backgroundImage: 'none !important' },
    },
  };
}

/** Buttons, chips, toggles and thumbs in the style's control shape. */
function controls(style: UiStyle, r: ResolvedTheme, primary: string): Components<Theme> {
  const control = STYLE_TOKENS[style].control;
  if (control === 'pill') {
    const thumb = { backgroundColor: alpha('#ffffff', 0.9), boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' };
    return {
      MuiButton: { styleOverrides: { root: { borderRadius: 999 }, contained: { boxShadow: `0 4px 16px ${alpha(primary, 0.35)}` } } },
      MuiToggleButton: { styleOverrides: { root: { borderRadius: 999 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 999 } } },
      MuiSwitch: { styleOverrides: { thumb } },
      MuiSlider: { styleOverrides: { thumb } },
    };
  }
  if (control === 'flat') {
    return {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { boxShadow: 'none' } } },
      MuiButtonBase: { defaultProps: { disableRipple: true } },
    };
  }
  if (control === 'outlined') {
    return {
      MuiButton: { styleOverrides: { contained: {
        backgroundColor: 'transparent', color: primary, border: `1px solid ${primary}`, boxShadow: 'none',
        '&:hover': { backgroundColor: alpha(primary, 0.08), boxShadow: 'none' },
      } } },
      MuiChip: { defaultProps: { variant: 'outlined' } },
    };
  }
  if (control === 'block') {
    const block = {
      borderRadius: 0, border: `2px solid ${r.ink}`, boxShadow: `4px 4px 0 ${r.ink}`,
      '&:hover': { boxShadow: `4px 4px 0 ${r.ink}` },
      '&:active': { boxShadow: 'none', transform: 'translate(4px, 4px)' },
    };
    return {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 0 }, contained: block, outlined: block } },
      MuiToggleButton: { styleOverrides: { root: { borderRadius: 0 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 0, border: `2px solid ${r.ink}` } } },
    };
  }
  return {};
}

/** Surface and control overrides for every style but Material (which keeps MUI's own look). */
function styled(style: UiStyle, r: ResolvedTheme, primary: string): Components<Theme> {
  const radius = STYLE_TOKENS[style].radius;
  return {
    MuiPaper: { styleOverrides: { root: layerCss(style, 'content', r) } },
    MuiDialog: { styleOverrides: { paper: layerCss(style, 'overlay', r) } },
    MuiPopover: { styleOverrides: { paper: layerCss(style, 'overlay', r) } },
    MuiDrawer: { styleOverrides: { paper: layerCss(style, 'overlay', r, { radius: `0 ${radius}px ${radius}px 0` }) } },
    MuiSnackbarContent: { styleOverrides: { root: layerCss(style, 'overlay', r) } },
    ...controls(style, r, primary),
    ...(style === 'glass' ? glassTabs(r) : {}),
  };
}

/** Glass phone tab strip: a floating inset pill, the selected tab a brighter capsule inside it. Same place and order. */
function glassTabs(r: ResolvedTheme): Components<Theme> {
  return {
    MuiTabs: {
      styleOverrides: {
        root: { ...layerCss('glass', 'float', r, { radius: 999 }), margin: '8px 12px', minHeight: 44 },
        indicator: { height: 'calc(100% - 8px)', top: 4, borderRadius: 999, backgroundColor: alpha(r.ink, 0.14), zIndex: 0 },
      },
    },
    MuiTab: { styleOverrides: { root: { zIndex: 1, minHeight: 44 } } },
  };
}

/** MUI theme from the resolved colours, the app font stack and the surface style. */
export function makeTheme(r: ResolvedTheme, fontFamily: string, uiStyle: UiStyle = 'material'): Theme {
  const { mode } = r;
  const p = { primary: r.primary, secondary: r.secondary };
  const primary = mode === 'dark' ? lighten(p.primary, 0.45) : p.primary;
  const material = uiStyle === 'material';
  return createTheme({
    palette: {
      mode,
      // Dark mode lifts primary for text/buttons on dark surfaces; the toolbar keeps the palette colour.
      primary: { main: primary },
      secondary: { main: p.secondary },
      background: { default: r.stops[0], paper: PAPER[mode] },
      text: { primary: r.ink },
    },
    typography: { fontFamily },
    shape: { borderRadius: STYLE_TOKENS[uiStyle].unit },
    uiStyle,
    resolved: r,
    components: {
      MuiCssBaseline: { styleOverrides: { ...scrollbars(mode), ...(uiStyle === 'glass' ? glassGlobals(mode) : {}) } },
      // The toolbar floats on the theme gradient.
      MuiAppBar: {
        defaultProps: { color: 'transparent', enableColorOnDark: true, elevation: 0 },
        styleOverrides: {
          root: material
            ? { backgroundColor: 'transparent', color: r.ink, borderBottom: `1px solid ${alpha(r.ink, 0.12)}` }
            : { ...layerCss(uiStyle, 'float', r, { edge: 'bottom' }), color: r.ink },
        },
      },
      ...(material ? {} : styled(uiStyle, r, primary)),
    },
  });
}
