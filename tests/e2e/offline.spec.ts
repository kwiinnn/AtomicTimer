import { expect, test } from '@playwright/test';
import { keyboardSolve, SCRAMBLE } from './helpers/solve';

test('works offline after the first visit, including big-cube scrambles', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'one project is enough for the service worker check');
  await page.goto('/');
  await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE, { timeout: 30_000 });
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    // Wait until every precached asset is in place.
    await new Promise<void>(resolve => {
      if (reg.active?.state === 'activated') resolve();
      else reg.active?.addEventListener('statechange', () => reg.active?.state === 'activated' && resolve());
    });
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('session-picker')).toBeVisible();
  await page.getByTestId('puzzle-picker').click();
  await page.getByRole('option', { name: '4x4', exact: true }).click();
  await expect(page.getByTestId('scramble-text')).toHaveText(/^(\S+ ){30,}/, { timeout: 30_000 });
  await keyboardSolve(page);
});

test('manifest and icons are served', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ name: 'Atomic Timer', short_name: 'Atomic Timer', display: 'standalone' });
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).ok(), icon.src).toBe(true);
});
