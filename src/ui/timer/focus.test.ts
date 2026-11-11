import { expect, test } from 'vitest';
import type { TimerState } from '../../core/timer/machine';
import { isFocus } from './focus';

const insp = { startedAt: 0, alerted: [] as (8 | 12)[] };

test('focus view starts when the hold turns green, not on a short press', () => {
  expect(isFocus({ kind: 'holding', since: 0, insp: null })).toBe(false);
  expect(isFocus({ kind: 'ready', since: 0, insp: null })).toBe(true);
  expect(isFocus({ kind: 'running', startedAt: 0, penalty: 'none' })).toBe(true);
});
test('focus view covers inspection, including a hold during inspection', () => {
  expect(isFocus({ kind: 'inspecting', insp })).toBe(true);
  expect(isFocus({ kind: 'holding', since: 0, insp })).toBe(true);
});
test('no focus view at rest', () => {
  const rest: TimerState[] = [{ kind: 'idle' }, { kind: 'stopped', timeMs: 1, penalty: 'none' }];
  for (const s of rest) expect(isFocus(s)).toBe(false);
});
