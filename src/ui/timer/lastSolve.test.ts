import { expect, test } from 'vitest';
import type { Solve } from '../../core/model';
import { shortcutTarget } from './lastSolve';

const s = (id: string) => ({ id }) as Solve;

test('targets the solve just recorded in this view', () => {
  expect(shortcutTarget([s('a'), s('b')], { id: 'a' })?.id).toBe('a');
});
test('while the new solve is still being written, targets nothing (not the previous solve)', () => {
  expect(shortcutTarget([s('a'), s('b')], { id: null })).toBeNull();
});
test('with nothing recorded in this view, targets the newest solve', () => {
  expect(shortcutTarget([s('a'), s('b')], null)?.id).toBe('b');
  expect(shortcutTarget([], null)).toBeNull();
});
test('a recorded solve that was deleted elsewhere targets nothing', () => {
  expect(shortcutTarget([s('b')], { id: 'a' })).toBeNull();
});
