import Box from '@mui/material/Box';

/** Fixed layer behind the whole app showing the theme background (`--app-background`). */
export function AppBackground() {
  return (
    <Box data-testid="app-background" aria-hidden
      sx={{ position: 'fixed', inset: 0, zIndex: -1, background: 'var(--app-background)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
  );
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Soft, still colour blobs from the palette, so Liquid Glass has something to refract when there is no photo. */
export function glassBlobs(r: { primary: string; secondary: string; stops: [string, string]; mode: 'light' | 'dark' }): string {
  const a = r.mode === 'dark' ? 0.55 : 0.35;
  const blobs: [string, string][] = [[r.primary, '15% 20%'], [r.secondary, '85% 15%'], [r.stops[1], '70% 85%'], [r.primary, '20% 80%']];
  return blobs.map(([c, at]) => `radial-gradient(circle at ${at}, ${rgba(c, a)} 0, transparent 45%)`).join(', ');
}

/** The full background stack: a theme-coloured dim over the user's image (if any), over the gradient. Blobs only show without a photo. */
export function backgroundCss(r: { gradient: string; stops: [string, string]; angle: number }, image: { url: string; dim: number } | null, blobs: string | null = null): string {
  if (!image) return blobs ? `${blobs}, ${r.gradient}` : r.gradient;
  const dim = `linear-gradient(${r.angle}deg, ${rgba(r.stops[0], image.dim)}, ${rgba(r.stops[1], image.dim)})`;
  return `${dim}, url("${image.url}"), ${r.gradient}`;
}

/** CSS variables carrying the resolved theme to plain-CSS consumers. */
export function themeVars(
  r: { gradient: string; stops: [string, string]; angle: number; holding: string; ready: string; ink: string },
  image: { url: string; dim: number } | null = null,
  timerFont = '"Quicksand", system-ui, sans-serif',
  blobs: string | null = null,
) {
  return {
    ':root': {
      '--app-background': backgroundCss(r, image, blobs),
      '--timer-holding': r.holding,
      '--timer-ready': r.ready,
      '--app-ink': r.ink,
      '--timer-font': timerFont,
    },
  };
}
