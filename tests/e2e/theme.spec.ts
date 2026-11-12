import { expect, test } from '@playwright/test';
import { join } from 'node:path';
import { waitForSavedSettings } from './helpers/db';
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
  // The drawer fades out over the page; wait so clicks land on the page itself.
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
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
  await waitForSavedSettings(page, { palette: 'custom' });
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

test('timer font choice applies to the timer and persists', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('radiogroup', { name: 'Timer font' }).getByRole('radio', { name: /LCD/ }).check();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.getByTestId('timer-display')).toHaveCSS('font-family', /DSEG7 Classic/);
  await waitForSavedSettings(page, { timerFont: 'lcd' });
  expect(await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('700 48px "DSEG7 Classic"');
  })).toBe(true);
  await page.reload();
  await expect(page.getByTestId('timer-display')).toHaveCSS('font-family', /DSEG7 Classic/);
});

test('any catalogue font can be the timer font', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('radiogroup', { name: 'Timer font' }).getByRole('radio', { name: 'Newsreader' }).check();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.getByTestId('timer-display')).toHaveCSS('font-family', /Newsreader/);
  expect(await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('700 48px "Newsreader"');
  })).toBe(true);
});

test('app font applies to the whole interface; timer can follow it', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('radiogroup', { name: 'App font' }).getByRole('radio', { name: 'Source Serif 4' }).check();
  await expect(page.getByRole('heading', { name: 'Theme', exact: true })).toHaveCSS('font-family', /Source Serif 4/);
  await expect(page.locator('header button').first()).toBeVisible();
  await expect(page.getByTestId('puzzle-picker')).toHaveCSS('font-family', /Source Serif 4/);
  // Display faces are timer-only.
  await expect(page.getByRole('radiogroup', { name: 'App font' }).getByRole('radio', { name: /LCD/ })).toHaveCount(0);

  await page.getByRole('radiogroup', { name: 'Timer font' }).getByRole('radio', { name: 'Same as app font' }).check();
  await waitForSavedSettings(page, { appFont: 'sourceSerif', timerFont: 'app' });
  await page.reload();
  await expect(page.getByTestId('timer-display')).toHaveCSS('font-family', /Source Serif 4/);
  await expect(page.getByTestId('scramble-text')).toHaveCSS('font-family', /Source Serif 4/);
});

test('a chosen font keeps working offline after first use', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'one project is enough for the service worker check');
  await ready(page);
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active?.state !== 'activated') await new Promise<void>(r => reg.active?.addEventListener('statechange', () => r()));
  });
  // Reload so the service worker controls the page (and can cache fonts it fetches).
  await page.reload();
  await expect(page.getByTestId('scramble-text')).toHaveText(/\S/, { timeout: 30_000 });
  await openTheme(page);
  await page.getByRole('radiogroup', { name: 'App font' }).getByRole('radio', { name: 'Inter' }).check();
  await waitForSavedSettings(page, { appFont: 'inter' });
  expect(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('500 16px "Inter"'); })).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('puzzle-picker')).toHaveCSS('font-family', /Inter/);
  expect(await page.evaluate(async () => {
    await document.fonts.load('500 16px "Inter"');
    return document.fonts.check('500 16px "Inter"');
  })).toBe(true);
});

async function openSettings(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
}
const settingsPaper = (page: import('@playwright/test').Page) => page.locator('main .MuiPaper-root').first();

test('material stays the default style', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await expect(page.getByRole('button', { name: 'Material', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('style choice restyles surfaces and persists', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Liquid Glass', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await openSettings(page);
  await expect(settingsPaper(page)).toHaveCSS('border-radius', '24px');
  await expect(settingsPaper(page)).toHaveCSS('backdrop-filter', /blur\(20px\)/);
  await waitForSavedSettings(page, { uiStyle: 'glass' });
  await page.reload();
  await openSettings(page);
  await expect(settingsPaper(page)).toHaveCSS('border-radius', '24px');
});

test('each style has its look', async ({ page }) => {
  await ready(page);
  for (const [name, radius] of [['Flat', '12px'], ['Outline', '12px'], ['Brutalist', '0px']] as const) {
    await openTheme(page);
    await page.getByRole('button', { name, exact: true }).click();
    await openSettings(page);
    await expect(settingsPaper(page)).toHaveCSS('border-radius', radius);
    if (name === 'Flat') await expect(settingsPaper(page)).toHaveCSS('box-shadow', 'none');
    if (name === 'Outline') await expect(settingsPaper(page)).toHaveCSS('background-color', /^rgba\(\d+, \d+, \d+, 0\)$/);
    if (name === 'Brutalist') await expect(settingsPaper(page)).toHaveCSS('box-shadow', /4px 4px 0px/);
  }
});

test('glass adds palette blobs, other styles do not', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /radial-gradient/);
  await page.getByRole('button', { name: 'Material', exact: true }).click();
  await expect(page.getByTestId('app-background')).not.toHaveCSS('background-image', /radial-gradient/);
});

test('glass with a photo shows no blobs', async ({ page }) => {
  await ready(page);
  await openTheme(page);
  await page.getByTestId('background-input').setInputFiles(join(import.meta.dirname, 'fixtures', 'background.png'));
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await expect(page.getByTestId('app-background')).toHaveCSS('background-image', /url\("blob:/);
  await expect(page.getByTestId('app-background')).not.toHaveCSS('background-image', /radial-gradient/);
});

test('timing removes backdrop filters', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop panes carry the glass while timing');
  await ready(page);
  await openTheme(page);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await expect(page.locator('header')).toHaveCSS('backdrop-filter', /blur/);
  await page.keyboard.down('Space');
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'ready');
  await page.keyboard.up('Space');
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'running');
  await expect(page.locator('header')).toHaveCSS('backdrop-filter', 'none');
  await expect(page.locator('aside')).toHaveCSS('backdrop-filter', 'none');
  await page.keyboard.press('Space');
  await expect(page.locator('header')).toHaveCSS('backdrop-filter', /blur/);
});

test('reduced transparency gives solid glass', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await ready(page);
  await openTheme(page);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await openSettings(page);
  await expect(settingsPaper(page)).toHaveCSS('backdrop-filter', 'none');
  await expect(settingsPaper(page)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});
