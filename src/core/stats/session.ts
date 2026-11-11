import type { Solve } from '../model';
import { effectiveTime } from '../time';
import { meanOf, trimCount, trimmedMeanOfSorted, type DnfRule } from './average';

export type StatKey = 'mo3' | 'ao5' | 'ao12' | 'ao50' | 'ao100' | 'ao1000';
export const STAT_KEYS: StatKey[] = ['mo3', 'ao5', 'ao12', 'ao50', 'ao100', 'ao1000'];
export const STAT_WINDOWS: Record<StatKey, number> = { mo3: 3, ao5: 5, ao12: 12, ao50: 50, ao100: 100, ao1000: 1000 };

export interface StatsConfig {
  trimPct: number;
  dnfRule: DnfRule;
}

/** null = not enough solves; Infinity = DNF. */
export interface StatRow {
  current: number | null;
  best: number | null;
}

export interface SessionStats {
  count: number;
  countValid: number;
  mean: number | null;
  best: number | null;
  worst: number | null;
  rows: Record<StatKey, StatRow>;
  series: { single: number[]; ao5: (number | null)[]; ao12: (number | null)[] };
}

function lowerBound(sorted: number[], v: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Rolling stats over chronologically ordered solves. Each window keeps a sorted array updated by binary-search insert/remove. */
export function computeSessionStats(solves: Solve[], cfg: StatsConfig): SessionStats {
  const single = solves.map(effectiveTime);
  let countValid = 0;
  let sum = 0;
  let best: number | null = null;
  let worst: number | null = null;
  for (const t of single) {
    best = best === null ? t : Math.min(best, t);
    if (Number.isFinite(t)) {
      countValid++;
      sum += t;
      worst = worst === null ? t : Math.max(worst, t);
    }
  }

  const rows = {} as Record<StatKey, StatRow>;
  const series: SessionStats['series'] = { single, ao5: [], ao12: [] };
  for (const key of STAT_KEYS) {
    const w = STAT_WINDOWS[key];
    const k = trimCount(w, cfg.trimPct);
    const sorted: number[] = [];
    const row: StatRow = { current: null, best: null };
    const out = key === 'ao5' || key === 'ao12' ? series[key] : null;
    for (let i = 0; i < single.length; i++) {
      const t = single[i]!;
      sorted.splice(lowerBound(sorted, t), 0, t);
      if (i >= w) sorted.splice(lowerBound(sorted, single[i - w]!), 1);
      let value: number | null = null;
      if (i >= w - 1) {
        value = key === 'mo3' ? meanOf(sorted) : trimmedMeanOfSorted(sorted, k, cfg.dnfRule);
        row.best = row.best === null ? value : Math.min(row.best, value);
      }
      row.current = value;
      out?.push(value);
    }
    rows[key] = row;
  }

  return {
    count: solves.length,
    countValid,
    mean: countValid > 0 ? sum / countValid : null,
    best,
    worst,
    rows,
    series,
  };
}

/** Solves created on the same local calendar day as `now`. */
export function filterToday(solves: Solve[], now: Date): Solve[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return solves.filter(s => s.createdAt >= start && s.createdAt < end);
}
