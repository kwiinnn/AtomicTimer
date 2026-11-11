import { expect, test } from 'vitest';
import type { Solve } from '../../core/model';
import type { ScrambleService } from '../../platform/scramble';
import { createSolveRecorder, SaveError } from './solveRecorder';

function setup(scrambles: ScrambleService) {
  const saved: Solve[] = [];
  let id = 0;
  const rec = createSolveRecorder({ scrambles, save: async s => void saved.push(s), newId: () => `s${id++}`, now: () => 1000 });
  return { rec, saved };
}
const queue = (...values: string[]): ScrambleService => ({ next: async () => values.shift() ?? 'Z', prefetch: () => {} });

test('solve keeps the scramble shown at start, not the next one', async () => {
  const { rec, saved } = setup(queue('A', 'B', 'C'));
  await rec.load('333');
  expect(rec.current()).toBe('A');
  rec.onStarted();
  await rec.load('333');
  expect(rec.current()).toBe('B');
  const solve = await rec.onFinished('sess', 9000, 'none', 'keyboard');
  expect(solve).toMatchObject({ scramble: 'A', sessionId: 'sess', timeMs: 9000, penalty: 'none', source: 'keyboard', createdAt: 1000, comment: '' });
  expect(saved).toEqual([solve]);
});
test('finishing loads the next scramble for the same puzzle', async () => {
  const { rec } = setup(queue('A', 'B'));
  await rec.load('222');
  rec.onStarted();
  await rec.onFinished('sess', 1, 'none', 'touch');
  await new Promise(r => setTimeout(r, 0));
  expect(rec.current()).toBe('B');
});
test('solve before the first scramble resolves saves an empty scramble', async () => {
  const { rec } = setup({ next: () => new Promise(() => {}), prefetch: () => {} });
  void rec.load('sq1');
  rec.onStarted();
  expect((await rec.onFinished('sess', 1, 'none', 'keyboard')).scramble).toBe('');
});
test('manual entry without onStarted uses the current scramble', async () => {
  const { rec } = setup(queue('A', 'B'));
  await rec.load('333');
  expect((await rec.onFinished('sess', 1, 'plus2', 'manual')).scramble).toBe('A');
});
test('a stale load does not overwrite a newer puzzle', async () => {
  let resolveSlow: (s: string) => void = () => {};
  const scrambles: ScrambleService = {
    next: p => (p === '777' ? new Promise(r => { resolveSlow = r; }) : Promise.resolve('fast')),
    prefetch: () => {},
  };
  const { rec } = setup(scrambles);
  const slow = rec.load('777');
  await rec.load('222');
  resolveSlow('slow');
  await slow;
  expect(rec.current()).toBe('fast');
});
test('subscribers are notified on change', async () => {
  const { rec } = setup(queue('A'));
  let calls = 0;
  const off = rec.subscribe(() => calls++);
  await rec.load('333');
  off();
  expect(calls).toBeGreaterThan(0);
});

test('a scramble that arrives mid-solve was never shown, so it is not stored', async () => {
  let resolve: (s: string) => void = () => {};
  const { rec } = setup({ next: () => new Promise(r => { resolve = r; }), prefetch: () => {} });
  const loading = rec.load('sq1');
  rec.onStarted();
  resolve('LATE');
  await loading;
  expect(rec.current()).toBe('LATE');
  expect((await rec.onFinished('sess', 1, 'none', 'keyboard')).scramble).toBe('');
});
test('a failed save rejects with the unsaved solve and keeps the scramble', async () => {
  let id = 0;
  const rec = createSolveRecorder({
    scrambles: queue('A', 'B'),
    save: async () => { throw new Error('QuotaExceededError'); },
    newId: () => `s${id++}`,
    now: () => 5,
  });
  await rec.load('333');
  rec.onStarted();
  const err = await rec.onFinished('sess', 1234, 'none', 'keyboard').catch((e: unknown) => e);
  expect(err).toBeInstanceOf(SaveError);
  expect((err as SaveError).solve).toMatchObject({ timeMs: 1234, scramble: 'A', sessionId: 'sess' });
  expect(rec.current()).toBe('A');
});
