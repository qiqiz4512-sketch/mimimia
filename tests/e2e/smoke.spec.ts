import { expect, test } from '@playwright/test';

test('renders the three stable application mounts without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#scene-canvas-host')).toBeAttached();
  await expect(page.locator('#ui-root')).toBeVisible();
  expect(errors).toEqual([]);
});
