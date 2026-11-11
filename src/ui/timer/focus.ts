import type { TimerState } from '../../core/timer/machine';

/** Full-screen focus view: from the moment the hold turns green (or inspection starts) until the solve stops. */
export function isFocus(s: TimerState): boolean {
  return s.kind === 'ready' || s.kind === 'running' || s.kind === 'inspecting' || (s.kind === 'holding' && s.insp !== null);
}
