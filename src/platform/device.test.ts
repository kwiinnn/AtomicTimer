// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';

const keepAwake = vi.fn(async () => {});
const allowSleep = vi.fn(async () => {});
const impact = vi.fn(async () => {});
let native = true;

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native } }));
vi.mock('@capacitor-community/keep-awake', () => ({ KeepAwake: { keepAwake, allowSleep } }));
vi.mock('@capacitor/haptics', () => ({ Haptics: { impact }, ImpactStyle: { Light: 'LIGHT', Heavy: 'HEAVY' } }));

beforeEach(() => {
  vi.clearAllMocks();
  native = true;
});

test('native keep-awake goes through the plugin', async () => {
  const { setKeepAwake } = await import('./device');
  await setKeepAwake(true);
  expect(keepAwake).toHaveBeenCalledTimes(1);
  await setKeepAwake(false);
  expect(allowSleep).toHaveBeenCalledTimes(1);
});
test('native vibration uses haptics', async () => {
  const { vibrate } = await import('./device');
  vibrate(400);
  expect(impact).toHaveBeenCalledWith({ style: 'HEAVY' });
});
test('web does not touch the plugins', async () => {
  native = false;
  const { setKeepAwake, isNative } = await import('./device');
  expect(isNative()).toBe(false);
  await setKeepAwake(true);
  expect(keepAwake).not.toHaveBeenCalled();
});
