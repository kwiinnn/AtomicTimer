import { expect, test } from '@playwright/test';
import { ready } from './helpers/solve';

const bgImage = (page: import('@playwright/test').Page, testId: string) =>
  page.getByTestId(testId).evaluate(el => getComputedStyle(el).backgroundImage);

test('the theme gradient sits behind the whole app', async ({ page }) => {
  await ready(page);
  expect(await bgImage(page, 'app-background')).toContain('linear-gradient');
  // Default indigo, light (Playwright's colour scheme is light).
  expect(await bgImage(page, 'app-background')).toContain('rgb(232, 234, 246)');
  // Chrome is translucent over the gradient, not a solid bar.
  expect(await page.locator('header').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});

test('the focus view shows the gradient too', async ({ page }) => {
  await ready(page);
  await page.keyboard.down('Space');
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'ready');
  expect(await bgImage(page, 'timer-display')).toContain('linear-gradient');
  await page.keyboard.up('Space');
  await page.keyboard.press('Space');
});

test('dark mode switches to the deep variant', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await ready(page);
  expect(await bgImage(page, 'app-background')).toContain('rgb(26, 35, 126)');
});
