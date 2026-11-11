import { expect, test } from 'vitest';
import type { Session, Solve } from '../model';
import { DEFAULT_SETTINGS } from '../settings';
import { parseBackupJson, toBackupJson } from './backup';
import { mergeImport } from './merge';
import { ImportError } from './types';

const sessions: Session[] = [
  { id: 'a', name: 'Main', puzzle: '333', order: 0, createdAt: 1 },
  { id: 'b', name: 'OH', puzzle: '333oh', order: 1, createdAt: 2 },
];
const solves: Solve[] = [
  { id: '1', sessionId: 'a', timeMs: 12340, penalty: 'none', scramble: 'R U', createdAt: 100, comment: 'hi', source: 'keyboard' },
  { id: '2', sessionId: 'b', timeMs: 20000, penalty: 'plus2', scramble: 'F', createdAt: 200, comment: '', source: 'touch' },
  { id: '3', sessionId: 'b', timeMs: 0, penalty: 'dnf', scramble: '', createdAt: 300, comment: '', source: 'manual' },
];

test('round trip into an empty database reproduces the data', () => {
  const batch = parseBackupJson(toBackupJson({ sessions, solves, settings: DEFAULT_SETTINGS }, 999));
  let id = 0;
  const r = mergeImport({ sessions: [], solves: [] }, batch, () => `n${id++}`);
  expect(r.sessions.map(s => [s.name, s.puzzle, s.order])).toEqual([['Main', '333', 0], ['OH', '333oh', 1]]);
  const byName = new Map(r.sessions.map(s => [s.id, s.name]));
  const strip = (s: Solve, name: string) => ({ ...s, id: undefined, sessionId: name });
  expect(r.solves.map(s => strip(s, byName.get(s.sessionId)!))).toEqual(
    solves.map(s => strip(s, s.sessionId === 'a' ? 'Main' : 'OH')),
  );
});
test('export carries format, version and timestamp', () => {
  const parsed = JSON.parse(toBackupJson({ sessions, solves, settings: DEFAULT_SETTINGS }, 999));
  expect([parsed.format, parsed.version, parsed.exportedAt]).toEqual(['atomic-timer', 1, 999]);
});
test('rejects bad files', () => {
  for (const bad of ['{', '{"format":"x"}', JSON.stringify({ format: 'atomic-timer', version: 99, sessions: [], solves: [] }),
    JSON.stringify({ format: 'atomic-timer', version: 1, sessions: [], solves: [{ sessionId: 'zz', timeMs: 1, penalty: 'none', scramble: '', createdAt: 1, comment: '' }] }),
    JSON.stringify({ format: 'atomic-timer', version: 1, sessions: [{ id: 'a', name: 'x', puzzle: 'nope', order: 0 }], solves: [] })]) {
    expect(() => parseBackupJson(bad)).toThrow(ImportError);
  }
});
