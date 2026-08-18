import { test, expect } from '@playwright/test';
import { setupMocks, HISTORY_ITEMS } from './fixtures';

test.describe('History', () => {
  test('loading state — skeleton visible', async ({ page }) => {
    await page.route(/\/api\/history/, () => { /* hang */ });
    await page.goto('/history');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('error state — retry shown on fetch failure', async ({ page }) => {
    await setupMocks(page, { history: 'error' });
    await page.goto('/history');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
  });

  test('empty state — EmptyBlock with go-to-track CTA', async ({ page }) => {
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    await expect(page.getByTestId('status-empty')).toBeVisible();
    await expect(page.getByText('Nothing logged yet')).toBeVisible();
    await expect(page.getByTestId('link-history-start')).toBeVisible();
    await expect(page.getByTestId('link-history-start')).toContainText('Go to Track');
  });

  test('with data — workout rows rendered with correct content', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    // Both rows visible
    await expect(page.getByTestId(`row-history-${HISTORY_ITEMS[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`row-history-${HISTORY_ITEMS[1].id}`)).toBeVisible();

    // First row — session name (DOM text; CSS uppercases)
    const firstRow = page.getByTestId(`row-history-${HISTORY_ITEMS[0].id}`);
    await expect(firstRow.locator('.type-section-heading')).toContainText('Snatch Focus');
    await expect(firstRow.getByText('Bulgarian Method')).toBeVisible();

    // Second row shows missed sets count
    const secondRow = page.getByTestId(`row-history-${HISTORY_ITEMS[1].id}`);
    await expect(secondRow.getByText('2 missed')).toBeVisible();
  });

  test('with data — set counts visible', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    // "8 / 8 sets" appears in first row
    await expect(page.locator('[data-testid^="row-history"]').first().getByText(/8.*8 sets/)).toBeVisible();
  });

  test('page title h1 has type-page-title class — DOM text original case', async ({ page }) => {
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/type-page-title/);
    await expect(h1).toContainText('The work stays.');
  });

  test('history nav item is active', async ({ page }) => {
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    await expect(page.getByTestId('link-nav-history')).toHaveClass(/bg-primary/);
  });

  test('history rows use type-section-heading for session names', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    // One section heading per workout row
    const headings = page.locator('[data-testid^="row-history"] .type-section-heading');
    await expect(headings).toHaveCount(HISTORY_ITEMS.length);
  });
});
