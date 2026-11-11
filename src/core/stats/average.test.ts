import { expect, test } from 'vitest';
import { averageOf, meanOf, trimCount } from './average';

test('trimCount', () => {
  expect([5, 12, 50, 100, 1000].map(n => trimCount(n, 5))).toEqual([1, 1, 3, 5, 50]);
});
test('ao5 trims best and worst', () => expect(averageOf([1000, 2000, 3000, 4000, 5000], 5, 'wca')).toBe(3000));
test('order does not matter', () => expect(averageOf([5000, 1000, 4000, 2000, 3000], 5, 'wca')).toBe(3000));
test('one DNF is trimmed as worst', () => expect(averageOf([1000, 2000, 3000, 4000, Infinity], 5, 'wca')).toBe(3000));
test('two DNFs in ao5 is DNF', () => expect(averageOf([1000, 2000, 3000, Infinity, Infinity], 5, 'wca')).toBe(Infinity));
test('strict rule: any DNF is DNF', () => expect(averageOf([1000, 2000, 3000, 4000, Infinity], 5, 'strict')).toBe(Infinity));
test('strict rule without DNF matches wca', () => expect(averageOf([1000, 2000, 3000, 4000, 5000], 5, 'strict')).toBe(3000));
test('ao50 trims 3 each side', () => {
  const t = Array.from({ length: 50 }, (_, i) => (i + 1) * 1000);
  expect(averageOf(t, 5, 'wca')).toBe(25500);
});
test('mo3', () => {
  expect(meanOf([1000, 2000, 3000])).toBe(2000);
  expect(meanOf([1000, 2000, Infinity])).toBe(Infinity);
});
