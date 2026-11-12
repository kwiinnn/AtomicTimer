import { alpha, createTheme, lighten, type Theme } from '@mui/material/styles';
import type { ResolvedTheme } from './resolve';

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
      // The toolbar floats on the theme gradient.
      MuiAppBar: {
        defaultProps: { color: 'transparent', enableColorOnDark: true, elevation: 0 },
        styleOverrides: { root: { backgroundColor: 'transparent', color: r.ink, borderBottom: `1px solid ${alpha(r.ink, 0.12)}` } },
      },
    },
  });
}
