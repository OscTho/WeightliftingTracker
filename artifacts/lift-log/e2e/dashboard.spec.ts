import { test, expect } from '@playwright/test';
import {
  setupMocks,
  DASHBOARD_WITH_PROGRAMME,
  DASHBOARD_NO_PROGRAMME,
  DASHBOARD_NO_PROFILE,
} from './fixtures';

test.describe('Dashboard', () => {
  test('loading state — skeleton blocks visible', async ({ page }) => {
    // Never resolve the dashboard request so the loading state persists
    await page.route(/\/api\/dashboard/, () => { /* hang */ });
    await page.goto('/');

    const loading = page.getByTestId('status-loading');
    await expect(loading).toBeVisible();
    const pulseBlocks = page.locator('.animate-pulse');
    await expect(pulseBlocks.first()).toBeVisible();
  });

  test('error state — retry button shown on API failure', async ({ page }) => {
    await setupMocks(page, { dashboard: 'error' });
    await page.goto('/');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
    await expect(page.getByText("Couldn't load this page")).toBeVisible();
  });

  test('with programme and profile — shows next session and stats', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    // Page title — DOM text is not CSS-uppercased
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ready when');
    // Next session card — scope to the section to avoid ambiguity with recent-work list
    const nextCard = page.locator('section').filter({ hasText: 'Next session' });
    await expect(nextCard).toBeVisible();
    await expect(nextCard.getByText('Snatch Focus')).toBeVisible();
    // Start session button
    await expect(page.getByTestId('button-start-next')).toBeVisible();
    // Stats row — weekly sets (scope to the grid to avoid ambiguity)
    await expect(page.getByText('Sets this week')).toBeVisible();
    await expect(page.locator('.grid').filter({ hasText: 'Sets this week' }).getByText('15')).toBeVisible();
    // Recent work
    await expect(page.getByText('Recent work')).toBeVisible();
    await expect(page.getByTestId('link-see-history')).toBeVisible();
  });

  test('no programme — prompts to browse programmes', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_NO_PROGRAMME });
    await page.goto('/');

    await expect(page.getByText('No session queued')).toBeVisible();
    await expect(page.getByTestId('link-choose-programme')).toBeVisible();
    await expect(page.getByText('Browse programmes')).toBeVisible();
  });

  test('no profile — shows set-up profile prompt', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_NO_PROFILE });
    await page.goto('/');

    await expect(page.getByText('Set up your athlete profile')).toBeVisible();
    await expect(page.getByTestId('link-setup-profile')).toBeVisible();
  });

  test('typography — h1 has type-page-title class', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/type-page-title/);
  });

  test('typography — overline caption has type-caption class', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    // The date/today caption above the title
    const caption = page.locator('.type-caption').first();
    await expect(caption).toBeVisible();
  });

  test('nav — shell renders bottom navigation with track active', async ({ page }) => {
    await setupMocks(page, { dashboard: DASHBOARD_WITH_PROGRAMME });
    await page.goto('/');

    await expect(page.getByTestId('link-nav-track')).toBeVisible();
    await expect(page.getByTestId('link-nav-plans')).toBeVisible();
    await expect(page.getByTestId('link-nav-history')).toBeVisible();
    await expect(page.getByTestId('link-nav-profile')).toBeVisible();
    // Track is active on this page
    await expect(page.getByTestId('link-nav-track')).toHaveClass(/bg-primary/);
  });
});
