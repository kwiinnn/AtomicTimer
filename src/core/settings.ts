import type { DnfRule } from './stats/average';

export type PaletteId = 'indigo' | 'teal' | 'red' | 'orange' | 'green' | 'purple' | 'blueGrey' | 'pink';
export const PALETTE_IDS: PaletteId[] = ['indigo', 'teal', 'red', 'orange', 'green', 'purple', 'blueGrey', 'pink'];
export type ThemeMode = 'system' | 'light' | 'dark';

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
  palette: PaletteId;
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
  backupReminder: true,
  lastBackupAt: null,
  currentSessionId: null,
};

const ENUMS: Partial<Record<keyof Settings, readonly unknown[]>> = {
  dnfRule: ['wca', 'strict'],
  themeMode: ['system', 'light', 'dark'],
  palette: PALETTE_IDS,
};
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
    const enumDomain = ENUMS[key];
    let ok: boolean;
    if (NULLABLE.includes(key)) ok = v === null || typeof v === NULLABLE_TYPES[key];
    else if (enumDomain) ok = enumDomain.includes(v);
    else ok = typeof v === typeof DEFAULT_SETTINGS[key] && !(typeof v === 'number' && !Number.isFinite(v));
    if (ok) (out as unknown as Record<string, unknown>)[key] = v;
  }
  return out;
}
