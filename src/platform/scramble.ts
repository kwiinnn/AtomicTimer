import { PUZZLES, type PuzzleId } from '../core/model';

export interface ScrambleService {
  /** Resolves to a scramble for `puzzle`, using a prefetched one when available, and starts prefetching the next. */
  next(puzzle: PuzzleId): Promise<string>;
  /** Starts generating a scramble for `puzzle` in the background if none is pending. */
  prefetch(puzzle: PuzzleId): void;
}

async function cubingGenerate(eventId: string): Promise<string> {
  const { randomScrambleForEvent } = await import('cubing/scramble');
  return (await randomScrambleForEvent(eventId)).toString();
}

export function createScrambleService(generate: (eventId: string) => Promise<string> = cubingGenerate): ScrambleService {
  const pending = new Map<PuzzleId, Promise<string>>();
  const gen = (p: PuzzleId) => generate(PUZZLES[p].eventId);

  const prefetch = (p: PuzzleId) => {
    if (pending.has(p)) return;
    const promise = gen(p);
    promise.catch(() => {}); // surfaced (and retried) by the next() that consumes it
    pending.set(p, promise);
  };

  return {
    prefetch,
    next(p) {
      const queued = pending.get(p);
      pending.delete(p);
      const result = queued ? queued.catch(() => gen(p)) : gen(p);
      prefetch(p);
      return result;
    },
  };
}
