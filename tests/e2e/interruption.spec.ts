import { expect, test } from '@playwright/test';

import { withBackend } from '../helpers/withBackend';

const state = (page: import('@playwright/test').Page, value: string, timeout = 5_000) =>
  expect(page.locator('body')).toHaveAttribute('data-experience-state', value, { timeout });

test('routes pointer leave, pointer cancel, blur, and hidden interruption through dissolve without summoning', async ({ page }, testInfo) => {
  test.setTimeout(80_000);
  await page.goto(withBackend('/?quality=compatibility', testInfo.project.name));
  await expect(page.getByTestId('enter-button')).toBeEnabled({ timeout: 35_000 });
  await page.getByTestId('enter-button').click();
  await state(page, 'idle');
  if (testInfo.project.name === 'chromium-webgl2') {
    await expect(page.locator('body')).toHaveAttribute('data-render-backend', 'webgl2');
  }
  const canvas = page.locator('canvas[data-render-surface]');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('render canvas has no bounds');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

  const scenarios = [
    { delay: 400, interrupt: () => canvas.dispatchEvent('pointerleave', { pointerId: 1 }) },
    { delay: 1_200, interrupt: () => canvas.dispatchEvent('pointercancel', { pointerId: 1 }) },
    { delay: 2_200, interrupt: () => page.evaluate(() => window.dispatchEvent(new Event('blur'))) },
  ];

  for (const scenario of scenarios) {
    await page.mouse.down();
    await state(page, 'charging');
    await page.waitForTimeout(scenario.delay);
    await scenario.interrupt();
    await state(page, 'dissolving');
    await page.mouse.up();
    await state(page, 'idle', 2_500);
    await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'false');
    await expect(canvas).toHaveAttribute('data-magic-circle', /"pillarCount":0/);
    await expect(canvas).toHaveAttribute('data-particle-stats', /"activeCount":0/);
  }

  await page.mouse.down();
  await state(page, 'charged', 5_000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'hidden');
    Reflect.deleteProperty(document, 'visibilityState');
  });
  await state(page, 'dissolving');
  await page.mouse.up();
  await state(page, 'idle', 2_500);
  await expect(page.locator('body')).toHaveAttribute('data-cat-visible', 'false');
  await expect(canvas).toHaveAttribute('data-magic-circle', /"pillarCount":0/);
  await expect(canvas).toHaveAttribute('data-particle-stats', /"activeCount":0/);
  await expect(page.locator('body')).toHaveAttribute('data-quality-pending', 'false');
});
