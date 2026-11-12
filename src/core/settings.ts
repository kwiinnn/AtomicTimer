import type { DnfRule } from './stats/average';

export type PaletteId =
  | 'indigo' | 'teal' | 'red' | 'orange' | 'green' | 'purple' | 'blueGrey' | 'pink'
  | 'aurora' | 'sunset' | 'ocean' | 'midnight' | 'forest' | 'candy' | 'graphite';
export const PALETTE_IDS: PaletteId[] = [
  'indigo', 'teal', 'red', 'orange', 'green', 'purple', 'blueGrey', 'pink',
  'aurora', 'sunset', 'ocean', 'midnight', 'forest', 'candy', 'graphite',
];
/** A preset theme, or the user's own gradient (`customTheme`). */
export type PaletteChoice = PaletteId | 'custom';
export type ThemeMode = 'system' | 'light' | 'dark';
export type TimerFontId = 'quicksand' | 'mono' | 'digital' | 'lcd' | 'system';
export const TIMER_FONT_IDS: TimerFontId[] = ['quicksand', 'mono', 'digital', 'lcd', 'system'];

export interface CustomTheme {
  /** Gradient start and end colours, #rrggbb. */
  from: string;
  to: string;
  /** CSS linear-gradient angle in degrees, 0–360. */
  angle: number;
  /** Accent (buttons, toolbar highlights), #rrggbb. */
  accent: string;
}

export interface Settings {
  version: 1;
  holdMs: number;
  inspection: boolean;
  inspectionAlerts: boolean;
  thousandths: boolean;
  manualEntry: boolean;
  trimPct: number;
  dnfRule: DnfRule;
  showSessionStats: boolean;
  showTodayStats: boolean;
  discreteGraph: boolean;
  timerTextScale: number;
  scrambleTextScale: number;
  themeMode: ThemeMode;
  palette: PaletteChoice;
  customTheme: CustomTheme;
  /** Show the user's uploaded background image (stored separately) over the gradient. */
  backgroundImage: boolean;
  /** How much the theme colour dims the background image, 0–0.9. */
  backgroundDim: number;
  timerFont: TimerFontId;
  backupReminder: boolean;
  lastBackupAt: number | null;
  currentSessionId: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  holdMs: 300,
  inspection: false,
  inspectionAlerts: true,
  thousandths: false,
  manualEntry: false,
  trimPct: 5,
  dnfRule: 'wca',
  showSessionStats: true,
  showTodayStats: false,
  discreteGraph: false,
  timerTextScale: 1,
  scrambleTextScale: 1,
  themeMode: 'system',
  palette: 'indigo',
  customTheme: { from: '#1a237e', to: '#6a1b9a', angle: 135, accent: '#ff4081' },
  backgroundImage: false,
  backgroundDim: 0.4,
  timerFont: 'quicksand',
  backupReminder: true,
  lastBackupAt: null,
  currentSessionId: null,
};

const ENUMS: Partial<Record<keyof Settings, readonly unknown[]>> = {
  dnfRule: ['wca', 'strict'],
  themeMode: ['system', 'light', 'dark'],
  palette: [...PALETTE_IDS, 'custom'],
  timerFont: TIMER_FONT_IDS,
};

/** '#abc' / '#AABBCC' → '#aabbcc'; anything else → null. */
export function normalizeHex(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim());
  if (!m) return null;
  const hex = m[1]!.toLowerCase();
  return `#${hex.length === 3 ? [...hex].map(c => c + c).join('') : hex}`;
}

function migrateCustomTheme(raw: unknown): CustomTheme {
  const d = DEFAULT_SETTINGS.customTheme;
  if (typeof raw !== 'object' || raw === null) return { ...d };
  const r = raw as Record<string, unknown>;
  const angle = typeof r.angle === 'number' && Number.isFinite(r.angle) && r.angle >= 0 && r.angle <= 360 ? r.angle : d.angle;
  return {
    from: normalizeHex(r.from) ?? d.from,
    to: normalizeHex(r.to) ?? d.to,
    angle,
    accent: normalizeHex(r.accent) ?? d.accent,
  };
}
const NULLABLE: (keyof Settings)[] = ['lastBackupAt', 'currentSessionId'];
const NULLABLE_TYPES: Partial<Record<keyof Settings, string>> = { lastBackupAt: 'number', currentSessionId: 'string' };

/** Defaults overlaid with every known key from `raw` whose type (and enum domain) matches. */
export function migrateSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (key === 'version' || !(key in src)) continue;
    const v = src[key];
    if (key === 'customTheme') {
      out.customTheme = migrateCustomTheme(v);
      continue;
    }
    if (key === 'backgroundDim') {
      if (typeof v === 'number' && v >= 0 && v <= 0.9) out.backgroundDim = v;
      continue;
    }
    const enumDomain = ENUMS[key];
    let ok: boolean;
    if (NULLABLE.includes(key)) ok = v === null || typeof v === NULLABLE_TYPES[key];
    else if (enumDomain) ok = enumDomain.includes(v);
    else ok = typeof v === typeof DEFAULT_SETTINGS[key] && !(typeof v === 'number' && !Number.isFinite(v));
    if (ok) (out as unknown as Record<string, unknown>)[key] = v;
  }
  return out;
}
