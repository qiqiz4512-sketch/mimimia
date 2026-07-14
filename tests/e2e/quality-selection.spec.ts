import { expect, test } from '@playwright/test';

import { withBackend } from '../helpers/withBackend';

async function waitForEntry(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('enter-button')).toBeEnabled({ timeout: 35_000 });
}

test('keeps the opaque loading view closed through a real uninterrupted three-second benchmark', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto(withBackend('/', testInfo.project.name));
  await page.locator('body[data-load-progress="1"]').waitFor({ timeout: 25_000 });
  await expect(page.getByTestId('loading-status')).toContainText('正在校准月光');
  await expect(page.getByTestId('enter-button')).toBeDisabled();
  await waitForEntry(page);
  if (testInfo.project.name === 'chromium-webgl2') {
    await expect(page.locator('body')).toHaveAttribute('data-render-backend', 'webgl2');
  }
  await expect(page.locator('body')).toHaveAttribute('data-quality-tier', /^(high|balanced|compatibility)$/);
  const durationMs = Number(await page.locator('body').getAttribute('data-quality-benchmark-duration'));
  expect(durationMs).toBeGreaterThanOrEqual(3_000);
});

test('selects the exact high, balanced, and compatibility benchmark boundaries', async ({ page }, testInfo) => {
  test.setTimeout(140_000);
  for (const [fps, tier, label] of [
    [45, 'high', '高画质'],
    [44.9, 'balanced', '均衡画质'],
    [30, 'balanced', '均衡画质'],
    [29.9, 'compatibility', '兼容画质'],
  ] as const) {
    await page.goto(withBackend(`/?benchmarkFps=${fps}`, testInfo.project.name));
    await waitForEntry(page);
    await expect(page.locator('body')).toHaveAttribute('data-quality-tier', tier);
    await expect(page.locator('body')).toHaveAttribute('data-quality-forced', 'false');
    await expect(page.getByTestId('quality-badge')).toContainText(label);
  }
});

test('holds a pending downgrade during a spell and applies exactly one tier when safe', async ({ page }, testInfo) => {
  test.setTimeout(80_000);
  await page.goto(withBackend('/?benchmarkFps=45&qualityTest=1&backend=webgl2', testInfo.project.name));
  await waitForEntry(page);
  await page.getByTestId('enter-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'idle');

  const canvas = page.locator('canvas[data-render-surface]');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('render canvas has no bounds');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', /^(charging|charged)$/);
  await page.evaluate(() => {
    const hook = (window as typeof window & {
      __mimimiaQualityTest?: { requestDowngrade: () => void };
    }).__mimimiaQualityTest;
    hook?.requestDowngrade();
  });
  await expect(page.locator('body')).toHaveAttribute('data-quality-pending', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-quality-tier', 'high');

  await page.mouse.up();
  await expect(page.locator('body')).toHaveAttribute('data-quality-tier', 'balanced', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-quality-pending', 'false');
  await expect(page.getByTestId('quality-notice')).toContainText('均衡画质');
  await expect(canvas).toHaveAttribute('data-postprocessing', /"quality":"balanced"/);
  const particleStats = await canvas.evaluate((element) =>
    JSON.parse((element as HTMLCanvasElement).dataset.particleStats ?? '{}'));
  expect(particleStats).toMatchObject({ quality: 'balanced', drawCalls: 3 });
});

test('keeps a forced debug tier stable and reports the real backend and runtime statistics', async ({ page }, testInfo) => {
  await page.goto(withBackend('/?debug=1&quality=balanced&backend=webgl2', testInfo.project.name));
  const panel = page.getByTestId('debug-panel');
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toContainText('BACKEND  WEBGL2');
  await expect(panel).toContainText('QUALITY  BALANCED');
  await expect(panel).toContainText('FPS');
  await expect(panel).toContainText('OBJECTS');
  await expect(page.locator('body')).toHaveAttribute('data-quality-forced', 'true');
});
