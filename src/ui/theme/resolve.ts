import type { PaletteId, Settings } from '../../core/settings';
import { colorsOf, contrastRatio } from './palettes';

type Stops = [string, string];

/** Original gradient presets: pale tints for light mode, deep shades for dark mode. */
export const PRESET_GRADIENTS: Record<PaletteId, { light: Stops; dark: Stops; angle: number }> = {
  indigo: { light: ['#e8eaf6', '#ede7f6'], dark: ['#1a237e', '#4a148c'], angle: 135 },
  teal: { light: ['#e0f2f1', '#e1f5fe'], dark: ['#004d40', '#01579b'], angle: 135 },
  red: { light: ['#ffebee', '#fff3e0'], dark: ['#7f1d1d', '#3e2723'], angle: 135 },
  orange: { light: ['#fff3e0', '#fbe9e7'], dark: ['#8a3a10', '#4e342e'], angle: 135 },
  green: { light: ['#e8f5e9', '#f1f8e9'], dark: ['#1b5e20', '#004d40'], angle: 135 },
  purple: { light: ['#f3e5f5', '#ede7f6'], dark: ['#4a148c', '#311b92'], angle: 135 },
  blueGrey: { light: ['#eceff1', '#e3f2fd'], dark: ['#263238', '#37474f'], angle: 135 },
  pink: { light: ['#fce4ec', '#f3e5f5'], dark: ['#880e4f', '#4a148c'], angle: 135 },
  aurora: { light: ['#e0f7fa', '#ede7f6'], dark: ['#004d40', '#311b92'], angle: 160 },
  sunset: { light: ['#fff8e1', '#fce4ec'], dark: ['#7a1f2b', '#4a1942'], angle: 160 },
  ocean: { light: ['#e1f5fe', '#e0f2f1'], dark: ['#01579b', '#002f6c'], angle: 180 },
  midnight: { light: ['#e8eaf6', '#eceff1'], dark: ['#0d1b3e', '#1a1a2e'], angle: 180 },
  forest: { light: ['#f1f8e9', '#efebe9'], dark: ['#1b5e20', '#2d2a24'], angle: 160 },
  candy: { light: ['#fce4ec', '#e1f5fe'], dark: ['#880e4f', '#0d47a1'], angle: 120 },
  graphite: { light: ['#f5f5f5', '#e0e0e0'], dark: ['#121212', '#2b2b2b'], angle: 180 },
};

const INK = { light: '#1f1f1f', dark: '#ffffff' } as const;
// Timer state colours chosen to read on every preset (>= 3:1, large text).
const STATE = {
  light: { holding: '#b71c1c', ready: '#1b5e20' },
  dark: { holding: '#ffab91', ready: '#b9f6ca' },
} as const;

export interface ResolvedTheme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  stops: Stops;
  angle: number;
  /** CSS linear-gradient for the app background. */
  gradient: string;
  /** Text colour on the gradient. */
  ink: string;
  holding: string;
  ready: string;
}

const minContrast = (ink: string, stops: Stops) => Math.min(...stops.map(s => contrastRatio(ink, s)));

export function resolveTheme(s: Pick<Settings, 'palette' | 'customTheme' | 'themeMode'>, systemDark: boolean): ResolvedTheme {
  const { primary, secondary } = colorsOf(s);
  let mode: 'light' | 'dark';
  let stops: Stops;
  let angle: number;
  if (s.palette === 'custom') {
    stops = [s.customTheme.from, s.customTheme.to];
    angle = s.customTheme.angle;
    // The user's colours decide: use whichever text colour reads better on them.
    mode = minContrast(INK.dark, stops) >= minContrast(INK.light, stops) ? 'dark' : 'light';
  } else {
    mode = s.themeMode === 'system' ? (systemDark ? 'dark' : 'light') : s.themeMode;
    const preset = PRESET_GRADIENTS[s.palette];
    stops = preset[mode];
    angle = preset.angle;
  }
  return {
    mode,
    primary,
    secondary,
    stops,
    angle,
    gradient: `linear-gradient(${angle}deg, ${stops[0]}, ${stops[1]})`,
    ink: INK[mode],
    ...STATE[mode],
  };
}
