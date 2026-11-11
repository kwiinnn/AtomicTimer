import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { parseCsTimer } from './csTimer';

const sample = readFileSync(join(__dirname, 'fixtures', 'cstimer.sample.json'), 'utf8');

test('maps sessions, puzzles and names', () => {
  const b = parseCsTimer(sample);
  expect(b.sessions.map(s => [s.name, s.puzzle])).toEqual([['OH grind', '333oh'], ['2', '333']]);
});
test('maps solves: penalties, seconds to ms, phases ignored', () => {
  const b = parseCsTimer(sample);
  expect(b.solves.map(s => [s.timeMs, s.penalty, s.createdAt])).toEqual([
    [12340, 'none', 1700000000000], [15000, 'plus2', 1700000100000], [9000, 'dnf', 1700000200000], [4000, 'none', 1700000300000],
  ]);
  expect(b.solves[1]!.comment).toBe('nice');
});
test('scrType mapping and fallbacks', () => {
  const mk = (scrType?: string) => JSON.stringify({
    session1: [[[0, 1000], 'R', '', 1]],
    properties: { sessionData: JSON.stringify({ 1: { name: 'x', opt: scrType ? { scrType } : {} } }) },
  });
  const map: Record<string, string> = { '222so': '222', '444wca': '444', '555wca': '555', '666wca': '666', '777wca': '777',
    '333ni': '333bf', '444bld': '444bf', '555bld': '555bf', clkwca: 'clock', mgmp: 'minx', pyrso: 'pyram', skbso: 'skewb', sqrs: 'sq1', weird: '333' };
  for (const [scr, puzzle] of Object.entries(map)) expect(parseCsTimer(mk(scr)).sessions[0]!.puzzle).toBe(puzzle);
  expect(parseCsTimer(mk()).sessions[0]!.puzzle).toBe('333');
});
test('missing properties gives default names', () => {
  const b = parseCsTimer(JSON.stringify({ session3: [[[0, 1000], 'R', '', 1]] }));
  expect(b.sessions).toEqual([{ key: 'session3', name: 'csTimer 3', puzzle: '333', order: 3 }]);
});
test('malformed solve entries are counted, not fatal', () => {
  const b = parseCsTimer(JSON.stringify({ session1: [[[0, 1000], 'R', '', 1], 'junk', [[0, 'x'], 'R', '', 1]] }));
  expect([b.solves.length, b.skippedUnsupported]).toEqual([1, 2]);
});
test('100k solves parse in under 2s', () => {
  const big = JSON.stringify({ session1: Array.from({ length: 100_000 }, (_, i) => [[0, 10000 + i], "R U R' U' F2 D L2", '', 1700000000 + i]) });
  const t0 = performance.now();
  expect(parseCsTimer(big).solves).toHaveLength(100_000);
  expect(performance.now() - t0).toBeLessThan(2000);
});
