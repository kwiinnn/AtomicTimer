import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings';
import { toBackupJson } from './backup';
import { detectFormat, parseImport } from './detect';
import { ImportError } from './types';

const read = (f: string) => readFileSync(join(__dirname, 'fixtures', f), 'utf8');

test('detects every known format', () => {
  expect(detectFormat(read('cstimer.sample.json'))).toBe('cstimer');
  expect(detectFormat(read('cubic-backup.sample.csv'))).toBe('cubic-backup');
  expect(detectFormat(read('cubic-external.sample.txt'))).toBe('cubic-external');
  expect(detectFormat(toBackupJson({ sessions: [], solves: [], settings: DEFAULT_SETTINGS }, 1))).toBe('atomic');
});
test('unknown content is null', () => {
  for (const t of ['hello', '', '{}', '[1,2]', '{']) expect(detectFormat(t)).toBeNull();
});
test('parseImport dispatches', () => {
  expect(parseImport(read('cstimer.sample.json')).solves).toHaveLength(4);
  expect(parseImport(read('cubic-backup.sample.csv')).solves).toHaveLength(5);
  const ext = parseImport(read('cubic-external.sample.txt'), { externalPuzzle: '444', externalSessionName: 'Old 4x4' });
  expect(ext.sessions[0]).toMatchObject({ name: 'Old 4x4', puzzle: '444' });
});
test('parseImport errors are ImportErrors, never TypeErrors', () => {
  const truncated = read('cstimer.sample.json').slice(0, 60);
  for (const bad of ['{', '', truncated, '\x89PNG\r\n\x1a\n', '{"session1": 5}', '"Puzzle","Category"\n']) {
    expect(() => parseImport(bad)).toThrow(ImportError);
  }
});
test('unrecognized and empty messages', () => {
  expect(() => parseImport('hello')).toThrow('Unrecognized file format');
  expect(() => parseImport(JSON.stringify({ session1: [] }))).toThrow('This file contains no solves');
});
