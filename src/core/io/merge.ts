import type { Session, Solve } from '../model';
import type { ImportBatch, ImportSummary } from './types';

const dupKey = (sessionId: string, s: { createdAt: number; timeMs: number; scramble: string }) =>
  `${sessionId}\u0000${s.createdAt}\u0000${s.timeMs}\u0000${s.scramble}`;

/**
 * Maps an import batch onto existing data. Sessions match on (name, puzzle); solves already present in the
 * target session (same createdAt, timeMs and scramble) are skipped. Returns only what is new.
 */
export function mergeImport(
  existing: { sessions: Session[]; solves: Solve[] },
  batch: ImportBatch,
  newId: () => string,
): { sessions: Session[]; solves: Solve[]; summary: ImportSummary } {
  const byNamePuzzle = new Map(existing.sessions.map(s => [`${s.puzzle}\u0000${s.name}`, s.id]));
  let nextOrder = existing.sessions.reduce((m, s) => Math.max(m, s.order), -1) + 1;
  const now = Date.now();

  const newSessions: Session[] = [];
  const keyToId = new Map<string, string>();
  const ordered = [...batch.sessions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const s of ordered) {
    const nk = `${s.puzzle}\u0000${s.name}`;
    let id = byNamePuzzle.get(nk);
    if (!id) {
      id = newId();
      byNamePuzzle.set(nk, id);
      newSessions.push({ id, name: s.name, puzzle: s.puzzle, order: nextOrder++, createdAt: now });
    }
    keyToId.set(s.key, id);
  }

  const seen = new Set(existing.solves.map(s => dupKey(s.sessionId, s)));
  const newSolves: Solve[] = [];
  let duplicatesSkipped = 0;
  for (const s of batch.solves) {
    const sessionId = keyToId.get(s.sessionKey);
    if (!sessionId) continue;
    const k = dupKey(sessionId, s);
    if (seen.has(k)) {
      duplicatesSkipped++;
      continue;
    }
    seen.add(k);
    newSolves.push({
      id: newId(),
      sessionId,
      timeMs: s.timeMs,
      penalty: s.penalty,
      scramble: s.scramble,
      createdAt: s.createdAt,
      comment: s.comment,
      source: s.source ?? 'import',
    });
  }

  return {
    sessions: newSessions,
    solves: newSolves,
    summary: {
      sessionsCreated: newSessions.length,
      solvesAdded: newSolves.length,
      duplicatesSkipped,
      skippedUnsupported: batch.skippedUnsupported,
    },
  };
}
