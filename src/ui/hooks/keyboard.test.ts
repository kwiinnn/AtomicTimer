// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { isTypingTarget } from './keyboard';

test('form fields and contenteditable are typing targets', () => {
  for (const tag of ['input', 'textarea', 'select']) expect(isTypingTarget(document.createElement(tag)), tag).toBe(true);
  const div = document.createElement('div');
  div.setAttribute('contenteditable', 'true');
  document.body.append(div);
  expect(isTypingTarget(div)).toBe(true);
});
test('anything inside a dialog counts', () => {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  const button = document.createElement('button');
  dialog.append(button);
  document.body.append(dialog);
  expect(isTypingTarget(button)).toBe(true);
});
test('body, buttons and null are not typing targets', () => {
  expect(isTypingTarget(document.body)).toBe(false);
  expect(isTypingTarget(document.createElement('button'))).toBe(false);
  expect(isTypingTarget(null)).toBe(false);
});

test('keys inside an open MUI menu, popover or modal are blocked; a closing one (focus restored) is not', async () => {
  const { inputBlocked } = await import('./keyboard');
  for (const cls of ['MuiModal-root', 'MuiPopover-root']) {
    const overlay = document.createElement('div');
    overlay.className = cls;
    const item = document.createElement('li');
    overlay.append(item);
    document.body.append(overlay);
    expect(inputBlocked(item), cls).toBe(true);
    expect(inputBlocked(document.body), `${cls} fading out, focus back on body`).toBe(false);
    overlay.remove();
  }
});
