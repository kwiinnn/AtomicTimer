import type { Session, Solve } from '../../core/model';
import type { Settings } from '../../core/settings';

export interface AppStorage {
  /** Sorted by `order`. */
  listSessions(): Promise<Session[]>;
  putSession(s: Session): Promise<void>;
  /** Also deletes the session's solves. */
  deleteSession(id: string): Promise<void>;
  /** Ascending by `createdAt`. */
  listSolves(sessionId: string): Promise<Solve[]>;
  putSolve(s: Solve): Promise<void>;
  /** Returns the deleted solve so it can be restored (undo). */
  deleteSolve(id: string): Promise<Solve | undefined>;
  /** Adds everything in one transaction; any failure writes nothing. */
  bulkImport(sessions: Session[], solves: Solve[]): Promise<void>;
  getSettings(): Promise<Settings>;
  putSettings(s: Settings): Promise<void>;
  exportAll(): Promise<{ sessions: Session[]; solves: Solve[]; settings: Settings }>;
}
