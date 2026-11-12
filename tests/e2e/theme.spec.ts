import { expect, test } from '@playwright/test';
import { join } from 'node:path';
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

async function openTheme(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Theme' }).click();
  await expect(page.getByRole('heading', { name: 'Theme', exact: true })).toBeVisible();
}

test('picking a preset changes the background', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('button', { name: 'Ocean', exact: true }).click();
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /rgb\(225, 245, 254\)/);
  await expect(page.getByRole('button', { name: 'Ocean', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('custom gradient editor previews live and persists', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  await page.getByLabel('Gradient start').fill('#000000');
  await page.getByLabel('Gradient end').fill('#203a43');
  await page.getByLabel('Accent').fill('#ff9800');
  const angle = page.getByRole('slider', { name: 'Angle' });
  await angle.focus();
  await page.keyboard.press('End');
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /360deg.*rgb\(0, 0, 0\).*rgb\(32, 58, 67\)/);
  // Dark custom colours get light text automatically.
  await expect(page.locator('header')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.reload();
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /rgb\(0, 0, 0\).*rgb\(32, 58, 67\)/);
});

test('background image: upload, dim, persist, remove', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByTestId('background-input').setInputFiles(join(import.meta.dirname, 'fixtures', 'background.png'));
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /url\("blob:/);
  await expect(page.getByRole('switch', { name: 'Show background image' })).toBeChecked();
  const dim = page.getByRole('slider', { name: 'Dim' });
  await dim.focus();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /rgba\([^)]*, 0\)/);

  await page.reload();
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /url\("blob:/);

  await openTheme(page);
  await page.getByRole('button', { name: 'Remove image' }).click();
  await expect(page.getByTestId('app-background')).not.toHaveCSS('background-image', /url\(/);
});
