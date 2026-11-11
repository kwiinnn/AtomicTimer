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

describe('pointer gate (only releases that follow an accepted press)', () => {
  const pane = document.createElement('div');
  const inside = document.createElement('div');
  const button = document.createElement('button');
  pane.append(inside, button);
  const outside = document.createElement('div');
  const ev = (type: 'pointerdown' | 'pointerup', target: Element) => ({ type, isPrimary: true, button: 0, target });

  test('a tap on a button inside the pane never reaches the timer', async () => {
    const { createPointerGate } = await import('./inputMap');
    const gate = createPointerGate();
    expect(gate(ev('pointerdown', button), pane, 1)).toBeNull();
    expect(gate(ev('pointerup', button), pane, 2)).toBeNull();
  });
  test('portal-bubbled events from outside the pane are ignored', async () => {
    const { createPointerGate } = await import('./inputMap');
    const gate = createPointerGate();
    expect(gate(ev('pointerdown', outside), pane, 1)).toBeNull();
    expect(gate(ev('pointerup', outside), pane, 2)).toBeNull();
  });
  test('press then release on the pane goes through, once', async () => {
    const { createPointerGate } = await import('./inputMap');
    const gate = createPointerGate();
    expect(gate(ev('pointerdown', inside), pane, 1)).toEqual({ type: 'press', at: 1 });
    expect(gate(ev('pointerup', inside), pane, 2)).toEqual({ type: 'release', at: 2 });
    expect(gate(ev('pointerup', inside), pane, 3)).toBeNull();
  });
});

test('keys are ignored while an overlay (menu/select popover) is open', () => {
  const overlay = document.createElement('div');
  overlay.className = 'MuiPopover-root';
  document.body.append(overlay);
  const item = document.createElement('li');
  overlay.append(item);
  expect(keyToTimerEvent(key('keydown', ' ', { target: item }), idle, 0)).toBeNull();
  overlay.remove();
});
