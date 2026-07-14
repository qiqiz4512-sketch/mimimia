import { expect, test } from '@playwright/test';

import { withBackend } from '../helpers/withBackend';

async function waitForEntry(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('enter-button')).toBeEnabled({ timeout: 35_000 });
}

test('continues silently when music fails', async ({ page }, testInfo) => {
  await page.goto(withBackend('/?debug=1&fault=music&quality=compatibility', testInfo.project.name));
  await waitForEntry(page);
  await expect(page.locator('body')).toHaveAttribute('data-asset-muted', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-asset-failed', 'ambient-moon-void');
  await page.getByTestId('enter-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'idle');
  await expect(page.locator('body')).toHaveAttribute('data-muted', 'true');
  await expect(page.locator('canvas[data-render-surface]')).toBeVisible();
  if (testInfo.project.name === 'chromium-webgl2') {
    await expect(page.locator('body')).toHaveAttribute('data-render-backend', 'webgl2');
  }
});

test('skips an unavailable decorative asset without blocking entry', async ({ page }, testInfo) => {
  await page.goto(withBackend('/?debug=1&fault=decorative&quality=compatibility', testInfo.project.name));
  await waitForEntry(page);
  await expect(page.locator('body')).toHaveAttribute('data-asset-skipped', 'optional-debug-moon-glint');
  await expect(page.locator('body')).toHaveAttribute('data-fault-attempts', '1');
  await expect(page.locator('canvas[data-render-surface]')).toBeVisible();
});

test('retries girl and cat critical assets once, then shows a non-black reload result', async ({ page }, testInfo) => {
  test.setTimeout(70_000);
  for (const [fault, failedId] of [['girl', 'girl-rig'], ['cat', 'cat-rig']] as const) {
    await page.goto(withBackend(`/?debug=1&fault=${fault}&quality=compatibility`, testInfo.project.name));
    const panel = page.locator('[data-render-error]');
    await expect(panel).toContainText('月光使者未能抵达', { timeout: 35_000 });
    await expect(page.getByTestId('reload-button')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-fault-attempts', '2');
    await expect(page.locator('body')).toHaveAttribute('data-asset-failed', failedId);
    await expect(page.locator('canvas[data-render-surface]')).toBeHidden();
    const background = await panel.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(background).toContain('gradient');
  }
});

test('never requests a magic-circle bitmap asset', async ({ page }, testInfo) => {
  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));
  await page.goto(withBackend('/?debug=1&quality=compatibility&experienceState=charged&charge=1', testInfo.project.name));
  await expect(page.locator('canvas[data-render-surface]')).toHaveAttribute('data-render-ready', 'true', { timeout: 20_000 });
  expect(requestedUrls.some((url) => /magic-circle.*\.(png|webp|jpg)/i.test(url))).toBe(false);
});
