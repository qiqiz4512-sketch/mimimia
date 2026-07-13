import { expect, test } from '@playwright/test';

async function enter(page: import('@playwright/test').Page, suffix = '') {
  await page.goto(`/?quality=compatibility&backend=webgl2&recoveryTest=1${suffix}`);
  await expect(page.getByTestId('enter-button')).toBeEnabled({ timeout: 35_000 });
  await page.getByTestId('enter-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'idle');
}

test('prevents WebGL loss, rebuilds from cached assets, and resumes a complete spell', async ({ page }) => {
  test.setTimeout(80_000);
  await enter(page);
  const prevented = await page.locator('canvas[data-render-surface]').evaluate((canvas) => {
    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-graphics-recovery', 'recovering');
  await page.locator('canvas[data-render-surface]').dispatchEvent('webglcontextrestored');
  await expect(page.locator('body')).toHaveAttribute('data-renderer-generation', '2', { timeout: 35_000 });
  await expect(page.locator('body')).toHaveAttribute('data-graphics-recovery', 'healthy');
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'idle');
  await expect(page.locator('canvas[data-render-surface]')).toBeVisible();

  await page.mouse.down();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'charged', { timeout: 5_000 });
  await page.mouse.up();
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'complete', { timeout: 6_000 });

  await page.locator('canvas[data-render-surface]').dispatchEvent('webglcontextrestored');
  await page.waitForTimeout(300);
  await expect(page.locator('body')).toHaveAttribute('data-renderer-generation', '2');
});

test('uses the renderer device-lost callback and gives a re-enter action when rebuilding fails', async ({ page }) => {
  test.setTimeout(60_000);
  await enter(page, '&fault=graphics-rebuild');
  await page.evaluate(() => {
    (window as typeof window & { __mimimiaGraphicsTest?: { loseDevice: () => void } })
      .__mimimiaGraphicsTest?.loseDevice();
  });
  await expect(page.locator('body')).toHaveAttribute('data-graphics-recovery-step', 'injected-failure', { timeout: 5_000 });
  await expect(page.locator('body')).toHaveAttribute('data-graphics-recovery', 'failed', { timeout: 10_000 });
  await expect(page.locator('[data-render-error]')).toContainText('月光通路需要重新连接');
  await expect(page.getByTestId('reenter-button')).toBeVisible();
  await expect(page.locator('canvas[data-render-surface]')).toBeHidden();
});
