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

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop layout');

  test('records sidebar is on the left, timer on the right', async ({ page }) => {
    await ready(page);
    const aside = (await page.locator('aside').boundingBox())!;
    const main = (await page.locator('main').first().boundingBox())!;
    expect(aside.x).toBeLessThan(main.x);
    expect(aside.x).toBeLessThan(5);
    // Stats summary sits above the times list.
    const stats = (await page.getByTestId('stats-summary').boundingBox())!;
    const list = (await page.getByTestId('times-list').boundingBox())!;
    expect(stats.y).toBeLessThan(list.y);
  });

  test('times table shows rolling ao5 / ao12 per solve', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => typeof window.__seed === 'function');
    await page.evaluate(() => window.__seed!(Array.from({ length: 12 }, (_, i) => (i + 1) * 1000)));
    const newest = page.getByTestId('solve-row').first();
    await expect(newest).toContainText('12.00');
    await expect(newest.getByTestId('row-ao5')).toHaveText('10.00');
    await expect(newest.getByTestId('row-ao12')).toHaveText('6.50');
    await expect(page.getByTestId('solve-row').nth(8).getByTestId('row-ao5')).toHaveText('–');
  });

  test('graph lives in a tool panel under the timer', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => typeof window.__seed === 'function');
    await page.evaluate(() => window.__seed!([5000, 6000, 7000]));
    const graph = page.locator('main').getByTestId('time-graph');
    await expect(graph).toBeVisible();
    await expect(page.locator('aside').getByTestId('time-graph')).toHaveCount(0);
  });
});

test('glass turns the phone tabs into a floating pill', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await ready(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Theme' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  const strip = page.locator('.MuiTabs-root');
  await expect(strip).toHaveCSS('border-radius', /^(999px|9\.99e\+?\d+px)$/);
  await expect(strip).toHaveCSS('margin-left', '12px');
  await expect(page.getByRole('tab')).toHaveText(['Timer', 'Times', 'Stats']);
  await page.getByRole('tab', { name: 'Times' }).click();
  await expect(page.getByTestId('times-list')).toBeInViewport();
});

test('glass tab capsule flows on switch and long presses show no ripple', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await ready(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Theme' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Times' }).locator('.MuiTouchRipple-root')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Times' }).click();
  await expect(page.locator('.glass-tabs')).toHaveAttribute('data-flow', /^[ab]$/);
  await expect(page.locator('.glass-tabs .MuiTabs-indicator')).toHaveCSS('animation-name', /^glass-flow-[ab]$/);
});

test('tapping a far tab switches once, without passing through the middle one', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await ready(page);
  await page.evaluate(() => {
    const w = window as unknown as { __flips: string[] };
    w.__flips = [];
    const tabs = document.querySelector('.glass-tabs')!;
    new MutationObserver(() => w.__flips.push(tabs.querySelector('[aria-selected="true"]')!.textContent!))
      .observe(tabs, { attributes: true, attributeFilter: ['data-flow'] });
  });
  await page.getByRole('tab', { name: 'Stats' }).click();
  await expect(page.getByTestId('stats-pane')).toBeInViewport();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => (window as unknown as { __flips: string[] }).__flips)).toEqual(['Stats']);
});

