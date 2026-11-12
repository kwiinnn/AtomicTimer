import type { Page } from '@playwright/test';

/** Waits until the persisted app settings (IndexedDB) satisfy `match`, so a reload cannot abort the write. */
export async function waitForSavedSettings(page: Page, match: Record<string, unknown>) {
  await page.waitForFunction(async expected => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('atomic-timer');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    try {
      const row = await new Promise<{ value?: Record<string, unknown> } | undefined>((resolve, reject) => {
        const req = db.transaction('settings').objectStore('settings').get('app');
        req.onsuccess = () => resolve(req.result as { value?: Record<string, unknown> } | undefined);
        req.onerror = () => reject(req.error);
      });
      return Object.entries(expected).every(([k, v]) => row?.value?.[k] === v);
    } finally {
      db.close();
    }
  }, match);
}
