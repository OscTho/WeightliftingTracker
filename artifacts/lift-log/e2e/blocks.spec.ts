import { test, expect } from '@playwright/test';
import { setupMocks } from './fixtures';

/**
 * Tests for shared feedback blocks: ErrorBlock, EmptyBlock, LoadingBlock
 * These components are used across every page — tested here in isolation
 * via pages that render them.
 */

test.describe('ErrorBlock', () => {
  test('renders with correct role and testid', async ({ page }) => {
    await setupMocks(page, { dashboard: 'error' });
    await page.goto('/');

    const error = page.getByTestId('status-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute('role', 'alert');
  });

  test('message text visible', async ({ page }) => {
    await setupMocks(page, { dashboard: 'error' });
    await page.goto('/');

    await expect(page.getByText("Couldn't load this page")).toBeVisible();
    await expect(page.getByText('Check your connection, then try again.')).toBeVisible();
  });

  test('retry button calls API again', async ({ page }) => {
    let callCount = 0;
    await page.route(/\/api\/dashboard/, (route) => {
      callCount++;
      route.fulfill({ status: 500, body: '{}', contentType: 'application/json' });
    });
    await page.goto('/');

    const retryBtn = page.getByTestId('button-retry');
    await expect(retryBtn).toBeVisible();
    const prevCount = callCount;
    await retryBtn.click();
    // A new request should have been triggered
    await page.waitForTimeout(500);
    expect(callCount).toBeGreaterThan(prevCount);
  });

  test('error text uses type-section-heading class', async ({ page }) => {
    await setupMocks(page, { history: 'error' });
    await page.goto('/history');

    const heading = page.locator('[data-testid="status-error"] .type-section-heading');
    await expect(heading).toBeVisible();
  });
});

test.describe('Mobile empty states', () => {
  test('programme empty state renders with current testid', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    const empty = page.getByTestId('empty-current-programme');
    await expect(empty).toBeVisible();
  });

  test('programme empty state title is visible', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    const title = page.getByTestId('empty-current-programme').getByText('No active programme');
    await expect(title).toBeVisible();
  });

  test('programme empty state detail is visible', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    const detail = page.getByTestId('empty-current-programme').getByText('Create your first training cycle to start planning sessions.');
    await expect(detail).toBeVisible();
  });

  test('programme empty state renders create CTA', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await expect(page.getByTestId('button-new-programme')).toBeVisible();
  });
});

test.describe('LoadingBlock', () => {
  test('renders with correct testid and aria-label', async ({ page }) => {
    // Hang the API so loading persists
    await page.route(/\/api\/dashboard/, () => { /* hang */ });
    await page.goto('/');

    const loading = page.getByTestId('status-loading');
    await expect(loading).toBeVisible();
    await expect(loading).toHaveAttribute('aria-label', 'Loading training data');
  });

  test('contains animated skeleton elements', async ({ page }) => {
    await page.route(/\/api\/programmes$/, () => { /* hang */ });
    await page.goto('/programme');

    // At least one animate-pulse element inside the loading block
    const skeleton = page.locator('[data-testid="status-loading"] .animate-pulse');
    await expect(skeleton.first()).toBeVisible();
  });
});

test.describe('Shell', () => {
  test('brand logo link is present', async ({ page }) => {
    await setupMocks(page, { dashboard: { profile: null, programme: null, nextSession: null, recentWorkouts: [], weeklyCompletedSets: 0 } });
    await page.goto('/');

    const brand = page.getByTestId('link-brand');
    await expect(brand).toBeVisible();
    await expect(brand.getByText('LOFTE')).toBeVisible();
  });

  test('header profile avatar link present', async ({ page }) => {
    await setupMocks(page, { dashboard: { profile: null, programme: null, nextSession: null, recentWorkouts: [], weeklyCompletedSets: 0 } });
    await page.goto('/');

    await expect(page.getByTestId('link-header-profile')).toBeVisible();
  });

  test('four nav tabs always visible', async ({ page }) => {
    await setupMocks(page, { dashboard: { profile: null, programme: null, nextSession: null, recentWorkouts: [], weeklyCompletedSets: 0 } });
    await page.goto('/');

    for (const tab of ['track', 'plans', 'history', 'profile']) {
      await expect(page.getByTestId(`link-nav-${tab}`)).toBeVisible();
    }
  });
});
