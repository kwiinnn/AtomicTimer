import { expect, test, type Page } from '@playwright/test';
import { keyboardSolve, ready } from './helpers/solve';

async function nav(page: Page, item: string) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: item }).click();
  // Keys are ignored while the drawer is still animating closed.
  await expect(page.getByRole('navigation')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => ready(page));

test('turning on inspection shows a 15 s countdown', async ({ page }) => {
  await nav(page, 'Settings');
  await page.getByRole('switch', { name: 'WCA inspection' }).check();
  await nav(page, 'Timer');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('timer-display')).toHaveText(/^1[45]$/);
  await page.keyboard.press('Escape');
});

test('thousandths shows three decimals', async ({ page }) => {
  await nav(page, 'Settings');
  await page.getByRole('switch', { name: 'Show thousandths' }).check();
  await nav(page, 'Timer');
  await keyboardSolve(page);
  await expect(page.getByTestId('timer-display')).toHaveText(/^\d+\.\d{3}$/);
});

test('dark theme and teal palette persist', async ({ page }) => {
  await nav(page, 'Theme');
  await page.getByRole('radio', { name: 'Dark' }).check();
  await page.getByRole('button', { name: 'Teal' }).click();
  await page.keyboard.press('Escape');
  await page.reload();
  // Teal's deep gradient (#004d40 → #01579b) behind the app.
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /rgb\(0, 77, 64\).*rgb\(1, 87, 155\)/);
});

test('about credits the inspirations and licenses', async ({ page }) => {
  await nav(page, 'About');
  await expect(page.getByRole('main')).toContainText('Cubic Timer');
  await expect(page.getByRole('main')).toContainText('Twisty Timer');
  await expect(page.getByRole('main')).toContainText('MPL-2.0');
});
