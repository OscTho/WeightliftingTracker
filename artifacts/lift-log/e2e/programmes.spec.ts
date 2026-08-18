import { test, expect } from '@playwright/test';
import { setupMocks, PROGRAMME_SUMMARY, PROGRAMME } from './fixtures';

test.describe('Programme list', () => {
  test('loading state — skeleton visible', async ({ page }) => {
    await page.route(/\/api\/programmes$/, () => { /* hang */ });
    await page.goto('/programme');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('error state — retry button shown', async ({ page }) => {
    await setupMocks(page, { programmes: 'error' });
    await page.goto('/programme');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
  });

  test('empty state — EmptyBlock with build CTA', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await expect(page.getByTestId('status-empty')).toBeVisible();
    await expect(page.getByText('No programme yet')).toBeVisible();
    await expect(page.getByTestId('button-empty-new-programme')).toBeVisible();
  });

  test('with programmes — cards rendered with correct data', async ({ page }) => {
    await setupMocks(page, { programmes: [PROGRAMME_SUMMARY] });
    await page.goto('/programme');

    const card = page.getByTestId(`card-programme-${PROGRAMME_SUMMARY.id}`);
    await expect(card).toBeVisible();
    // DOM text is original case; CSS applies uppercase visually
    await expect(card.getByText('Bulgarian Method')).toBeVisible();
    // Stats
    await expect(card.getByText('5×')).toBeVisible();
    await expect(card.getByText('8w')).toBeVisible();
    // Link to detail
    await expect(page.getByTestId(`link-programme-${PROGRAMME_SUMMARY.id}`)).toBeVisible();
  });

  test('new programme form opens on button click', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await page.getByTestId('button-new-programme').click();
    // Use testid to avoid ambiguity between button text and form heading
    await expect(page.getByTestId('button-close-programme-form')).toBeVisible();
    await expect(page.getByTestId('button-save-programme')).toBeVisible();
    await expect(page.getByTestId('button-add-session')).toBeVisible();
  });

  test('page title h1 has type-page-title class', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/type-page-title/);
    // CSS uppercases "Programme room." visually; DOM text is original
    await expect(h1).toContainText('Programme room.');
  });

  test('plans nav item is active', async ({ page }) => {
    await setupMocks(page, { programmes: [] });
    await page.goto('/programme');

    await expect(page.getByTestId('link-nav-plans')).toHaveClass(/bg-primary/);
  });
});

test.describe('Programme detail', () => {
  test('loading state — skeleton visible', async ({ page }) => {
    await page.route(/\/api\/programmes\/1$/, () => { /* hang */ });
    await page.goto('/programme/1');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('error state — retry shown on fetch failure', async ({ page }) => {
    await setupMocks(page, { programme: 'error' });
    await page.goto('/programme/1');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
  });

  test('with data — programme name, sessions and exercises rendered', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    // Programme name in page title (DOM text, not CSS-uppercased)
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Bulgarian Method');

    // Session names (h2 elements, DOM text)
    await expect(page.getByText('Snatch Focus').first()).toBeVisible();
    await expect(page.getByText('C&J Focus').first()).toBeVisible();

    // Exercise rows inside first session
    await expect(page.getByText('Snatch').first()).toBeVisible();
    await expect(page.getByText('Front Squat').first()).toBeVisible();

    // Start buttons per session
    await expect(page.getByTestId(`button-start-session-${PROGRAMME.sessions[0].id}`)).toBeVisible();
    await expect(page.getByTestId(`button-start-session-${PROGRAMME.sessions[1].id}`)).toBeVisible();
  });

  test('edit button reveals programme form', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    await page.getByTestId('button-edit-programme').click();
    await expect(page.getByTestId('button-save-programme')).toBeVisible();
  });

  test('back link to programme list is visible', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME, programmes: [PROGRAMME_SUMMARY] });
    await page.goto('/programme/1');

    const backLink = page.getByTestId('link-back-programmes');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('All programmes');
  });

  test('session numbers use type-caption class', async ({ page }) => {
    await setupMocks(page, { programme: PROGRAMME });
    await page.goto('/programme/1');

    // Session caption e.g. "Session 01"
    await expect(page.getByText('Session 01')).toBeVisible();
    await expect(page.locator('.type-caption').first()).toBeVisible();
  });
});
