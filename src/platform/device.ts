import { KeepAwake } from '@capacitor-community/keep-awake';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = (): boolean => Capacitor.isNativePlatform();

let wakeLock: WakeLockSentinel | null = null;

/** Keeps the screen on while a solve is running. Best-effort on every platform. */
export async function setKeepAwake(on: boolean): Promise<void> {
  try {
    if (isNative()) {
      await (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep());
      return;
    }
    if (on && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    // denied when hidden, or unsupported
  }
}

export function vibrate(ms: number): void {
  try {
    if (isNative()) void Haptics.impact({ style: ms >= 300 ? ImpactStyle.Heavy : ImpactStyle.Light });
    else navigator.vibrate?.(ms);
  } catch {
    // unsupported
  }
}
