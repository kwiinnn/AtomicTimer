import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import type { Session, Solve } from '../model';
import { parseCubicBackup, parseCubicExternal, toCubicBackup } from './cubicTimer';

const read = (f: string) => readFileSync(join(__dirname, 'fixtures', f), 'utf8');
const PRIVATE = join(__dirname, '../../../tests/fixtures/private/cubic-backup.csv');
const PRIVATE_EXTERNAL = join(__dirname, '../../../tests/fixtures/private/cubic-external.txt');

test('backup: one session per puzzle+category', () => {
  const b = parseCubicBackup(read('cubic-backup.sample.csv'));
  expect(b.sessions.map(s => [s.name, s.puzzle]).sort()).toEqual([['Normal', '222'], ['Normal', '333'], ['OH', '333']]);
  expect(b.solves).toHaveLength(5);
  expect(b.solves.find(s => s.comment.includes('"'))?.comment).toBe('nice, "pb"');
  expect(b.solves[0]).toMatchObject({ timeMs: 12340, createdAt: 1700000000000, scramble: "R U R' U'", penalty: 'none' });
  expect(b.skippedUnsupported).toBe(1);
});
test('backup penalties map', () => {
  const b = parseCubicBackup(read('cubic-backup.sample.csv'));
  expect(b.solves.map(s => s.penalty)).toEqual(['none', 'plus2', 'dnf', 'none', 'none']);
});
test('backup round trip keeps every field', () => {
  const sessions: Session[] = [
    { id: 'a', name: 'Normal', puzzle: '333', order: 0, createdAt: 0 },
    { id: 'b', name: 'Main', puzzle: 'minx', order: 1, createdAt: 0 },
  ];
  const solves: Solve[] = [
    { id: '1', sessionId: 'a', timeMs: 9870, penalty: 'plus2', scramble: "R U'", createdAt: 5, comment: 'a,"b"\nc', source: 'keyboard' },
    { id: '2', sessionId: 'b', timeMs: 70000, penalty: 'dnf', scramble: 'R++ D--', createdAt: 6, comment: '', source: 'touch' },
  ];
  const b = parseCubicBackup(toCubicBackup(sessions, solves));
  expect(b.sessions.map(s => [s.name, s.puzzle])).toEqual([['Normal', '333'], ['Main', 'minx']]);
  expect(b.solves.map(({ sessionKey: _k, ...rest }) => rest)).toEqual(
    solves.map(s => ({ timeMs: s.timeMs, penalty: s.penalty, scramble: s.scramble, createdAt: s.createdAt, comment: s.comment })),
  );
});
test('export maps OH/BLD sessions back to their base puzzle', () => {
  const csv = toCubicBackup([{ id: 'x', name: 'OH', puzzle: '333oh', order: 0, createdAt: 0 }],
    [{ id: '1', sessionId: 'x', timeMs: 1, penalty: 'none', scramble: '', createdAt: 1, comment: '', source: 'keyboard' }]);
  expect(csv.split(/\r?\n/)[1]).toMatch(/^"333","OH",/);
});
test('backup without the expected header is rejected', () => {
  expect(() => parseCubicBackup('"a","b"\n"1","2"')).toThrow(/Cubic Timer/);
});
test('external format', () => {
  const b = parseCubicExternal(read('cubic-external.sample.txt'), '333', 'Imported');
  expect(b.sessions).toEqual([{ key: 'external', name: 'Imported', puzzle: '333' }]);
  expect(b.solves[0]).toMatchObject({ timeMs: 62420, penalty: 'none', scramble: 'R U', createdAt: Date.parse('2016-06-19T10:37:09.619+01:00') });
  expect(b.solves[1]).toMatchObject({ timeMs: 46500, scramble: '' });
  expect(b.solves[2]).toMatchObject({ timeMs: 0, penalty: 'dnf' });
});
test('external format counts unparseable lines as unsupported', () => {
  const b = parseCubicExternal('"oops";"R";"2016-06-19T10:37:09.619+01:00"\n"1.00";"R";"not a date"\n', '333', 'X');
  expect([b.solves.length, b.skippedUnsupported]).toEqual([0, 2]);
});
test.skipIf(!existsSync(PRIVATE))('real export parses without unsupported rows', () => {
  const b = parseCubicBackup(readFileSync(PRIVATE, 'utf8'));
  expect(b.solves.length).toBeGreaterThan(0);
  expect(b.skippedUnsupported).toBe(0);
});

test('external format with a 4th (comment) field, as real exports have', () => {
  const b = parseCubicExternal('"28.820";"D\' F2 L2";"2021-07-05T14:01:47.656+08:00";""\n"21.910";"R";"2022-01-18T19:27:27.085+08:00";"lucky"\n', '333', 'X');
  expect(b.solves.map(s => [s.timeMs, s.comment])).toEqual([[28820, ''], [21910, 'lucky']]);
  expect(b.skippedUnsupported).toBe(0);
});
test.skipIf(!existsSync(PRIVATE_EXTERNAL))('real external export imports every line', () => {
  const text = readFileSync(PRIVATE_EXTERNAL, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean).length;
  const b = parseCubicExternal(text, '333', 'Real');
  expect(b.solves).toHaveLength(lines);
  expect(b.skippedUnsupported).toBe(0);
});
