import { useEffect } from 'react';
import { useApp } from './AppContext';

declare global {
  interface Window {
    __seed?: (timesMs: number[]) => Promise<void>;
  }
}

/** Test-only helper: `?e2e=1` (or a non-production build) exposes `window.__seed` to add solves to the current session. */
export function E2EHooks() {
  const { storage, session } = useApp();
  useEffect(() => {
    const enabled = import.meta.env.MODE !== 'production' || new URLSearchParams(location.search).has('e2e');
    if (!enabled || !session) return;
    window.__seed = async timesMs => {
      const base = Date.now() - timesMs.length * 60_000;
      const solves = timesMs.map((timeMs, i) => ({
        id: crypto.randomUUID(), sessionId: session.id, timeMs, penalty: 'none' as const,
        scramble: `R U F${i}`, createdAt: base + i * 60_000, comment: '', source: 'manual' as const,
      }));
      await storage.bulkImport([], solves);
    };
    return () => {
      delete window.__seed;
    };
  }, [storage, session]);
  return null;
}
