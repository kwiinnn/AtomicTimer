import type { UiStyle } from '../../core/settings';
import type { ResolvedTheme } from './resolve';

declare module '@mui/material/styles' {
  interface Theme {
    uiStyle: UiStyle;
    resolved: ResolvedTheme;
  }
  interface ThemeOptions {
    uiStyle?: UiStyle;
    resolved?: ResolvedTheme;
  }
}
