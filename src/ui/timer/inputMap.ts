import type { TimerEvent, TimerState } from '../../core/timer/machine';
import { inputBlocked } from '../hooks/keyboard';

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
  if (e.repeat) return null;
  // A running solve can always be stopped; everything else yields to text fields and open menus/dialogs.
  if (state.kind === 'running' && e.type === 'keydown' && e.key !== 'Escape') return { type: 'press', at };
  if (inputBlocked(e.target)) return null;
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

/**
 * Pointer input for the timer pane. A release only counts when this gate accepted the matching press,
 * so taps on buttons, scramble box or dialogs (whose events bubble through React portals) never reach the timer.
 */
export function createPointerGate() {
  let pressed = false;
  return (e: PointerInput, pane: Element, at: number): TimerEvent | null => {
    if (e.type === 'pointercancel') {
      const was = pressed;
      pressed = false;
      return was ? { type: 'blur' } : null;
    }
    if (e.type === 'pointerup') {
      if (!pressed || !e.isPrimary) return null;
      pressed = false;
      return { type: 'release', at };
    }
    if (!(e.target instanceof Node) || !pane.contains(e.target)) return null;
    const ev = pointerToTimerEvent(e, at);
    if (ev?.type === 'press') pressed = true;
    return ev;
  };
}
