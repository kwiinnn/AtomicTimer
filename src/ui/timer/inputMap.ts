import type { TimerEvent, TimerState } from '../../core/timer/machine';
import { isTypingTarget } from '../hooks/keyboard';

export interface KeyInput {
  type: 'keydown' | 'keyup';
  key: string;
  repeat: boolean;
  target: EventTarget | null;
}

export interface PointerInput {
  type: 'pointerdown' | 'pointerup' | 'pointercancel';
  isPrimary: boolean;
  button: number;
  target: EventTarget | null;
}

export function keyToTimerEvent(e: KeyInput, state: TimerState, at: number): TimerEvent | null {
  if (e.repeat || isTypingTarget(e.target)) return null;
  if (e.key === 'Escape') return e.type === 'keydown' ? { type: 'cancel' } : null;
  if (e.type === 'keydown') {
    if (state.kind === 'running') return { type: 'press', at };
    return e.key === ' ' ? { type: 'press', at } : null;
  }
  if (e.key === ' ' || state.kind === 'stopped') return { type: 'release', at };
  return null;
}

const NON_TIMER = 'button, a, input, textarea, select, [role="button"], [data-no-timer]';

export function pointerToTimerEvent(e: PointerInput, at: number): TimerEvent | null {
  if (!e.isPrimary) return null;
  if (e.type === 'pointercancel') return { type: 'blur' };
  if (e.type === 'pointerdown') {
    if (e.button !== 0) return null;
    if (e.target instanceof Element && e.target.closest(NON_TIMER)) return null;
    return { type: 'press', at };
  }
  return { type: 'release', at };
}
