import { expect, test, type Page } from '@playwright/test';
import { ready } from './helpers/solve';

async function center(page: Page, testId: string) {
  const b = (await page.getByTestId(testId).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

test('timer is centred on screen once the hold turns green, and while running', async ({ page }) => {
  await ready(page);
  const vp = page.viewportSize()!;
  await page.keyboard.down('Space');
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'ready');
  let c = await center(page, 'timer-display');
  expect(Math.abs(c.x - vp.width / 2)).toBeLessThan(2);
  expect(Math.abs(c.y - vp.height / 2)).toBeLessThan(2);
  // The focus view covers everything: the scramble's spot now shows the timer.
  const sc = await center(page, 'scramble-text');
  expect(await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.closest('[data-testid]')?.getAttribute('data-testid'), [sc.x, sc.y])).toBe('timer-display');

  await page.keyboard.up('Space');
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'running');
  c = await center(page, 'timer-display');
  expect(Math.abs(c.x - vp.width / 2)).toBeLessThan(2);

  await page.keyboard.press('Space');
  await expect(page.getByTestId('scramble-text')).toBeVisible();
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '1');
});

test('after a short tap the focus view is not shown', async ({ page }) => {
  // The exact moment it appears (hold turns green) is pinned by src/ui/timer/focus.test.ts.
  await ready(page);
  await page.keyboard.down('Space');
  await page.waitForTimeout(80);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-focus', 'false');
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '0');
});
