import { describe, expect, test } from 'vitest';
import { effectiveTime, formatAverage, formatSolve, formatTime, parseTimeInput } from './time';
import { PUZZLES, PUZZLE_ORDER } from './model';

test('formatTime truncates singles', () => {
  expect(formatTime(12345)).toBe('12.34');
  expect(formatTime(12345, true)).toBe('12.345');
  expect(formatTime(999)).toBe('0.99');
  expect(formatTime(62420)).toBe('1:02.42');
  expect(formatTime(3723450)).toBe('1:02:03.45');
  expect(formatTime(Infinity)).toBe('DNF');
});
test('formatAverage rounds', () => {
  expect(formatAverage(12345)).toBe('12.35');
  expect(formatAverage(12344)).toBe('12.34');
  expect(formatAverage(10666.67)).toBe('10.67');
  expect(formatAverage(59996)).toBe('1:00.00');
  expect(formatAverage(Infinity)).toBe('DNF');
});
test('effectiveTime and formatSolve apply penalties', () => {
  expect(effectiveTime({ timeMs: 10000, penalty: 'plus2' })).toBe(12000);
  expect(effectiveTime({ timeMs: 10000, penalty: 'dnf' })).toBe(Infinity);
  expect(effectiveTime({ timeMs: 10000, penalty: 'none' })).toBe(10000);
  expect(formatSolve({ timeMs: 10000, penalty: 'plus2' })).toBe('12.00+');
  expect(formatSolve({ timeMs: 10000, penalty: 'dnf' })).toBe('DNF');
});
describe('parseTimeInput', () => {
  test('valid inputs', () => {
    expect(parseTimeInput('1:02.42')).toEqual({ timeMs: 62420, penalty: 'none' });
    expect(parseTimeInput('46.5')).toEqual({ timeMs: 46500, penalty: 'none' });
    expect(parseTimeInput('1234')).toEqual({ timeMs: 12340, penalty: 'none' });
    expect(parseTimeInput('10234')).toEqual({ timeMs: 62340, penalty: 'none' });
    expect(parseTimeInput('12.34+')).toEqual({ timeMs: 12340, penalty: 'plus2' });
    expect(parseTimeInput('dnf')).toEqual({ timeMs: 0, penalty: 'dnf' });
    expect(parseTimeInput(' 1:02:03.45 ')).toEqual({ timeMs: 3723450, penalty: 'none' });
  });
  test('invalid inputs', () => {
    for (const bad of ['', 'abc', '0', '1:75.00', '12.3.4', '-5']) expect(parseTimeInput(bad)).toBeNull();
  });
});
test('every puzzle has metadata and order lists all', () => {
  expect(PUZZLE_ORDER).toHaveLength(15);
  expect(new Set(PUZZLE_ORDER).size).toBe(15);
  for (const id of PUZZLE_ORDER) expect(PUZZLES[id].eventId).toBe(id);
  expect(PUZZLES.sq1.cubingPuzzle).toBe('square1');
});
