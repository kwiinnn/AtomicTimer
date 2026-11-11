import { expect, test } from 'vitest';
import type { Session, Solve } from '../model';
import { mergeImport } from './merge';
import type { ImportBatch } from './types';

const batch: ImportBatch = {
  sessions: [{ key: 'k', name: 'Main', puzzle: '333' }],
  solves: [
    { sessionKey: 'k', timeMs: 1000, penalty: 'none', scramble: 'R', createdAt: 10, comment: '' },
    { sessionKey: 'k', timeMs: 2000, penalty: 'dnf', scramble: 'U', createdAt: 20, comment: '' },
  ],
  skippedUnsupported: 2,
};
let n = 0;
const newId = () => `id${n++}`;

test('creates sessions with order after the max and tags solves as import', () => {
  const existing: Session[] = [{ id: 'e', name: 'Other', puzzle: '222', order: 4, createdAt: 0 }];
  const r = mergeImport({ sessions: existing, solves: [] }, batch, newId);
  expect(r.sessions).toHaveLength(1);
  expect(r.sessions[0]!.order).toBe(5);
  expect(r.solves.every(s => s.source === 'import' && s.sessionId === r.sessions[0]!.id)).toBe(true);
  expect(r.summary).toEqual({ sessionsCreated: 1, solvesAdded: 2, duplicatesSkipped: 0, skippedUnsupported: 2 });
});
test('reuses existing session with same name and puzzle', () => {
  const existing: Session[] = [{ id: 'e', name: 'Main', puzzle: '333', order: 0, createdAt: 0 }];
  const r = mergeImport({ sessions: existing, solves: [] }, batch, newId);
  expect(r.summary.sessionsCreated).toBe(0);
  expect(r.solves.every(s => s.sessionId === 'e')).toBe(true);
});
test('same name but different puzzle is a different session', () => {
  const existing: Session[] = [{ id: 'e', name: 'Main', puzzle: '444', order: 0, createdAt: 0 }];
  expect(mergeImport({ sessions: existing, solves: [] }, batch, newId).summary.sessionsCreated).toBe(1);
});
test('importing the same batch twice adds nothing the second time', () => {
  const first = mergeImport({ sessions: [], solves: [] }, batch, newId);
  const second = mergeImport({ sessions: first.sessions, solves: first.solves as Solve[] }, batch, newId);
  expect(second.summary).toMatchObject({ sessionsCreated: 0, solvesAdded: 0, duplicatesSkipped: 2 });
});
test('duplicates within one batch', () => {
  const dup: ImportBatch = { ...batch, solves: [batch.solves[0]!, { ...batch.solves[0]! }] };
  expect(mergeImport({ sessions: [], solves: [] }, dup, newId).summary).toMatchObject({ solvesAdded: 1, duplicatesSkipped: 1 });
});
