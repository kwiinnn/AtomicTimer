import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings } from './settings';

test('defaults match the spec', () => {
  expect(DEFAULT_SETTINGS).toMatchObject({
    version: 1, holdMs: 300, inspection: false, inspectionAlerts: true, thousandths: false, manualEntry: false,
    trimPct: 5, dnfRule: 'wca', showSessionStats: true, showTodayStats: false, discreteGraph: false,
    timerTextScale: 1, scrambleTextScale: 1, themeMode: 'system', palette: 'indigo', backupReminder: true,
    lastBackupAt: null, currentSessionId: null,
  });
});
test('empty or garbage input gives defaults', () => {
  expect(migrateSettings({})).toEqual(DEFAULT_SETTINGS);
  expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS);
  expect(migrateSettings('x')).toEqual(DEFAULT_SETTINGS);
});
test('keeps known keys of the right type, drops the rest', () => {
  const s = migrateSettings({ holdMs: 550, bogus: 1, inspection: 'yes', currentSessionId: 'abc', lastBackupAt: 5 });
  expect(s.holdMs).toBe(550);
  expect(s.inspection).toBe(false);
  expect(s.currentSessionId).toBe('abc');
  expect(s.lastBackupAt).toBe(5);
  expect('bogus' in s).toBe(false);
});
test('rejects out-of-domain enum values', () => {
  const s = migrateSettings({ dnfRule: 'lenient', palette: 'neon', themeMode: 'dark' });
  expect([s.dnfRule, s.palette, s.themeMode]).toEqual(['wca', 'indigo', 'dark']);
});
