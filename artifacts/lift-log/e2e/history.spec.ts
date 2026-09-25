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

  test('empty state — mobile history message is visible', async ({ page }) => {
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    await expect(page.getByText('No sessions recorded yet.')).toBeVisible();
  });

  test('with data — workout rows rendered with correct content', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    // Both rows visible
    await expect(page.getByTestId(`row-history-${HISTORY_ITEMS[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`row-history-${HISTORY_ITEMS[1].id}`)).toBeVisible();

    // First row — session name
    const firstRow = page.getByTestId(`row-history-${HISTORY_ITEMS[0].id}`);
    await expect(firstRow.getByText('Snatch Focus', { exact: true })).toBeVisible();
    await expect(firstRow.getByText('8 working sets')).toBeVisible();

    // Second row shows missed sets count
    const secondRow = page.getByTestId(`row-history-${HISTORY_ITEMS[1].id}`);
    await expect(secondRow.getByText('2 MISSED')).toBeVisible();
  });

  test('with data — set counts visible', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    // Working set count appears in the first mobile row
    await expect(page.locator('[data-testid^="row-history"]').first().getByText('8 working sets')).toBeVisible();
  });

  test('page title uses the mobile display styles', async ({ page }) => {
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/font-display/);
    await expect(h1).toHaveCSS('font-size', '44px');
    await expect(h1).toContainText('History.');
  });

  test('history nav item is active', async ({ page }) => {
    await setupMocks(page, { history: [] });
    await page.goto('/history');

    await expect(page.getByTestId('link-nav-history')).toHaveClass(/bg-primary/);
  });

  test('history rows use mobile session text', async ({ page }) => {
    await setupMocks(page, { history: HISTORY_ITEMS });
    await page.goto('/history');

    for (const workout of HISTORY_ITEMS) {
      await expect(page.getByTestId(`row-history-${workout.id}`).getByText(workout.sessionName, { exact: true })).toHaveClass(/font-display/);
    }
  });
});
