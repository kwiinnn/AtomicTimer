import { describe, expect, test } from 'vitest';
import { initialTimerState, step, type TimerConfig, type TimerEffect, type TimerEvent, type TimerState } from './machine';

const plain: TimerConfig = { holdMs: 300, inspection: false };
const insp: TimerConfig = { holdMs: 300, inspection: true };
const ev = (type: 'press' | 'release' | 'tick', at: number): TimerEvent => ({ type, at });

function run(events: TimerEvent[], cfg: TimerConfig, from: TimerState = initialTimerState()) {
  let state = from;
  const effects: TimerEffect[] = [];
  for (const e of events) {
    const r = step(state, e, cfg);
    state = r.state;
    effects.push(...r.effects);
  }
  return { state, effects };
}

describe('without inspection', () => {
  test('early release returns to idle', () => {
    const r = run([ev('press', 0), ev('release', 100)], plain);
    expect(r.state).toEqual({ kind: 'idle' });
    expect(r.effects).toEqual([]);
  });
  test('hold then release starts', () => {
    const r = run([ev('press', 0), ev('tick', 300), ev('release', 350)], plain);
    expect(r.state).toEqual({ kind: 'running', startedAt: 350, penalty: 'none' });
    expect(r.effects).toEqual([{ type: 'started', at: 350 }]);
  });
  test('holdMs 0 releases start immediately', () => {
    const r = run([ev('press', 0), ev('release', 10)], { holdMs: 0, inspection: false });
    expect(r.state).toEqual({ kind: 'running', startedAt: 10, penalty: 'none' });
  });
  test('a late tick cannot turn a short press into a start (busy main thread)', () => {
    // keydown@0 and keyup@100 were queued behind a long task; the first tick runs at 350.
    const r = run([ev('press', 0), ev('tick', 350), ev('release', 100)], plain);
    expect(r.state).toEqual({ kind: 'idle' });
    expect(r.effects).toEqual([]);
  });
  test('a late tick during inspection falls back to inspecting', () => {
    const r = run([ev('release', 0), ev('press', 3000), ev('tick', 3400), ev('release', 3100)], insp);
    expect(r.state.kind).toBe('inspecting');
  });
  test('tick before hold time stays holding', () => {
    expect(run([ev('press', 0), ev('tick', 299)], plain).state.kind).toBe('holding');
  });
  test('press while running finishes, release returns to idle', () => {
    const r = run([ev('press', 0), ev('tick', 300), ev('release', 350), ev('press', 10350)], plain);
    expect(r.state).toEqual({ kind: 'stopped', timeMs: 10000, penalty: 'none' });
    expect(r.effects.at(-1)).toEqual({ type: 'finished', timeMs: 10000, penalty: 'none' });
    expect(run([ev('release', 10400)], plain, r.state).state).toEqual({ kind: 'idle' });
  });
  test('press in stopped is ignored', () => {
    const stopped: TimerState = { kind: 'stopped', timeMs: 1, penalty: 'none' };
    expect(run([ev('press', 5)], plain, stopped).state).toEqual(stopped);
  });
  test('cancel while running', () => {
    const r = run([ev('press', 0), ev('tick', 300), ev('release', 350), { type: 'cancel' }], plain);
    expect(r.state).toEqual({ kind: 'idle' });
    expect(r.effects.at(-1)).toEqual({ type: 'cancelled' });
  });
  test('holdMs 0 goes straight to ready', () => {
    expect(run([ev('press', 0)], { holdMs: 0, inspection: false }).state.kind).toBe('ready');
  });
  test('release in idle without inspection does nothing', () => {
    expect(run([ev('release', 0)], plain).state).toEqual({ kind: 'idle' });
  });
  test('blur while holding resets to idle', () => {
    expect(run([ev('press', 0), { type: 'blur' }], plain).state).toEqual({ kind: 'idle' });
  });
  test('blur while running is ignored', () => {
    const r = run([ev('press', 0), ev('tick', 300), ev('release', 350), { type: 'blur' }], plain);
    expect(r.state.kind).toBe('running');
  });
});

describe('with inspection', () => {
  test('release in idle starts inspecting', () => {
    expect(run([ev('release', 0)], insp).state).toEqual({ kind: 'inspecting', insp: { startedAt: 0, alerted: [] } });
  });
  test('inspection alerts fire once each', () => {
    const r = run([ev('release', 0), ev('tick', 8000), ev('tick', 8100), ev('tick', 12000), ev('tick', 12500)], insp);
    expect(r.effects).toEqual([{ type: 'inspectionAlert', second: 8 }, { type: 'inspectionAlert', second: 12 }]);
  });
  test('start within 15s has no penalty', () => {
    const r = run([ev('release', 0), ev('press', 5000), ev('tick', 5300), ev('release', 5400)], insp);
    expect(r.state).toEqual({ kind: 'running', startedAt: 5400, penalty: 'none' });
  });
  test('start after 15s inspection is +2', () => {
    const r = run([ev('release', 0), ev('press', 15000), ev('tick', 15300), ev('release', 15400)], insp);
    expect(r.state).toEqual({ kind: 'running', startedAt: 15400, penalty: 'plus2' });
  });
  test('inspection over 17s is DNF', () => {
    const r = run([ev('release', 0), ev('tick', 17001)], insp);
    expect(r.state).toEqual({ kind: 'stopped', timeMs: 0, penalty: 'dnf' });
    expect(r.effects.at(-1)).toEqual({ type: 'finished', timeMs: 0, penalty: 'dnf' });
  });
  test('DNF also while holding past 17s', () => {
    const r = run([ev('release', 0), ev('press', 16900), ev('tick', 17200)], insp);
    expect(r.state).toEqual({ kind: 'stopped', timeMs: 0, penalty: 'dnf' });
  });
  test('early release during inspection returns to inspecting', () => {
    const r = run([ev('release', 0), ev('press', 3000), ev('release', 3100)], insp);
    expect(r.state).toEqual({ kind: 'inspecting', insp: { startedAt: 0, alerted: [] } });
  });
  test('blur while holding returns to inspecting with original start', () => {
    const r = run([ev('release', 0), ev('press', 3000), { type: 'blur' }], insp);
    expect(r.state).toEqual({ kind: 'inspecting', insp: { startedAt: 0, alerted: [] } });
  });
  test('cancel during inspection', () => {
    const r = run([ev('release', 0), { type: 'cancel' }], insp);
    expect(r.state).toEqual({ kind: 'idle' });
    expect(r.effects).toEqual([{ type: 'cancelled' }]);
  });
});
