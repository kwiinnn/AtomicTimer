import Box from '@mui/material/Box';
import { forwardRef } from 'react';
import type { TimerState } from '../../core/timer/machine';
import { TIMER_FONT } from '../theme/makeTheme';

const COLORS: Partial<Record<TimerState['kind'], string>> = {
  holding: 'error.main',
  ready: 'success.main',
  inspecting: 'warning.main',
};

/** The big time. Its text is written imperatively (no React children) so it can update every frame. */
export const TimerDisplay = forwardRef<HTMLDivElement, { kind: TimerState['kind']; inspecting: boolean; scale: number }>(
  function TimerDisplay({ kind, inspecting, scale }, ref) {
    const color = (inspecting && (kind === 'holding' || kind === 'ready') ? COLORS[kind] : COLORS[kind]) ?? 'text.primary';
    return (
      <Box
        ref={ref}
        data-testid="timer-display"
        data-state={kind}
        aria-live="off"
        sx={{
          fontFamily: TIMER_FONT,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          fontSize: `calc(clamp(3.5rem, 16vw, 9rem) * ${scale})`,
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
