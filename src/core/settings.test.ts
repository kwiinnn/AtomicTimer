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

test('theme defaults', () => {
  expect(DEFAULT_SETTINGS).toMatchObject({
    palette: 'indigo',
    customTheme: { from: '#1a237e', to: '#6a1b9a', angle: 135, accent: '#ff4081' },
    backgroundImage: false,
    backgroundDim: 0.4,
    timerFont: 'quicksand',
  });
});
test('new gradient presets and custom are valid palette values', () => {
  expect(migrateSettings({ palette: 'aurora' }).palette).toBe('aurora');
  expect(migrateSettings({ palette: 'custom' }).palette).toBe('custom');
  expect(migrateSettings({ palette: 'neon' }).palette).toBe('indigo');
});
test('custom theme is validated field by field', () => {
  const s = migrateSettings({ customTheme: { from: '#000000', to: 'red', angle: 400, accent: '#abc' } });
  expect(s.customTheme).toEqual({ from: '#000000', to: '#6a1b9a', angle: 135, accent: '#aabbcc' });
  expect(migrateSettings({ customTheme: 'x' }).customTheme).toEqual(DEFAULT_SETTINGS.customTheme);
});
test('background dim and timer font are range/enum checked', () => {
  expect(migrateSettings({ backgroundDim: 2 }).backgroundDim).toBe(0.4);
  expect(migrateSettings({ backgroundDim: 0.7 }).backgroundDim).toBe(0.7);
  expect(migrateSettings({ timerFont: 'lcd' }).timerFont).toBe('lcd');
  expect(migrateSettings({ timerFont: 'comic' }).timerFont).toBe('quicksand');
});
