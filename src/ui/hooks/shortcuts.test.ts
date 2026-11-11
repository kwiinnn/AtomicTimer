// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { keyToShortcut } from './shortcuts';

const k = (key: string, extra: Partial<{ repeat: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean; target: EventTarget | null }> = {}) =>
  ({ key, repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: null, ...extra });

test('key map', () => {
  const map: Record<string, string> = {
    '2': 'plus2', d: 'dnf', D: 'dnf', c: 'comment', C: 'comment', Delete: 'deleteLast',
    n: 'nextScramble', N: 'nextScramble', ArrowRight: 'nextScramble', p: 'puzzlePicker', P: 'puzzlePicker',
    s: 'sessionPicker', S: 'sessionPicker', '?': 'help',
  };
  for (const [key, action] of Object.entries(map)) expect(keyToShortcut(k(key), false), key).toBe(action);
  expect(keyToShortcut(k('x'), false)).toBeNull();
  expect(keyToShortcut(k(' '), false)).toBeNull();
});
test('nothing while the timer is busy', () => expect(keyToShortcut(k('2'), true)).toBeNull());
test('auto-repeat ignored', () => expect(keyToShortcut(k('n', { repeat: true }), false)).toBeNull());
test('modifier chords are left to the browser', () => {
  expect(keyToShortcut(k('2', { ctrlKey: true }), false)).toBeNull();
  expect(keyToShortcut(k('s', { metaKey: true }), false)).toBeNull();
  expect(keyToShortcut(k('d', { altKey: true }), false)).toBeNull();
});
test('typing targets ignored', () => {
  expect(keyToShortcut(k('d', { target: document.createElement('textarea') }), false)).toBeNull();
});

test('shortcuts are ignored while a menu is open', () => {
  const overlay = document.createElement('div');
  overlay.className = 'MuiPopover-root';
  const item = document.createElement('li');
  overlay.append(item);
  document.body.append(overlay);
  expect(keyToShortcut(k('d', { target: item }), false)).toBeNull();
  overlay.remove();
});
