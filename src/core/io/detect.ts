import type { PuzzleId } from '../model';
import { parseBackupJson } from './backup';
import { parseCsTimer } from './csTimer';
import { parseCubicBackup, parseCubicExternal } from './cubicTimer';
import { ImportError, type ImportBatch } from './types';

export type ImportFormat = 'atomic' | 'cubic-backup' | 'cubic-external' | 'cstimer';

// time;scramble;date with an optional 4th comment field (real Cubic Timer exports have 4).
const EXTERNAL_LINE = /^"[^"]*";"[^"]*";"[^"]*"(;"[^"]*")?$/;

export function detectFormat(text: string): ImportFormat | null {
  const trimmed = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).trimStart();
  if (trimmed.startsWith('{')) {
    try {
      const raw: unknown = JSON.parse(trimmed);
      if (typeof raw !== 'object' || raw === null) return null;
      if ((raw as { format?: unknown }).format === 'atomic-timer') return 'atomic';
      if ('session1' in raw) return 'cstimer';
    } catch {
      return null;
    }
    return null;
  }
  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? '';
  if (firstLine.startsWith('"Puzzle","Category"')) return 'cubic-backup';
  if (EXTERNAL_LINE.test(firstLine)) return 'cubic-external';
  return null;
}

export function parseImport(text: string, opts: { externalPuzzle?: PuzzleId; externalSessionName?: string } = {}): ImportBatch {
  const format = detectFormat(text);
  let batch: ImportBatch;
  try {
    switch (format) {
      case 'atomic':
        batch = parseBackupJson(text);
        break;
      case 'cstimer':
        batch = parseCsTimer(text);
        break;
      case 'cubic-backup':
        batch = parseCubicBackup(text);
        break;
      case 'cubic-external':
        batch = parseCubicExternal(text, opts.externalPuzzle ?? '333', opts.externalSessionName ?? 'Imported');
        break;
      default:
        throw new ImportError('Unrecognized file format');
    }
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError(`Could not read the file: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (batch.solves.length === 0) throw new ImportError('This file contains no solves');
  return batch;
}
