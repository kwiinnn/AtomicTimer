/*
 * csTimer export (JSON), implemented from the documented export shape:
 *   { "session1": [ [[penalty, timeMs, ...phases], scramble, comment, unixSeconds], ... ], ...,
 *     "properties": { "sessionData": "<JSON string: { \"1\": { name, opt: { scrType? } } }>" } }
 * penalty: 0 = none, 2000 = +2, -1 = DNF.
 */
import type { Penalty, PuzzleId } from '../model';
import { ImportError, type ImportBatch, type ImportSession } from './types';

const SCR_TYPES: Record<string, PuzzleId> = {
  '333': '333', '222so': '222', '444wca': '444', '555wca': '555', '666wca': '666', '777wca': '777',
  '333oh': '333oh', '333ni': '333bf', '444bld': '444bf', '555bld': '555bf', clkwca: 'clock',
  mgmp: 'minx', pyrso: 'pyram', skbso: 'skewb', sqrs: 'sq1',
};

type SessionMeta = { name?: unknown; opt?: { scrType?: unknown } };

function readSessionData(props: unknown): Record<string, SessionMeta> {
  if (typeof props !== 'object' || props === null) return {};
  const raw = (props as { sessionData?: unknown }).sessionData;
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, SessionMeta>) : {};
  } catch {
    return {};
  }
}

function penaltyOf(p: unknown): Penalty | null {
  if (p === 0) return 'none';
  if (p === 2000) return 'plus2';
  if (p === -1) return 'dnf';
  return null;
}

export function parseCsTimer(json: string): ImportBatch {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new ImportError('The file is not valid JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new ImportError('Not a csTimer export');
  const root = raw as Record<string, unknown>;
  const meta = readSessionData(root.properties);
  const batch: ImportBatch = { sessions: [], solves: [], skippedUnsupported: 0 };

  const keys = Object.keys(root)
    .filter(k => /^session\d+$/.test(k))
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
  for (const key of keys) {
    const n = Number(key.slice(7));
    const m = meta[String(n)] ?? {};
    const scrType = typeof m.opt?.scrType === 'string' ? m.opt.scrType : '333';
    const name = m.name === undefined || m.name === null || m.name === '' ? `csTimer ${n}` : String(m.name);
    const session: ImportSession = { key, name, puzzle: SCR_TYPES[scrType] ?? '333', order: n };
    batch.sessions.push(session);

    const list = root[key];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      const result = Array.isArray(entry) ? entry[0] : undefined;
      const penalty = Array.isArray(result) ? penaltyOf(result[0]) : null;
      const timeMs = Array.isArray(result) ? result[1] : undefined;
      const ts = Array.isArray(entry) ? entry[3] : undefined;
      if (!penalty || typeof timeMs !== 'number' || !Number.isFinite(timeMs) || timeMs < 0 || typeof ts !== 'number') {
        batch.skippedUnsupported++;
        continue;
      }
      const e = entry as unknown[];
      batch.solves.push({
        sessionKey: key,
        timeMs,
        penalty,
        scramble: typeof e[1] === 'string' ? e[1] : '',
        comment: typeof e[2] === 'string' ? e[2] : '',
        createdAt: ts * 1000,
      });
    }
  }
  return batch;
}
