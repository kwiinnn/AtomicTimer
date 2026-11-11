import { expect, test } from 'vitest';
import type { Penalty, Solve } from '../model';
import { averageOf } from './average';
import { computeSessionStats, filterToday } from './session';

const mk = (ms: number[], penalties: Record<number, Penalty> = {}) =>
  ms.map((timeMs, i) => ({ id: `${i}`, sessionId: 's', timeMs, penalty: penalties[i] ?? 'none',
    scramble: '', createdAt: i * 60_000, comment: '', source: 'keyboard' }) as Solve);
const cfg = { trimPct: 5, dnfRule: 'wca' } as const;

test('rolling stats over 12 ascending solves', () => {
  const s = computeSessionStats(mk(Array.from({ length: 12 }, (_, i) => (i + 1) * 1000)), cfg);
  expect(s.rows.mo3).toEqual({ current: 11000, best: 2000 });
  expect(s.rows.ao5).toEqual({ current: 10000, best: 3000 });
  expect(s.rows.ao12).toEqual({ current: 6500, best: 6500 });
  expect(s.rows.ao50).toEqual({ current: null, best: null });
  expect([s.count, s.mean, s.best, s.worst]).toEqual([12, 6500, 1000, 12000]);
  expect(s.series.ao5.slice(0, 5)).toEqual([null, null, null, null, 3000]);
  expect(s.series.single).toHaveLength(12);
});
test('DNF excluded from countValid, mean and worst', () => {
  const s = computeSessionStats(mk([1000, 2000, 3000], { 2: 'dnf' }), cfg);
  expect([s.count, s.countValid, s.mean, s.worst]).toEqual([3, 2, 1500, 2000]);
  expect(s.rows.mo3.current).toBe(Infinity);
});
test('all DNF: best is DNF, mean and worst null', () => {
  const s = computeSessionStats(mk([1000, 2000], { 0: 'dnf', 1: 'dnf' }), cfg);
  expect([s.best, s.mean, s.worst]).toEqual([Infinity, null, null]);
});
test('empty session', () => {
  const s = computeSessionStats([], cfg);
  expect([s.count, s.best, s.mean]).toEqual([0, null, null]);
});
test('rolling window matches direct averageOf on random data with DNFs', () => {
  const times = Array.from({ length: 300 }, (_, i) => 5000 + ((i * 7919) % 9000));
  const penalties: Record<number, Penalty> = {};
  for (let i = 0; i < 300; i += 17) penalties[i] = 'dnf';
  for (let i = 3; i < 300; i += 23) penalties[i] = 'plus2';
  const solves = mk(times, penalties);
  const s = computeSessionStats(solves, cfg);
  const eff = solves.map(x => (x.penalty === 'dnf' ? Infinity : x.timeMs + (x.penalty === 'plus2' ? 2000 : 0)));
  let best = Infinity;
  for (let i = 99; i < 300; i++) best = Math.min(best, averageOf(eff.slice(i - 99, i + 1), 5, 'wca'));
  expect(s.rows.ao100.current).toBeCloseTo(averageOf(eff.slice(200), 5, 'wca'), 6);
  expect(s.rows.ao100.best).toBeCloseTo(best, 6);
});
test('10k solves compute in under 1s', () => {
  const t0 = performance.now();
  computeSessionStats(mk(Array.from({ length: 10_000 }, () => 5000 + Math.random() * 10000)), cfg);
  expect(performance.now() - t0).toBeLessThan(1000);
});
test('filterToday keeps local-day solves only', () => {
  const now = new Date(2026, 10, 11, 0, 30);
  const solves = mk([1000, 2000]);
  solves[0]!.createdAt = new Date(2026, 10, 10, 23, 59).getTime();
  solves[1]!.createdAt = new Date(2026, 10, 11, 0, 1).getTime();
  expect(filterToday(solves, now).map(s => s.id)).toEqual(['1']);
});
