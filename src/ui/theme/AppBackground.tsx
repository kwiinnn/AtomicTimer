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

/** The full background stack: a theme-coloured dim over the user's image (if any), over the gradient. */
export function backgroundCss(r: { gradient: string; stops: [string, string]; angle: number }, image: { url: string; dim: number } | null): string {
  if (!image) return r.gradient;
  const dim = `linear-gradient(${r.angle}deg, ${rgba(r.stops[0], image.dim)}, ${rgba(r.stops[1], image.dim)})`;
  return `${dim}, url("${image.url}"), ${r.gradient}`;
}

/** CSS variables carrying the resolved theme to plain-CSS consumers. */
export function themeVars(
  r: { gradient: string; stops: [string, string]; angle: number; holding: string; ready: string; ink: string },
  image: { url: string; dim: number } | null = null,
  timerFont = '"Quicksand", system-ui, sans-serif',
) {
  return {
    ':root': {
      '--app-background': backgroundCss(r, image),
      '--timer-holding': r.holding,
      '--timer-ready': r.ready,
      '--app-ink': r.ink,
      '--timer-font': timerFont,
    },
  };
}
