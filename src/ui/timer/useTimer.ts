import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Penalty } from '../../core/model';
import { initialTimerState, step, type TimerConfig, type TimerEvent, type TimerState } from '../../core/timer/machine';
import { keyToTimerEvent, pointerToTimerEvent } from './inputMap';

export interface TimerHandlers {
  onStarted(): void;
  onFinished(timeMs: number, penalty: Penalty, input: 'keyboard' | 'touch'): void;
  onCancelled(): void;
  onAlert(second: 8 | 12): void;
  /** Called every animation frame while the timer is active, with the state and current time. */
  onFrame(state: TimerState, now: number): void;
}

const ACTIVE = new Set<TimerState['kind']>(['inspecting', 'holding', 'ready', 'running']);
const stamp = (e: { timeStamp: number }) => (e.timeStamp > 0 ? e.timeStamp : performance.now());

/** Drives the core timer machine from keyboard (window) and pointer (returned handlers) input. */
export function useTimer(cfg: TimerConfig, handlers: TimerHandlers, enabled: boolean) {
  const [state, setState] = useState<TimerState>(initialTimerState);
  const stateRef = useRef(state);
  const cfgRef = useRef(cfg);
  const handlersRef = useRef(handlers);
  const inputRef = useRef<'keyboard' | 'touch'>('keyboard');
  useEffect(() => {
    cfgRef.current = cfg;
    handlersRef.current = handlers;
  });

  const dispatch = useCallback((e: TimerEvent) => {
    const r = step(stateRef.current, e, cfgRef.current);
    if (r.state !== stateRef.current) {
      stateRef.current = r.state;
      setState(r.state);
    }
    for (const fx of r.effects) {
      const h = handlersRef.current;
      if (fx.type === 'started') h.onStarted();
      else if (fx.type === 'finished') h.onFinished(fx.timeMs, fx.penalty, inputRef.current);
      else if (fx.type === 'cancelled') h.onCancelled();
      else h.onAlert(fx.second);
    }
  }, []);

  // Keyboard + focus loss.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const ev = keyToTimerEvent(
        { type: e.type as 'keydown' | 'keyup', key: e.key, repeat: e.repeat, target: e.target },
        stateRef.current,
        stamp(e),
      );
      // Space must never scroll the page or click a focused button, even when held (repeat).
      if (e.key === ' ' && !(e.target instanceof Element && e.target.closest('input, textarea, [role="dialog"]'))) e.preventDefault();
      if (!ev) return;
      if (ev.type === 'cancel' && (stateRef.current.kind === 'idle' || stateRef.current.kind === 'stopped')) return;
      e.preventDefault();
      if (ev.type === 'press') inputRef.current = 'keyboard';
      dispatch(ev);
    };
    const onBlur = () => dispatch({ type: 'blur' });
    const onVisibility = () => document.visibilityState === 'hidden' && onBlur();
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, dispatch]);

  // Animation loop while active: feeds ticks (hold delay, inspection) and lets the display paint.
  useEffect(() => {
    if (!ACTIVE.has(state.kind)) return;
    let raf = 0;
    const frame = () => {
      const now = performance.now();
      dispatch({ type: 'tick', at: now });
      handlersRef.current.onFrame(stateRef.current, now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [state.kind, dispatch]);

  const onPointer = useCallback(
    (e: ReactPointerEvent) => {
      if (!enabled) return;
      const ev = pointerToTimerEvent(
        { type: e.type as 'pointerdown' | 'pointerup' | 'pointercancel', isPrimary: e.isPrimary, button: e.button, target: e.target },
        stamp(e),
      );
      if (!ev) return;
      if (ev.type === 'press') inputRef.current = 'touch';
      dispatch(ev);
    },
    [enabled, dispatch],
  );

  return {
    state,
    pointerHandlers: { onPointerDown: onPointer, onPointerUp: onPointer, onPointerCancel: onPointer },
    cancel: () => dispatch({ type: 'cancel' }),
  };
}
