/*
 * Cubic Timer / Twisty Timer file formats, implemented from exported files (clean-room; no source consulted).
 *
 * Backup ("back-up" export): comma-separated, every field double-quoted, CRLF, header row
 *   "Puzzle","Category","Time(millis)","Date(millis)","Scramble","Penalty","Comment"
 *   Time = raw time in ms, Date = epoch ms, Penalty 0 = none, 1 = +2, 2 = DNF.
 *   Puzzle codes: 333 222 444 555 666 777 clock mega pyra skewb sq1. OH/BLD are categories, not puzzles.
 *   NOTE: confirm against a real export placed at tests/fixtures/private/cubic-backup.csv.
 *
 * External (per-puzzle) export: semicolon-separated "time";"scramble";"ISO-8601 date";"comment", no header.
 *   Confirmed against a real export: 4 fields per line; the 4th (usually empty) is the comment.
 */
import type { Penalty, PuzzleId, Session, Solve } from '../model';
import { parseTimeInput } from '../time';
import { readCsv, writeCsv } from './csv';
import { ImportError, type ImportBatch, type ImportSession } from './types';

const HEADER = ['Puzzle', 'Category', 'Time(millis)', 'Date(millis)', 'Scramble', 'Penalty', 'Comment'];

const FROM_CUBIC: Record<string, PuzzleId> = {
  '333': '333', '222': '222', '444': '444', '555': '555', '666': '666', '777': '777',
  clock: 'clock', mega: 'minx', pyra: 'pyram', skewb: 'skewb', sq1: 'sq1',
};
const TO_CUBIC: Record<PuzzleId, string> = {
  '333': '333', '222': '222', '444': '444', '555': '555', '666': '666', '777': '777',
  '333oh': '333', '333bf': '333', '444bf': '444', '555bf': '555',
  clock: 'clock', minx: 'mega', pyram: 'pyra', skewb: 'skewb', sq1: 'sq1',
};
const PENALTY_FROM: Record<string, Penalty> = { '0': 'none', '1': 'plus2', '2': 'dnf' };
const PENALTY_TO: Record<Penalty, string> = { none: '0', plus2: '1', dnf: '2' };

export function parseCubicBackup(csv: string): ImportBatch {
  const rows = readCsv(csv);
  const header = rows[0];
  if (!header || header[0] !== HEADER[0] || header[1] !== HEADER[1]) {
    throw new ImportError('Not a Cubic Timer / Twisty Timer backup file');
  }
  const sessions = new Map<string, ImportSession>();
  const batch: ImportBatch = { sessions: [], solves: [], skippedUnsupported: 0 };
  for (const r of rows.slice(1)) {
    const [code = '', category = '', time = '', date = '', scramble = '', pen = '', comment = ''] = r;
    const puzzle = FROM_CUBIC[code];
    const timeMs = Number(time);
    const createdAt = Number(date);
    const penalty = PENALTY_FROM[pen];
    if (!puzzle || !penalty || !Number.isFinite(timeMs) || timeMs < 0 || !Number.isFinite(createdAt)) {
      batch.skippedUnsupported++;
      continue;
    }
    const key = `${code}\u0000${category}`;
    if (!sessions.has(key)) sessions.set(key, { key, name: category || 'Normal', puzzle, order: sessions.size });
    batch.solves.push({ sessionKey: key, timeMs, penalty, scramble, createdAt, comment });
  }
  batch.sessions = [...sessions.values()];
  return batch;
}

export function toCubicBackup(sessions: Session[], solves: Solve[]): string {
  const byId = new Map(sessions.map(s => [s.id, s]));
  const rows: (string | number)[][] = [HEADER];
  for (const s of solves) {
    const session = byId.get(s.sessionId);
    if (!session) continue;
    rows.push([TO_CUBIC[session.puzzle], session.name, s.timeMs, s.createdAt, s.scramble, PENALTY_TO[s.penalty], s.comment]);
  }
  return writeCsv(rows);
}

export function parseCubicExternal(text: string, puzzle: PuzzleId, sessionName: string): ImportBatch {
  const key = 'external';
  const batch: ImportBatch = { sessions: [{ key, name: sessionName, puzzle }], solves: [], skippedUnsupported: 0 };
  for (const [time = '', scramble = '', date = '', comment = ''] of readCsv(text, ';')) {
    const parsed = parseTimeInput(time);
    const createdAt = Date.parse(date);
    if (!parsed || !Number.isFinite(createdAt)) {
      batch.skippedUnsupported++;
      continue;
    }
    batch.solves.push({ sessionKey: key, ...parsed, scramble, createdAt, comment });
  }
  return batch;
}
