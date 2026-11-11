// Web implementations; native (Capacitor) branches are added in the Capacitor task.

let wakeLock: WakeLockSentinel | null = null;

export async function setKeepAwake(on: boolean): Promise<void> {
  try {
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
    // Wake Lock is best-effort (denied when the page is hidden or unsupported).
  }
}

export function vibrate(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // unsupported
  }
}
