import { expect, test } from '@playwright/test';
import { keyboardSolve, ready, showTimer, showTimes } from './helpers/solve';

test.beforeEach(async ({ page }) => ready(page));

test('penalty toggle shows in the list', async ({ page, isMobile }) => {
  await keyboardSolve(page);
  await page.getByTestId('quick-plus2').click();
  await showTimes(page, isMobile);
  await expect(page.getByTestId('solve-row').first()).toHaveText(/\d\+/);
  await showTimer(page, isMobile);
  await page.getByTestId('quick-plus2').click();
  await showTimes(page, isMobile);
  await expect(page.getByTestId('solve-row').first()).not.toHaveText(/\d\+/);
});

test('delete and undo', async ({ page, isMobile }) => {
  await keyboardSolve(page);
  await showTimes(page, isMobile);
  const text = await page.getByTestId('solve-row').first().textContent();
  await showTimer(page, isMobile);
  await page.getByTestId('quick-delete').click();
  await expect(page.getByTestId('solve-row')).toHaveCount(0);
  await page.getByTestId('undo-button').click();
  await expect(page.getByTestId('solve-row')).toHaveCount(1);
  await showTimes(page, isMobile);
  await expect(page.getByTestId('solve-row').first()).toHaveText(text!);
});

test('newest solve is first', async ({ page, isMobile }) => {
  await keyboardSolve(page, 200);
  await keyboardSolve(page, 1200);
  await showTimes(page, isMobile);
  const first = Number((await page.getByTestId('solve-row').first().textContent())!.replace(/[^\d.]/g, ''));
  expect(first).toBeGreaterThan(1);
});

test('solve sheet shows the scramble and can set DNF', async ({ page, isMobile }) => {
  const scramble = (await page.getByTestId('scramble-text').textContent())!;
  await keyboardSolve(page);
  await showTimes(page, isMobile);
  await page.getByTestId('solve-row').first().click();
  const sheet = page.getByTestId('solve-sheet');
  await expect(sheet).toContainText(scramble);
  await sheet.getByRole('button', { name: 'DNF' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('solve-row').first()).toHaveText(/DNF/);
});

test('comment persists after reload', async ({ page, isMobile }) => {
  await keyboardSolve(page);
  await page.getByTestId('quick-comment').click();
  await page.getByRole('textbox', { name: 'Comment' }).fill('sub-10 pace');
  await page.getByRole('button', { name: 'Save' }).click();
  // The dialog closes once the write has committed; reloading earlier would abort it.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await showTimes(page, isMobile);
  await page.getByTestId('solve-row').first().click();
  await expect(page.getByTestId('solve-sheet')).toContainText('sub-10 pace');
});
