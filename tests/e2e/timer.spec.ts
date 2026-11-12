import { expect, test, type Page } from '@playwright/test';

const pane = (page: Page) => page.getByTestId('timer-pane');
const display = (page: Page) => page.getByTestId('timer-display');
const SCRAMBLE = /^([RLUDFB]['2]? ){10,}/;

async function keyboardSolve(page: Page, holdMs = 400, solveMs = 1000) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(holdMs);
  await page.keyboard.up('Space');
  await page.waitForTimeout(solveMs);
  await page.keyboard.press('Space');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE, { timeout: 30_000 });
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard');

  test('keyboard solve records one solve', async ({ page }) => {
    await expect(display(page)).toHaveText('0.00');
    await keyboardSolve(page);
    await expect(pane(page)).toHaveAttribute('data-solve-count', '1');
    const shown = await display(page).textContent();
    expect(Number(shown)).toBeGreaterThanOrEqual(0.9);
    expect(Number(shown)).toBeLessThan(3);
    await expect(page.getByTestId('quick-plus2')).toBeVisible();
  });

  test('early release does not start', async ({ page }) => {
    // Dispatched in-page so a loaded test machine cannot stretch the 100 ms press past the 300 ms hold.
    await page.evaluate(async () => {
      const fire = (type: string) => window.dispatchEvent(new KeyboardEvent(type, { key: ' ', code: 'Space', bubbles: true }));
      fire('keydown');
      await new Promise(r => setTimeout(r, 100));
      fire('keyup');
    });
    await page.waitForTimeout(300);
    await expect(display(page)).toHaveText('0.00');
    await expect(pane(page)).toHaveAttribute('data-solve-count', '0');
  });

  test('scramble advances after a solve', async ({ page }) => {
    const before = await page.getByTestId('scramble-text').textContent();
    await keyboardSolve(page, 400, 300);
    await expect(page.getByTestId('scramble-text')).not.toHaveText(before!);
    await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE);
  });

  test('typing in the comment dialog does not start the timer', async ({ page }) => {
    await keyboardSolve(page, 400, 300);
    await expect(pane(page)).toHaveAttribute('data-solve-count', '1');
    const shown = await display(page).textContent();
    await page.getByTestId('quick-comment').click();
    await page.getByRole('textbox', { name: 'Comment' }).fill('good one');
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(pane(page)).toHaveAttribute('data-solve-count', '1');
    await expect(display(page)).toHaveText(shown!);
  });

  test('ui is hidden while running and back after stopping', async ({ page }) => {
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await expect(page.getByTestId('scramble-text')).toBeHidden();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('scramble-text')).toBeVisible();
  });

  test('escape cancels a running solve', async ({ page }) => {
    await page.keyboard.down('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await expect(pane(page)).toHaveAttribute('data-solve-count', '0');
    await expect(display(page)).toHaveText('0.00');
  });
});

test('mobile tap solve', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch');
  const box = (await display(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.mouse.down();
  await page.mouse.up();
  await expect(pane(page)).toHaveAttribute('data-solve-count', '1');
});

test('the New scramble button swaps the scramble without starting the timer', async ({ page }) => {
  const before = await page.getByTestId('scramble-text').textContent();
  await page.getByRole('button', { name: 'New scramble' }).click();
  await expect(page.getByTestId('scramble-text')).not.toHaveText(before!);
  await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE);
  await expect(page.getByTestId('timer-display')).toHaveAttribute('data-state', 'idle');
  await expect(page.getByTestId('timer-pane')).toHaveAttribute('data-solve-count', '0');
});

test('Space after clicking New scramble does not swap the scramble again', async ({ page }) => {
  await page.getByRole('button', { name: 'New scramble' }).click();
  await expect(page.getByTestId('scramble-text')).toHaveText(SCRAMBLE);
  const shown = await page.getByTestId('scramble-text').textContent();
  await page.keyboard.press('Space'); // the button still has focus
  await page.waitForTimeout(400);
  await expect(page.getByTestId('scramble-text')).toHaveText(shown!);
});