test('swiping away mid-scroll still updates the tab', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await ready(page);
  await page.getByRole('tab', { name: 'Stats' }).click();
  // Interrupt the smooth scroll and land on Times instead.
  await page.locator('[role="tabpanel"]').first().locator('..').evaluate(el => el.scrollTo({ left: el.clientWidth, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  await page.locator('[role="tabpanel"]').first().locator('..').evaluate(el => el.scrollTo({ left: 0, behavior: 'instant' }));
  await expect(page.getByRole('tab', { name: 'Timer' })).toHaveAttribute('aria-selected', 'true');
});

async function glassPhoneWithSolves(page: Page) {
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!([12000, 13000, 14000, 15000, 16000]));
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Theme' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
  await page.getByRole('button', { name: 'Liquid Glass', exact: true }).click();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Timer' }).click();
  await expect(page.locator('.MuiModal-root')).toHaveCount(0);
}

test('in glass, phone stats sections sit on frosted cards; time tiles get depth, not a card', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await glassPhoneWithSolves(page);
  await page.getByRole('tab', { name: 'Stats' }).click();
  const statsCards = page.getByTestId('stats-pane').locator('.phone-card');
  await expect(statsCards).toHaveCount(2); // session table + graph
  for (const card of await statsCards.all()) await expect(card).toHaveCSS('backdrop-filter', /blur\(20px\)/);
  await page.getByRole('tab', { name: 'Times' }).click();
  await expect(page.getByTestId('times-list').locator('.phone-card')).toHaveCount(0);
  const tile = page.getByTestId('solve-row').first();
  await expect(tile).toHaveCSS('box-shadow', /rgba\(0, 0, 0/);
  await expect(tile).toHaveCSS('backdrop-filter', 'none');
});

test('the phone stats graph is always shown, with no Graph toggle', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!([12000, 13000, 14000]));
  await page.getByRole('tab', { name: 'Stats' }).click();
  await expect(page.getByTestId('stats-pane').getByTestId('time-graph')).toBeVisible();
  await expect(page.getByTestId('stats-pane').getByRole('button', { name: 'Graph' })).toHaveCount(0);
});

test('phone cards stay bare outside glass', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.__seed === 'function');
  await page.evaluate(() => window.__seed!([12000]));
  await page.getByRole('tab', { name: 'Stats' }).click();
  await expect(page.getByTestId('stats-pane').locator('.phone-card').first()).toHaveCSS('backdrop-filter', 'none');
});

test('in glass, phone panes scroll under the toolbar and the tab pill', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await glassPhoneWithSolves(page);
  const header = (await page.locator('header').boundingBox())!;
  const strip = (await page.locator('.glass-tabs').boundingBox())!;
  expect(strip.y).toBeGreaterThanOrEqual(header.y + header.height); // pill still sits under the toolbar
  for (const tab of ['Stats', 'Times']) {
    await page.getByRole('tab', { name: tab }).click();
    const panel = page.getByRole('tabpanel').nth(tab === 'Times' ? 1 : 2);
    const box = (await panel.boundingBox())!;
    // The scrolling pane reaches the top of the screen, so content passes under both glass bars…
    expect(box.y).toBeLessThanOrEqual(header.y);
    // …and starts below the pill, so nothing is hidden at rest.
    const pad = await panel.evaluate(el => parseFloat(getComputedStyle(el).paddingTop));
    expect(box.y + pad).toBeGreaterThanOrEqual(strip.y + strip.height);
  }
});

test('nothing above a frosted phone card blocks its blur', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await glassPhoneWithSolves(page);
  await page.getByRole('tab', { name: 'Stats' }).click();
  // A mask, filter or opacity on an ancestor makes it a backdrop root: the card would blur nothing.
  const blockers = await page.getByTestId('stats-pane').locator('.phone-card').first().evaluate(card => {
    const out: string[] = [];
    for (let el = card.parentElement; el; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.maskImage !== 'none' || cs.filter !== 'none' || Number(cs.opacity) < 1) out.push(el.tagName + '.' + el.className);
    }
    return out;
  });
  expect(blockers).toEqual([]);
});

test('in glass, time tiles take the theme colour', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await glassPhoneWithSolves(page);
  await page.getByRole('tab', { name: 'Times' }).click();
  // Mostly solid, so every tile looks the same whatever part of the photo is behind it…
  const colours = await page.getByTestId('solve-row').evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
  const [r, g, b, a = 1] = colours[0]!.match(/[\d.]+/g)!.map(Number);
  expect(a).toBeGreaterThanOrEqual(0.85);
  // …and in the theme colour: default indigo is blue-dominant.
  expect(b!).toBeGreaterThan(r!);
  expect(b!).toBeGreaterThan(g!);
});
