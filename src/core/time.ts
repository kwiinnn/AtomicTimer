import type { Penalty } from './model';

const pad = (n: number, width: number) => String(n).padStart(width, '0');

/** Effective time in ms: +2 adds 2000, DNF is Infinity. */
export function effectiveTime(s: { timeMs: number; penalty: Penalty }): number {
  if (s.penalty === 'dnf') return Infinity;
  return s.penalty === 'plus2' ? s.timeMs + 2000 : s.timeMs;
}

/** Formats an exact multiple of the display unit. */
function render(ms: number, thousandths: boolean): string {
  const unit = thousandths ? 1 : 10;
  const totalUnits = Math.round(ms / unit);
  const frac = totalUnits % (1000 / unit);
  const totalSec = Math.floor(totalUnits / (1000 / unit));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const fracStr = pad(frac, thousandths ? 3 : 2);
  if (h > 0) return `${h}:${pad(m, 2)}:${pad(s, 2)}.${fracStr}`;
  if (m > 0) return `${m}:${pad(s, 2)}.${fracStr}`;
  return `${s}.${fracStr}`;
}

/** Single times are truncated to the display unit (WCA style). */
export function formatTime(ms: number, thousandths = false): string {
  if (!Number.isFinite(ms)) return 'DNF';
  const unit = thousandths ? 1 : 10;
  return render(Math.floor(ms / unit) * unit, thousandths);
}

/** Averages are rounded to the nearest display unit. */
export function formatAverage(ms: number, thousandths = false): string {
  if (!Number.isFinite(ms)) return 'DNF';
  const unit = thousandths ? 1 : 10;
  return render(Math.round(ms / unit) * unit, thousandths);
}

export function formatSolve(s: { timeMs: number; penalty: Penalty }, thousandths = false): string {
  if (s.penalty === 'dnf') return 'DNF';
  const t = formatTime(effectiveTime(s), thousandths);
  return s.penalty === 'plus2' ? `${t}+` : t;
}

const SECONDS_RE = /^(\d+)(?:\.(\d{1,3}))?$/;

/**
 * Parses typed times: "1:02.42", "46.5", "1:02:03.45", digits-only "1234" (= 12.34, csTimer style),
 * an optional trailing "+" for +2, and "DNF".
 */
export function parseTimeInput(input: string): { timeMs: number; penalty: Penalty } | null {
  let text = input.trim().toLowerCase();
  if (text === 'dnf') return { timeMs: 0, penalty: 'dnf' };
  let penalty: Penalty = 'none';
  if (text.endsWith('+')) {
    penalty = 'plus2';
    text = text.slice(0, -1).trim();
  }
  let ms: number | null;
  if (/^\d+$/.test(text)) {
    const hund = Number(text.slice(-2));
    const sec = Number(text.slice(-4, -2) || '0');
    const min = Number(text.slice(0, -4) || '0');
    if (text.length > 4 && sec >= 60) return null;
    ms = (min * 60 + sec) * 1000 + hund * 10;
  } else {
    ms = parseClock(text);
  }
  if (ms === null || ms <= 0) return null;
  return { timeMs: ms, penalty };
}

function parseClock(text: string): number | null {
  const parts = text.split(':');
  if (parts.length > 3) return null;
  const secMatch = SECONDS_RE.exec(parts[parts.length - 1]!);
  if (!secMatch) return null;
  const sec = Number(secMatch[1]);
  const frac = Number((secMatch[2] ?? '').padEnd(3, '0'));
  const upper = parts.slice(0, -1);
  if (upper.some(p => !/^\d+$/.test(p))) return null;
  if (upper.length > 0 && sec >= 60) return null;
  let minutes = 0;
  if (upper.length === 1) minutes = Number(upper[0]);
  if (upper.length === 2) {
    const m = Number(upper[1]);
    if (m >= 60) return null;
    minutes = Number(upper[0]) * 60 + m;
  }
  return (minutes * 60 + sec) * 1000 + frac;
}
