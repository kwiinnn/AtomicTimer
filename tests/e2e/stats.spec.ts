import { expect, test, type Page } from '@playwright/test';
import { showTimes } from './helpers/solve';

async function seed(page: Page, times: number[]) {
  await page.goto('/?e2e=1');
  await expect(page.getByTestId('session-picker')).toContainText('Session 1');
  await page.waitForFunction(() => typeof (window as unknown as { __seed?: unknown }).__seed === 'function');
  await page.evaluate(t => (window as unknown as { __seed: (t: number[]) => Promise<void> }).__seed(t), times);
}

async function showStats(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('tab', { name: 'Stats' }).click();
}

test('stats table for 12 ascending solves', async ({ page, isMobile }) => {
  await seed(page, Array.from({ length: 12 }, (_, i) => (i + 1) * 1000));
  await showStats(page, isMobile);
  await expect(page.getByTestId('stat-ao5-current')).toHaveText('10.00');
  await expect(page.getByTestId('stat-ao5-best')).toHaveText('3.00');
  await expect(page.getByTestId('stat-mo3-current')).toHaveText('11.00');
  await expect(page.getByTestId('stat-ao12-current')).toHaveText('6.50');
  await expect(page.getByTestId('stat-ao50-current')).toHaveText('–');
  await expect(page.getByTestId('stats-summary')).toContainText('12/12');
  await expect(page.getByTestId('time-graph').locator('canvas').first()).toBeVisible();
});

test('a DNF inside the window is trimmed', async ({ page, isMobile }) => {
  await seed(page, Array.from({ length: 12 }, (_, i) => (i + 1) * 1000));
  await showTimes(page, isMobile);
  await page.getByTestId('solve-row').nth(2).click(); // newest first: #12, #11, #10
  await page.getByTestId('solve-sheet').getByRole('button', { name: 'DNF' }).click();
  await page.keyboard.press('Escape');
  await showStats(page, isMobile);
  await expect(page.getByTestId('stat-ao5-current')).toHaveText('10.67');
  await expect(page.getByTestId('stats-summary')).toContainText('11/12');
});

test('phone timer shows quick stats bottom-left', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await expect(page.getByTestId('quick-stats')).toHaveCount(0);
  await page.evaluate(() => window.__seed!([5000, 6000, 7000, 8000, 9000]));
  const q = page.getByTestId('quick-stats');
  await expect(q).toBeVisible();
  await expect(q.getByTestId('quick-ao5')).toHaveText('7.00');
  await expect(q.getByTestId('quick-ao12')).toHaveText('–');
  await expect(q.getByTestId('quick-ao50')).toHaveText('–');
  await expect(q.getByTestId('quick-ao100')).toHaveText('–');
  await expect(q.getByTestId('quick-mean')).toHaveText('7.00');
  await expect(q.getByTestId('quick-count')).toHaveText('5');
  // Bottom-left of the timer pane, opposite the scramble image.
  const box = (await q.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(box.x).toBeLessThan(vp.width / 2);
  expect(box.y + box.height).toBeGreaterThan(vp.height * 0.7);
  // The phone scramble image keeps its phone size.
  expect((await page.getByTestId('scramble-image').boundingBox())!.height).toBeLessThanOrEqual(112);
});

test('desktop keeps the graph panel instead of quick stats', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout only');
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!([5000, 6000, 7000]));
  await expect(page.locator('main').getByTestId('time-graph')).toBeVisible();
  await expect(page.getByTestId('quick-stats')).toHaveCount(0);
});
