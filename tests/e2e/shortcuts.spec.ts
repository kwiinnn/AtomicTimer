import { expect, test } from '@playwright/test';
import { keyboardSolve, ready, showTimes } from './helpers/solve';

test.skip(({ isMobile }) => isMobile, 'keyboard shortcuts are a desktop feature');
test.beforeEach(async ({ page }) => ready(page));

test('2 toggles +2 on the last solve', async ({ page, isMobile }) => {
  await keyboardSolve(page);
  await page.keyboard.press('2');
  await showTimes(page, isMobile);
  await expect(page.getByTestId('solve-row').first()).toHaveText(/\+$/);
});
test('D toggles DNF', async ({ page }) => {
  await keyboardSolve(page);
  await page.keyboard.press('d');
  await expect(page.getByTestId('solve-row').first()).toHaveText(/DNF/);
});
test('Delete then undo restores the solve', async ({ page }) => {
  await keyboardSolve(page);
  await page.keyboard.press('Delete');
  await expect(page.getByTestId('solve-row')).toHaveCount(0);
  await page.getByTestId('undo-button').click();
  await expect(page.getByTestId('solve-row')).toHaveCount(1);
});
test('N changes the scramble', async ({ page }) => {
  const before = await page.getByTestId('scramble-text').textContent();
  await page.keyboard.press('n');
  await expect(page.getByTestId('scramble-text')).not.toHaveText(before!);
});
test('C opens the comment dialog and typing there does not trigger shortcuts', async ({ page }) => {
  await keyboardSolve(page);
  await page.keyboard.press('c');
  await page.getByRole('textbox', { name: 'Comment' }).pressSequentially('2 dnf');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('solve-row').first()).not.toHaveText(/DNF|\+$/);
});
test('P and S open the pickers; ? shows the overlay', async ({ page }) => {
  await page.keyboard.press('p');
  await expect(page.getByRole('listbox', { name: 'Choose puzzle' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await page.keyboard.press('s');
  await expect(page.getByRole('menuitem', { name: 'New session' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});
