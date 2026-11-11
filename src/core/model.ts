export type PuzzleId =
  | '333' | '222' | '444' | '555' | '666' | '777' | '333oh' | '333bf'
  | '444bf' | '555bf' | 'clock' | 'minx' | 'pyram' | 'skewb' | 'sq1';

export type Penalty = 'none' | 'plus2' | 'dnf';

export interface Session {
  id: string;
  name: string;
  puzzle: PuzzleId;
  order: number;
  createdAt: number;
}

export interface Solve {
  id: string;
  sessionId: string;
  /** Raw time without penalty, integer ms. */
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  createdAt: number;
  comment: string;
  source: 'keyboard' | 'touch' | 'manual' | 'import' | 'ble' | 'serial';
  phases?: number[];
}

export type SolveSource = Solve['source'];

export interface PuzzleInfo {
  label: string;
  eventId: string;
  cubingPuzzle: string;
}

export const PUZZLE_ORDER: PuzzleId[] = [
  '333', '222', '444', '555', '666', '777', '333oh', '333bf',
  '444bf', '555bf', 'clock', 'minx', 'pyram', 'skewb', 'sq1',
];

const info = (label: string, eventId: string, cubingPuzzle: string): PuzzleInfo => ({ label, eventId, cubingPuzzle });

export const PUZZLES: Record<PuzzleId, PuzzleInfo> = {
  '333': info('3x3', '333', '3x3x3'),
  '222': info('2x2', '222', '2x2x2'),
  '444': info('4x4', '444', '4x4x4'),
  '555': info('5x5', '555', '5x5x5'),
  '666': info('6x6', '666', '6x6x6'),
  '777': info('7x7', '777', '7x7x7'),
  '333oh': info('3x3 OH', '333oh', '3x3x3'),
  '333bf': info('3x3 BLD', '333bf', '3x3x3'),
  '444bf': info('4x4 BLD', '444bf', '4x4x4'),
  '555bf': info('5x5 BLD', '555bf', '5x5x5'),
  clock: info('Clock', 'clock', 'clock'),
  minx: info('Megaminx', 'minx', 'megaminx'),
  pyram: info('Pyraminx', 'pyram', 'pyraminx'),
  skewb: info('Skewb', 'skewb', 'skewb'),
  sq1: info('Square-1', 'sq1', 'square1'),
};

export function isPuzzleId(v: unknown): v is PuzzleId {
  return typeof v === 'string' && v in PUZZLES;
}
