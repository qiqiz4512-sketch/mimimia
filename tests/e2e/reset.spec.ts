import { expect, test } from '@playwright/test';

const state = (page: import('@playwright/test').Page, value: string, timeout = 5_000) =>
  expect(page.locator('body')).toHaveAttribute('data-experience-state', value, { timeout });

async function cast(page: import('@playwright/test').Page) {
  await page.mouse.down();
  await state(page, 'charged', 5_000);
  await page.mouse.up();
  await state(page, 'complete', 6_000);
}

test('cleans the previous spell completely while retaining assets, renderer, pools, and ambient music', async ({ page }) => {
  test.setTimeout(80_000);
  let assetRequests = 0;
  await page.route('**/assets/**', async (route) => {
    assetRequests += 1;
    await route.continue();
  });
  await page.goto('/?quality=compatibility');
  await expect(page.getByTestId('enter-button')).toBeEnabled({ timeout: 35_000 });
  await page.getByTestId('enter-button').click();
  await state(page, 'idle');
  const canvas = page.locator('canvas[data-render-surface]');
  const baselineCamera = await canvas.getAttribute('data-camera-distance');
  const requestsAfterLoad = assetRequests;

  await cast(page);
  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'true');
  const immediateResetState = await page.getByTestId('reset-button').evaluate((button) => {
    (button as HTMLButtonElement).click();
    return document.body.dataset.experienceState;
  });
  expect(immediateResetState).toBe('resetting');
  await state(page, 'idle', 2_000);

  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'false');
  await expect(page.locator('body')).toHaveAttribute('data-renderer-generation', '1');
  await expect(canvas).toHaveAttribute('data-camera-distance', baselineCamera ?? '');
  await expect(canvas).toHaveAttribute('data-magic-circle', /"opacity":0/);
  await expect(canvas).toHaveAttribute('data-particle-stats', /"activeCount":0/);
  await expect(canvas).toHaveAttribute('data-postprocessing', /"energy":0/);
  await expect(canvas).toHaveAttribute('data-audio', /"ambientLoopStarts":1/);
  expect(assetRequests).toBe(requestsAfterLoad);

  await cast(page);
  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'true');
  await expect(canvas).toHaveAttribute('data-audio', /"ambientLoopStarts":1/);
  await expect(page.locator('body')).toHaveAttribute('data-renderer-generation', '1');
});
