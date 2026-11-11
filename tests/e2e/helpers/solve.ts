import { expect, type Page } from '@playwright/test';

export const SCRAMBLE = /^([RLUDFB]['2]? ){10,}/;

export async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE, { timeout: 30_000 });
}

/** Hold Space, release, wait, stop. Works on both projects (the keyboard listener is on window). */
export async function keyboardSolve(page: Page, solveMs = 300) {
  const before = Number(await page.getByTestId('timer-pane').getAttribute('data-solve-count'));
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.waitForTimeout(solveMs);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', String(before + 1));
}

export async function showTimes(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('tab', { name: 'Times' }).click();
  await expect(page.getByTestId('times-list')).toBeInViewport();
}

export async function showTimer(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('tab', { name: 'Timer' }).click();
}
