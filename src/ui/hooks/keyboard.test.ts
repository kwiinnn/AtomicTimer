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
