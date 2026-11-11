import { expect, test, type Page } from '@playwright/test';
import { keyboardSolve, ready } from './helpers/solve';

test.skip(({ isMobile }) => isMobile, 'pointer + keyboard scenarios from the final review');
test.beforeEach(async ({ page }) => ready(page));

async function enableInspection(page: Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'WCA inspection' }).check();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.getByRole('navigation')).toHaveCount(0);
}

test('C-1: with inspection on, tapping quick buttons and dialog buttons never starts inspection', async ({ page }) => {
  await enableInspection(page);
  await page.keyboard.press('Space'); // start inspection
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '1');
  await page.getByTestId('quick-plus2').click();
  await page.getByTestId('quick-comment').click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByTestId('scramble-text').click();
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'idle');
});

test('I-1: keys typed into an open menu or select do not hit the last solve or the timer', async ({ page }) => {
  await keyboardSolve(page);
  await page.getByTestId('session-picker').click();
  await page.keyboard.press('d');
  await page.keyboard.press('2');
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('solve-row').first()).not.toHaveText(/DNF|\+$/);
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '1');
});

test('I-1: long-press on a dialog does not start the timer behind it', async ({ page }) => {
  await keyboardSolve(page);
  await page.getByTestId('quick-comment').click();
  const title = page.getByRole('dialog').getByText('Comment').first();
  const box = (await title.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '1');
});
