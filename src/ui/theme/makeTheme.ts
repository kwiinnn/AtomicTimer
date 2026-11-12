import { alpha, createTheme, lighten, type Theme } from '@mui/material/styles';
import type { ResolvedTheme } from './resolve';

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

/** MUI theme from the resolved colours and the app font stack. */
export function makeTheme(r: ResolvedTheme, fontFamily: string): Theme {
  const { mode } = r;
  const p = { primary: r.primary, secondary: r.secondary };
  return createTheme({
    palette: {
      mode,
      // Dark mode lifts primary for text/buttons on dark surfaces; the toolbar keeps the palette colour.
      primary: { main: mode === 'dark' ? lighten(p.primary, 0.45) : p.primary },
      secondary: { main: p.secondary },
      background: mode === 'dark' ? { default: r.stops[0], paper: '#1e1e1e' } : { default: r.stops[0], paper: '#ffffff' },
      text: { primary: r.ink },
    },
    typography: { fontFamily },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: { styleOverrides: scrollbars(mode) },
      // The toolbar floats on the theme gradient.
      MuiAppBar: {
        defaultProps: { color: 'transparent', enableColorOnDark: true, elevation: 0 },
        styleOverrides: { root: { backgroundColor: 'transparent', color: r.ink, borderBottom: `1px solid ${alpha(r.ink, 0.12)}` } },
      },
    },
  });
}
