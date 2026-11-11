import { expect, test, type Page } from '@playwright/test';
import { join } from 'node:path';
import { showTimes } from './helpers/solve';

const fixture = (f: string) => join(import.meta.dirname, 'fixtures', f);

async function openIo(page: Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Import / Export' }).click();
}

async function importFile(page: Page, path: string) {
  await page.getByTestId('import-input').setInputFiles(path);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?e2e=1');
  await expect(page.getByTestId('session-picker')).toContainText('Session 1');
});

test('csTimer import creates sessions and is idempotent', async ({ page }) => {
  await openIo(page);
  await importFile(page, fixture('cstimer.sample.json'));
  const summary = page.getByRole('dialog', { name: 'Import complete' });
  await expect(summary).toContainText('2 sessions created');
  await expect(summary).toContainText('4 solves added');
  await summary.getByRole('button', { name: 'OK' }).click();

  await importFile(page, fixture('cstimer.sample.json'));
  await expect(summary).toContainText('0 solves added');
  await expect(summary).toContainText('4 duplicates skipped');
  await summary.getByRole('button', { name: 'OK' }).click();

  await page.getByTestId('puzzle-picker').click();
  await page.getByRole('option', { name: '3x3 OH' }).click();
  await expect(page.getByTestId('session-picker')).toContainText('OH grind');
});

test('Cubic Timer external file asks for puzzle and session name', async ({ page }) => {
  await openIo(page);
  await importFile(page, fixture('cubic-external.sample.txt'));
  const ask = page.getByRole('dialog', { name: 'Import Cubic Timer times' });
  await ask.getByRole('textbox', { name: 'Session name' }).fill('Old 4x4');
  await ask.getByLabel('Puzzle').click();
  await page.getByRole('option', { name: '4x4', exact: true }).click();
  await ask.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('dialog', { name: 'Import complete' })).toContainText('3 solves added');
});

test('garbage shows an error and writes nothing', async ({ page }) => {
  await openIo(page);
  await importFile(page, fixture('garbage.txt'));
  await expect(page.getByRole('dialog', { name: 'Import failed' })).toContainText('Unrecognized file format');
});

test('JSON backup restores into a fresh browser', async ({ page, browser, isMobile }) => {
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!([5000, 6000, 7000, 8000, 9000, 10000]));
  await openIo(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup (JSON)' }).click();
  const file = await (await download).path();
  expect(file).toBeTruthy();

  const fresh = await browser.newContext(isMobile ? { viewport: { width: 412, height: 839 }, isMobile: true, hasTouch: true } : {});
  const p2 = await fresh.newPage();
  await p2.goto('/');
  await expect(p2.getByTestId('session-picker')).toContainText('Session 1');
  await openIo(p2);
  await importFile(p2, file!);
  await expect(p2.getByRole('dialog', { name: 'Import complete' })).toContainText('6 solves added');
  await p2.getByRole('button', { name: 'OK' }).click();
  await p2.getByRole('button', { name: 'Open menu' }).click();
  await p2.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await showTimes(p2, isMobile);
  await expect(p2.getByTestId('solve-row')).toHaveCount(6);
  await fresh.close();
});

test('Cubic Timer CSV export downloads a file', async ({ page }) => {
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!([5000]));
  await openIo(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Cubic Timer CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/^atomic-timer-cubic-\d{4}-\d{2}-\d{2}\.csv$/);
});
