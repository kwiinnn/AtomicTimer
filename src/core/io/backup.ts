import { isPuzzleId, type Session, type Solve } from '../model';
import type { Settings } from '../settings';
import { ImportError, PENALTIES, SOURCES, type ImportBatch, type ImportSession, type ImportSolve } from './types';

export const BACKUP_FORMAT = 'atomic-timer';
export const BACKUP_VERSION = 1;

export function toBackupJson(data: { sessions: Session[]; solves: Solve[]; settings: Settings }, now: number): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now,
    sessions: data.sessions,
    solves: data.solves,
    settings: data.settings,
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Parses a native backup into an import batch. Settings in the file are ignored. */
export function parseBackupJson(text: string): ImportBatch {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('The file is not valid JSON');
  }
  if (!isObj(raw) || raw.format !== BACKUP_FORMAT) throw new ImportError('Not an Atomic Timer backup');
  if (raw.version !== BACKUP_VERSION) throw new ImportError(`Unsupported backup version: ${String(raw.version)}`);
  if (!Array.isArray(raw.sessions) || !Array.isArray(raw.solves)) throw new ImportError('Backup is missing sessions or solves');

  const sessions: ImportSession[] = raw.sessions.map((s, i) => {
    if (!isObj(s) || typeof s.id !== 'string' || typeof s.name !== 'string' || !isPuzzleId(s.puzzle)) {
      throw new ImportError(`Invalid session at position ${i + 1}`);
    }
    return { key: s.id, name: s.name, puzzle: s.puzzle, order: isNum(s.order) ? s.order : i };
  });
  const keys = new Set(sessions.map(s => s.key));

  const solves: ImportSolve[] = raw.solves.map((s, i) => {
    if (
      !isObj(s) || typeof s.sessionId !== 'string' || !keys.has(s.sessionId) || !isNum(s.timeMs) || s.timeMs < 0 ||
      !PENALTIES.includes(s.penalty as never) || !isNum(s.createdAt)
    ) {
      throw new ImportError(`Invalid solve at position ${i + 1}`);
    }
    return {
      sessionKey: s.sessionId,
      timeMs: s.timeMs,
      penalty: s.penalty as ImportSolve['penalty'],
      scramble: typeof s.scramble === 'string' ? s.scramble : '',
      createdAt: s.createdAt,
      comment: typeof s.comment === 'string' ? s.comment : '',
      source: SOURCES.includes(s.source as never) ? (s.source as ImportSolve['source']) : undefined,
    };
  });
  return { sessions, solves, skippedUnsupported: 0 };
}
