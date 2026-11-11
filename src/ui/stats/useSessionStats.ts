import { useMemo } from 'react';
import type { Solve } from '../../core/model';
import { computeSessionStats, type SessionStats } from '../../core/stats/session';
import { useApp } from '../state/AppContext';

// The live query hands every consumer the same array, so the list and the stats pane share one computation.
const cache = new WeakMap<Solve[], { key: string; stats: SessionStats }>();

export function statsFor(solves: Solve[], trimPct: number, dnfRule: 'wca' | 'strict'): SessionStats {
  const key = `${trimPct}|${dnfRule}`;
  const hit = cache.get(solves);
  if (hit && hit.key === key) return hit.stats;
  const stats = computeSessionStats(solves, { trimPct, dnfRule });
  cache.set(solves, { key, stats });
  return stats;
}

/** Rolling stats for the current session, computed once per data change. */
export function useSessionStats(): SessionStats {
  const { solves, settings } = useApp();
  const { trimPct, dnfRule } = settings;
  return useMemo(() => statsFor(solves, trimPct, dnfRule), [solves, trimPct, dnfRule]);
}
