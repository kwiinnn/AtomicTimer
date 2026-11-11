/**
 * 'wca': DNFs (Infinity) count as the worst times and are trimmed first; DNF if they outnumber the trim.
 * 'strict': any DNF in the window makes the average DNF.
 */
export type DnfRule = 'wca' | 'strict';

/** Number of times removed from EACH end of an average of n. */
export function trimCount(n: number, trimPct: number): number {
  if (n === 5 || n === 12) return 1;
  return Math.ceil((n * trimPct) / 100);
}

/** Untrimmed mean; any DNF makes it DNF. */
export function meanOf(times: number[]): number {
  let sum = 0;
  for (const t of times) {
    if (!Number.isFinite(t)) return Infinity;
    sum += t;
  }
  return sum / times.length;
}

/** Trimmed average of effective times (DNF = Infinity). Returns the exact mean, unrounded. */
export function averageOf(times: number[], trimPct: number, rule: DnfRule): number {
  const k = trimCount(times.length, trimPct);
  return trimmedMeanOfSorted([...times].sort((a, b) => a - b), k, rule);
}

/** Same as averageOf for an already ascending-sorted window; used by the rolling stats. */
export function trimmedMeanOfSorted(sorted: number[], k: number, rule: DnfRule): number {
  const n = sorted.length;
  const dnfs = n - countFinite(sorted);
  if (dnfs > 0 && (rule === 'strict' || dnfs > k)) return Infinity;
  let sum = 0;
  for (let i = k; i < n - k; i++) sum += sorted[i]!;
  return sum / (n - 2 * k);
}

function countFinite(sorted: number[]): number {
  // Infinity sorts last, so finite values form a prefix.
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (Number.isFinite(sorted[mid]!)) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
