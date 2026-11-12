import Box from '@mui/material/Box';

/** Fixed layer behind the whole app showing the theme background (`--app-background`). */
export function AppBackground() {
  return (
    <Box data-testid="app-background" aria-hidden
      sx={{ position: 'fixed', inset: 0, zIndex: -1, background: 'var(--app-background)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
  );
}

/** CSS variables carrying the resolved theme to plain-CSS consumers. */
export function themeVars(r: { gradient: string; holding: string; ready: string; ink: string }) {
  return {
    ':root': {
      '--app-background': r.gradient,
      '--timer-holding': r.holding,
      '--timer-ready': r.ready,
      '--app-ink': r.ink,
    },
  };
}
