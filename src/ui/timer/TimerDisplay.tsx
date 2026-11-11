import Box from '@mui/material/Box';
import { forwardRef } from 'react';
import type { TimerState } from '../../core/timer/machine';
import { TIMER_FONT } from '../theme/makeTheme';

const COLORS: Partial<Record<TimerState['kind'], string>> = {
  holding: 'error.main',
  ready: 'success.main',
  inspecting: 'warning.main',
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
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
          fontFamily: TIMER_FONT,
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
