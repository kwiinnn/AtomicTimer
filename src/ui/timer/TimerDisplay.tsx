import Box from '@mui/material/Box';
import { forwardRef } from 'react';
import type { TimerState } from '../../core/timer/machine';

// Theme-resolved colours that stay readable on every gradient (see theme/resolve.ts).
const COLORS: Partial<Record<TimerState['kind'], string>> = {
  holding: 'var(--timer-holding)',
  ready: 'var(--timer-ready)',
};

/**
 * The big time. Its text is written imperatively (no React children) so it can update every frame.
 * In `focus` (hold turned green, inspecting, running) it covers the screen with the time centred.
 */
export const TimerDisplay = forwardRef<HTMLDivElement, { kind: TimerState['kind']; inspecting: boolean; scale: number; focus: boolean }>(
  function TimerDisplay({ kind, inspecting, scale, focus }, ref) {
    const color = (inspecting && (kind === 'holding' || kind === 'ready') ? COLORS[kind] : COLORS[kind]) ?? 'text.primary';
    return (
      <Box
        ref={ref}
        data-testid="timer-display"
        data-state={kind}
        data-focus={String(focus)}
        aria-live="off"
        sx={{
          ...(focus && {
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.appBar + 1,
            background: 'var(--app-background)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
          fontFamily: 'var(--timer-font)',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          fontSize: `calc(clamp(3.5rem, 16vw, ${focus ? '12rem' : '9rem'}) * ${scale})`,
          lineHeight: 1,
          color,
          userSelect: 'none',
          textAlign: 'center',
          transition: 'color 80ms',
        }}
      />
    );
  },
);
