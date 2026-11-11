import type { Penalty, PuzzleId, SolveSource } from '../model';

export interface ImportSession {
  key: string;
  name: string;
  puzzle: PuzzleId;
  order?: number;
}

export interface ImportSolve {
  sessionKey: string;
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  createdAt: number;
  comment: string;
  /** Defaults to 'import'. */
  source?: SolveSource;
}

export interface ImportBatch {
  sessions: ImportSession[];
  solves: ImportSolve[];
  skippedUnsupported: number;
}

export interface ImportSummary {
  sessionsCreated: number;
  solvesAdded: number;
  duplicatesSkipped: number;
  skippedUnsupported: number;
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export const PENALTIES: readonly Penalty[] = ['none', 'plus2', 'dnf'];
export const SOURCES: readonly SolveSource[] = ['keyboard', 'touch', 'manual', 'import', 'ble', 'serial'];
