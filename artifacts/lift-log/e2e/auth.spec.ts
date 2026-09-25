import { test, expect } from '@playwright/test';
import { setupMocks } from './fixtures';

test.describe('Accounts', () => {
  test('logged-out visitors are sent to sign in', async ({ page }) => {
    await setupMocks(page, { auth: 401 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await expect(page.getByTestId('input-login')).toBeVisible();
    await expect(page.getByTestId('button-login')).toBeVisible();
  });

  test('signup explains invalid credentials before sending', async ({ page }) => {
    await setupMocks(page, { auth: 401 });
    await page.goto('/signup');

    await page.getByTestId('button-signup').click();
    await expect(page.getByRole('alert')).toContainText('Username must be 3–20 characters');
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('successful sign in returns to the training app', async ({ page }) => {
    await setupMocks(page, { auth: 401, dashboard: {
      profile: null,
      programme: null,
      nextSession: null,
      recentWorkouts: [],
      weeklyCompletedSets: 0,
    } });
    await page.goto('/login');
    await page.getByTestId('input-login').fill('alex@example.com');
    await page.getByTestId('input-password').fill('correct horse battery staple');
    await page.getByTestId('button-login').click();

    await expect(page.getByRole('heading', { level: 1, name: /Ready when/ })).toBeVisible();
  });
});