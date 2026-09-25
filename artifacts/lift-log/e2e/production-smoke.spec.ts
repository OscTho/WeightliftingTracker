import { expect, test } from '@playwright/test';

test('the production bundle starts and shows sign in for a new visitor', async ({ page }) => {
  const startupErrors: string[] = [];
  page.on('pageerror', (error) => startupErrors.push(error.message));

  const sessionResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/auth/me',
  );
  await page.goto('/');

  expect((await sessionResponse).status()).toBe(401);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await expect(page.getByTestId('input-login')).toBeVisible();
  await expect(page.getByTestId('button-login')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0);
  expect(startupErrors, 'uncaught browser startup errors').toEqual([]);
});