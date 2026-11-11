import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import type { Session, Solve } from '../../core/model';
import { DEFAULT_SETTINGS } from '../../core/settings';
import { createDexieStorage } from './dexie';

let n = 0;
const db = () => createDexieStorage(`test-${n++}`);
const session = (id: string, order: number): Session => ({ id, name: id, puzzle: '333', order, createdAt: 0 });
const solve = (id: string, sessionId: string, createdAt: number): Solve =>
  ({ id, sessionId, timeMs: 1000, penalty: 'none', scramble: 'R', createdAt, comment: '', source: 'keyboard' });

test('listSessions sorts by order', async () => {
  const s = db();
  await s.putSession(session('b', 2));
  await s.putSession(session('a', 1));
  expect((await s.listSessions()).map(x => x.id)).toEqual(['a', 'b']);
});
test('listSolves is ascending by createdAt and scoped to session', async () => {
  const s = db();
  await s.putSolve(solve('2', 'x', 200));
  await s.putSolve(solve('1', 'x', 100));
  await s.putSolve(solve('3', 'y', 50));
  expect((await s.listSolves('x')).map(x => x.id)).toEqual(['1', '2']);
});
test('deleteSolve returns the solve and putting it back restores it', async () => {
  const s = db();
  await s.putSolve(solve('1', 'x', 1));
  const removed = await s.deleteSolve('1');
  expect(removed?.id).toBe('1');
  expect(await s.listSolves('x')).toEqual([]);
  await s.putSolve(removed!);
  expect(await s.listSolves('x')).toHaveLength(1);
  expect(await s.deleteSolve('nope')).toBeUndefined();
});
test('deleteSession cascades', async () => {
  const s = db();
  await s.putSession(session('x', 0));
  await s.putSolve(solve('1', 'x', 1));
  await s.deleteSession('x');
  expect(await s.listSolves('x')).toEqual([]);
  expect(await s.listSessions()).toEqual([]);
});
test('bulkImport writes 3 sessions and 1000 solves', async () => {
  const s = db();
  const sessions = [0, 1, 2].map(i => session(`s${i}`, i));
  const solves = Array.from({ length: 1000 }, (_, i) => solve(`${i}`, `s${i % 3}`, i));
  await s.bulkImport(sessions, solves);
  expect(await s.listSessions()).toHaveLength(3);
  expect((await s.exportAll()).solves).toHaveLength(1000);
});
test('bulkImport is atomic: a duplicate id rolls back everything', async () => {
  const s = db();
  await s.putSolve(solve('dup', 'x', 1));
  await expect(s.bulkImport([session('n', 0)], [solve('a', 'n', 1), solve('dup', 'n', 2)])).rejects.toThrow();
  expect(await s.listSessions()).toEqual([]);
  expect(await s.listSolves('n')).toEqual([]);
});
test('settings default then round trip', async () => {
  const s = db();
  expect(await s.getSettings()).toEqual(DEFAULT_SETTINGS);
  await s.putSettings({ ...DEFAULT_SETTINGS, holdMs: 0 });
  expect((await s.getSettings()).holdMs).toBe(0);
});
