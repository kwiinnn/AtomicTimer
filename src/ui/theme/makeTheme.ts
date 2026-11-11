import { createTheme, lighten, type Theme } from '@mui/material/styles';
import type { PaletteId } from '../../core/settings';
import { PALETTES } from './palettes';

export const TIMER_FONT = '"Quicksand", system-ui, sans-serif';

export function makeTheme(mode: 'light' | 'dark', palette: PaletteId): Theme {
  const p = PALETTES[palette];
  return createTheme({
    palette: {
      mode,
      // Dark mode lifts primary for text/buttons on dark surfaces; the toolbar keeps the palette colour.
      primary: { main: mode === 'dark' ? lighten(p.primary, 0.45) : p.primary },
      secondary: { main: p.secondary },
      background: mode === 'dark' ? { default: '#121212', paper: '#1e1e1e' } : { default: '#f5f5f5', paper: '#ffffff' },
    },
    typography: { fontFamily: TIMER_FONT },
    shape: { borderRadius: 8 },
    components: {
      // Material 2 look: solid primary toolbar in both modes.
      MuiAppBar: {
        defaultProps: { color: 'primary', enableColorOnDark: true, elevation: 2 },
        styleOverrides: { root: { backgroundColor: p.primary, color: '#fff' } },
      },
    },
  });
}
