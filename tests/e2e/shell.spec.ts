import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('session-picker')).toContainText('Session 1');
});

test('desktop shows timer and times side by side', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout');
  await expect(page.getByTestId('timer-display')).toBeVisible();
  await expect(page.getByTestId('times-list')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Times' })).toHaveCount(0);
});

test('mobile shows Timer / Times / Stats tabs', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile layout');
  for (const name of ['Timer', 'Times', 'Stats']) await expect(page.getByRole('tab', { name })).toBeVisible();
  await expect(page.getByTestId('times-list')).not.toBeInViewport();
  await page.getByRole('tab', { name: 'Times' }).click();
  await expect(page.getByTestId('times-list')).toBeInViewport();
});

test('create a session, switch to it, survive reload', async ({ page }) => {
  await page.getByTestId('session-picker').click();
  await page.getByRole('menuitem', { name: 'New session' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('OH');
  await page.getByLabel('Puzzle').click();
  await page.getByRole('option', { name: '3x3 OH' }).click();
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByTestId('session-picker')).toContainText('OH');
  await expect(page.getByTestId('puzzle-picker')).toContainText('3x3 OH');
  await page.reload();
  await expect(page.getByTestId('session-picker')).toContainText('OH');
  await expect(page.getByTestId('puzzle-picker')).toContainText('3x3 OH');
});

test('puzzle picker switches puzzle and creates a session for it', async ({ page }) => {
  await page.getByTestId('puzzle-picker').click();
  await page.getByRole('option', { name: 'Megaminx' }).click();
  await expect(page.getByTestId('puzzle-picker')).toContainText('Megaminx');
  await expect(page.getByTestId('session-picker')).toContainText('Session 1');
  await page.getByTestId('puzzle-picker').click();
  await page.getByRole('option', { name: '3x3', exact: true }).click();
  await expect(page.getByTestId('puzzle-picker')).toContainText('3x3');
});

test('deleting a session requires confirmation', async ({ page }) => {
  await page.getByTestId('session-picker').click();
  await page.getByRole('menuitem', { name: 'Rename session' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('Keep me');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('session-picker')).toContainText('Keep me');

  await page.getByTestId('session-picker').click();
  await page.getByRole('menuitem', { name: 'Delete session' }).click();
  await expect(page.getByRole('dialog')).toContainText('Delete session');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('session-picker')).toContainText('Keep me');

  await page.getByTestId('session-picker').click();
  await page.getByRole('menuitem', { name: 'Delete session' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('session-picker')).toContainText('Session 1');
});
