import type { PaletteId, Settings } from '../../core/settings';

/** Toolbar (primary) colours are dark enough for white text (WCAG AA). */
export const PALETTES: Record<PaletteId, { label: string; primary: string; secondary: string }> = {
  indigo: { label: 'Indigo', primary: '#3f51b5', secondary: '#ff4081' },
  teal: { label: 'Teal', primary: '#00796b', secondary: '#ffab40' },
  red: { label: 'Red', primary: '#c62828', secondary: '#448aff' },
  orange: { label: 'Orange', primary: '#bf360c', secondary: '#40c4ff' },
  green: { label: 'Green', primary: '#2e7d32', secondary: '#ff6e40' },
  purple: { label: 'Purple', primary: '#7b1fa2', secondary: '#69f0ae' },
  blueGrey: { label: 'Blue grey', primary: '#455a64', secondary: '#ffd740' },
  pink: { label: 'Pink', primary: '#ad1457', secondary: '#64ffda' },
  aurora: { label: 'Aurora', primary: '#00695c', secondary: '#b388ff' },
  sunset: { label: 'Sunset', primary: '#bf360c', secondary: '#ffd740' },
  ocean: { label: 'Ocean', primary: '#01579b', secondary: '#64ffda' },
  midnight: { label: 'Midnight', primary: '#283593', secondary: '#82b1ff' },
  forest: { label: 'Forest', primary: '#1b5e20', secondary: '#ffcc80' },
  candy: { label: 'Candy', primary: '#880e4f', secondary: '#80d8ff' },
  graphite: { label: 'Graphite', primary: '#37474f', secondary: '#ffab40' },
};

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Toolbar/primary colour for the selected theme (a preset's primary, or the custom accent). */
export function primaryOf(s: Pick<Settings, 'palette' | 'customTheme'>): string {
  return colorsOf(s).primary;
}

export function colorsOf(s: Pick<Settings, 'palette' | 'customTheme'>): { primary: string; secondary: string } {
  if (s.palette === 'custom') return { primary: s.customTheme.accent, secondary: s.customTheme.accent };
  const p = PALETTES[s.palette];
  return { primary: p.primary, secondary: p.secondary };
}
