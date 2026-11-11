import type { Penalty } from '../model';

export type Insp = { startedAt: number; alerted: (8 | 12)[] } | null;

export type TimerState =
  | { kind: 'idle' }
  | { kind: 'inspecting'; insp: NonNullable<Insp> }
  | { kind: 'holding'; since: number; insp: Insp }
  | { kind: 'ready'; insp: Insp }
  | { kind: 'running'; startedAt: number; penalty: Penalty }
  | { kind: 'stopped'; timeMs: number; penalty: Penalty };

export type TimerEvent = { type: 'press' | 'release' | 'tick'; at: number } | { type: 'cancel' } | { type: 'blur' };

export type TimerEffect =
  | { type: 'inspectionAlert'; second: 8 | 12 }
  | { type: 'started'; at: number }
  | { type: 'finished'; timeMs: number; penalty: Penalty }
  | { type: 'cancelled' };

export interface TimerConfig {
  holdMs: number;
  inspection: boolean;
}

export const INSPECTION = { alertsMs: [8000, 12000], plus2AfterMs: 15000, dnfAfterMs: 17000 } as const;

export function initialTimerState(): TimerState {
  return { kind: 'idle' };
}

type Result = { state: TimerState; effects: TimerEffect[] };
const stay = (state: TimerState): Result => ({ state, effects: [] });
const IDLE: TimerState = { kind: 'idle' };

/** Fall back from holding/ready to wherever the hold began. */
const unhold = (insp: Insp): TimerState => (insp ? { kind: 'inspecting', insp } : IDLE);

/** Emits due inspection alerts and the 17 s DNF. Returns null when nothing changes. */
function inspectionTick(state: TimerState & { insp: Insp }, at: number): Result | null {
  const insp = state.insp;
  if (!insp) return null;
  const elapsed = at - insp.startedAt;
  const effects: TimerEffect[] = [];
  const alerted = [...insp.alerted];
  for (const ms of INSPECTION.alertsMs) {
    const second = (ms / 1000) as 8 | 12;
    if (elapsed >= ms && !alerted.includes(second)) {
      alerted.push(second);
      effects.push({ type: 'inspectionAlert', second });
    }
  }
  if (elapsed > INSPECTION.dnfAfterMs) {
    effects.push({ type: 'finished', timeMs: 0, penalty: 'dnf' });
    return { state: { kind: 'stopped', timeMs: 0, penalty: 'dnf' }, effects };
  }
  if (effects.length === 0) return null;
  return { state: { ...state, insp: { ...insp, alerted } }, effects };
}

export function step(s: TimerState, e: TimerEvent, cfg: TimerConfig): Result {
  if (e.type === 'cancel') {
    if (s.kind === 'idle' || s.kind === 'stopped') return stay(s);
    return { state: IDLE, effects: [{ type: 'cancelled' }] };
  }
  if (e.type === 'blur') {
    if (s.kind === 'holding' || s.kind === 'ready') return stay(unhold(s.insp));
    return stay(s);
  }

  const startHold = (insp: Insp): TimerState =>
    cfg.holdMs <= 0 ? { kind: 'ready', insp } : { kind: 'holding', since: e.at, insp };

  switch (s.kind) {
    case 'idle':
      if (e.type === 'press' && !cfg.inspection) return stay(startHold(null));
      if (e.type === 'release' && cfg.inspection) {
        return stay({ kind: 'inspecting', insp: { startedAt: e.at, alerted: [] } });
      }
      return stay(s);

    case 'inspecting':
      if (e.type === 'press') return stay(startHold(s.insp));
      if (e.type === 'tick') return inspectionTick(s, e.at) ?? stay(s);
      return stay(s);

    case 'holding':
      if (e.type === 'release') return stay(unhold(s.insp));
      if (e.type === 'tick') {
        const r = inspectionTick(s, e.at);
        if (r && r.state.kind === 'stopped') return r;
        const cur = (r?.state ?? s) as Extract<TimerState, { kind: 'holding' }>;
        if (e.at - s.since >= cfg.holdMs) return { state: { kind: 'ready', insp: cur.insp }, effects: r?.effects ?? [] };
        return r ?? stay(s);
      }
      return stay(s);

    case 'ready':
      if (e.type === 'release') {
        const late = s.insp !== null && e.at - s.insp.startedAt > INSPECTION.plus2AfterMs;
        const penalty: Penalty = late ? 'plus2' : 'none';
        return { state: { kind: 'running', startedAt: e.at, penalty }, effects: [{ type: 'started', at: e.at }] };
      }
      if (e.type === 'tick') return inspectionTick(s, e.at) ?? stay(s);
      return stay(s);

    case 'running':
      if (e.type === 'press') {
        const timeMs = Math.round(e.at - s.startedAt);
        return {
          state: { kind: 'stopped', timeMs, penalty: s.penalty },
          effects: [{ type: 'finished', timeMs, penalty: s.penalty }],
        };
      }
      return stay(s);

    case 'stopped':
      if (e.type === 'release') return stay(IDLE);
      return stay(s);
  }
}
