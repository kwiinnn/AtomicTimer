import { expect, test } from '@playwright/test';
import { keyboardSolve, SCRAMBLE } from './helpers/solve';

test.skip(({ isMobile }) => isMobile, 'one project is enough for the large-session check');

test('a 10k-solve session stays usable', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!(Array.from({ length: 10_000 }, (_, i) => 8000 + ((i * 7919) % 6000))));
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '10000', { timeout: 60_000 });
  await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE, { timeout: 30_000 });

  // The list renders a bounded window, not 10k rows.
  expect(await page.getByTestId('solve-row').count()).toBeLessThanOrEqual(200);

  // Hold → ready → start → stop must work normally (it froze before: every state change re-rendered 10k rows).
  const longTasks = await page.evaluate(() => {
    const w = window as unknown as { __long: number[] };
    w.__long = [];
    new PerformanceObserver(list => list.getEntries().forEach(e => w.__long.push(e.duration))).observe({ type: 'longtask' });
    return true;
  });
  expect(longTasks).toBe(true);
  await keyboardSolve(page, 300);
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '10001');
  const worst = await page.evaluate(() => Math.max(0, ...(window as unknown as { __long: number[] }).__long));
  expect(worst).toBeLessThan(250);
});
