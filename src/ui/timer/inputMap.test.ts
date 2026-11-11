// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import type { TimerState } from '../../core/timer/machine';
import { keyToTimerEvent, pointerToTimerEvent } from './inputMap';

const idle: TimerState = { kind: 'idle' };
const running: TimerState = { kind: 'running', startedAt: 0, penalty: 'none' };
const stopped: TimerState = { kind: 'stopped', timeMs: 5, penalty: 'none' };
const key = (type: 'keydown' | 'keyup', k: string, extra: Partial<{ repeat: boolean; target: EventTarget | null }> = {}) =>
  ({ type, key: k, repeat: false, target: null, ...extra });

describe('keyboard', () => {
  test('auto-repeat ignored', () => expect(keyToTimerEvent(key('keydown', ' ', { repeat: true }), idle, 0)).toBeNull());
  test('typing target ignored', () => {
    const i = document.createElement('input');
    expect(keyToTimerEvent(key('keydown', ' ', { target: i }), idle, 0)).toBeNull();
    expect(keyToTimerEvent(key('keyup', ' ', { target: i }), idle, 0)).toBeNull();
  });
  test('space press/release', () => {
    expect(keyToTimerEvent(key('keydown', ' '), idle, 7)).toEqual({ type: 'press', at: 7 });
    expect(keyToTimerEvent(key('keyup', ' '), idle, 9)).toEqual({ type: 'release', at: 9 });
  });
  test('any key stops only while running', () => {
    expect(keyToTimerEvent(key('keydown', 'a'), running, 3)).toEqual({ type: 'press', at: 3 });
    expect(keyToTimerEvent(key('keydown', 'a'), idle, 3)).toBeNull();
  });
  test('releasing the key that stopped the timer returns to idle', () => {
    expect(keyToTimerEvent(key('keyup', 'a'), stopped, 4)).toEqual({ type: 'release', at: 4 });
    expect(keyToTimerEvent(key('keyup', 'a'), idle, 4)).toBeNull();
  });
  test('escape cancels', () => expect(keyToTimerEvent(key('keydown', 'Escape'), running, 0)).toEqual({ type: 'cancel' }));
});

describe('pointer', () => {
  const div = () => document.createElement('div');
  test('primary press/release', () => {
    expect(pointerToTimerEvent({ type: 'pointerdown', isPrimary: true, button: 0, target: div() }, 5)).toEqual({ type: 'press', at: 5 });
    expect(pointerToTimerEvent({ type: 'pointerup', isPrimary: true, button: 0, target: div() }, 6)).toEqual({ type: 'release', at: 6 });
  });
  test('non-primary pointer ignored', () => {
    expect(pointerToTimerEvent({ type: 'pointerdown', isPrimary: false, button: 0, target: div() }, 0)).toBeNull();
  });
  test('right mouse button ignored', () => {
    expect(pointerToTimerEvent({ type: 'pointerdown', isPrimary: true, button: 2, target: div() }, 0)).toBeNull();
  });
  test('cancel becomes blur', () => {
    expect(pointerToTimerEvent({ type: 'pointercancel', isPrimary: true, button: 0, target: div() }, 0)).toEqual({ type: 'blur' });
  });
  test('presses on buttons and [data-no-timer] areas are ignored', () => {
    const area = div();
    area.dataset.noTimer = '';
    const inner = div();
    area.append(inner);
    expect(pointerToTimerEvent({ type: 'pointerdown', isPrimary: true, button: 0, target: inner }, 0)).toBeNull();
    expect(pointerToTimerEvent({ type: 'pointerdown', isPrimary: true, button: 0, target: document.createElement('button') }, 0)).toBeNull();
  });
});
