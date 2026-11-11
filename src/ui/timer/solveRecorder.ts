import type { Penalty, PuzzleId, Solve, SolveSource } from '../../core/model';
import type { ScrambleService } from '../../platform/scramble';

export interface SolveRecorder {
  /** The scramble currently shown, or null while the first one is generating. */
  current(): string | null;
  /** Error from the last failed load, cleared by the next successful one. */
  error(): string | null;
  /** Shows a fresh scramble for `puzzle`. Stale loads (superseded by a later call) are ignored. */
  load(puzzle: PuzzleId): Promise<void>;
  /** Freezes the scramble on screen as the one this solve uses. */
  onStarted(): void;
  /** Saves the solve with the frozen scramble (or the current one), then loads the next scramble. */
  onFinished(sessionId: string, timeMs: number, penalty: Penalty, source: SolveSource): Promise<Solve>;
  subscribe(fn: () => void): () => void;
}

export function createSolveRecorder(deps: {
  scrambles: ScrambleService;
  save: (s: Solve) => Promise<void>;
  newId: () => string;
  now: () => number;
}): SolveRecorder {
  let current: string | null = null;
  let error: string | null = null;
  let frozen: string | null = null;
  let puzzle: PuzzleId | null = null;
  let token = 0;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(fn => fn());

  const load = async (p: PuzzleId) => {
    const mine = ++token;
    if (puzzle !== p) {
      current = null;
      emit();
    }
    puzzle = p;
    try {
      const s = await deps.scrambles.next(p);
      if (mine !== token) return;
      current = s;
      error = null;
    } catch (e) {
      if (mine !== token) return;
      error = e instanceof Error ? e.message : String(e);
    }
    emit();
  };

  return {
    current: () => current,
    error: () => error,
    load,
    onStarted() {
      frozen = current;
    },
    async onFinished(sessionId, timeMs, penalty, source) {
      const solve: Solve = {
        id: deps.newId(),
        sessionId,
        timeMs,
        penalty,
        scramble: frozen ?? current ?? '',
        createdAt: deps.now(),
        comment: '',
        source,
      };
      frozen = null;
      await deps.save(solve);
      if (puzzle) void load(puzzle);
      return solve;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
