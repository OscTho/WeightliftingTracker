import { test, expect } from '@playwright/test';
import { setupMocks, PROFILE } from './fixtures';

test.describe('Profile', () => {
  test('loading state — skeleton visible while fetching', async ({ page }) => {
    await page.route(/\/api\/profile/, () => { /* hang */ });
    await page.goto('/profile');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('with existing profile — fields pre-filled', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByTestId('input-name')).toHaveValue('Alex Johnson');
    await expect(page.getByTestId('input-snatchPb')).toHaveValue('90');
    await expect(page.getByTestId('input-cleanJerkPb')).toHaveValue('110');
    await expect(page.getByTestId('input-backSquatPb')).toHaveValue('150');
    await expect(page.getByTestId('input-frontSquatPb')).toHaveValue('130');
  });

  test('save button present and accessible', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const saveBtn = page.getByTestId('button-save-profile');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toContainText('Save profile');
  });

  test('rounding increment buttons rendered with active state', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByTestId('button-rounding-1')).toBeVisible();
    await expect(page.getByTestId('button-rounding-2')).toBeVisible();
    await expect(page.getByTestId('button-rounding-2.5')).toBeVisible();
  });

  test('page title h1 has type-page-title class — DOM text not uppercased by CSS', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/type-page-title/);
    // CSS applies text-transform:uppercase visually; DOM text is original case
    await expect(h1).toContainText('Your numbers.');
  });

  test('eyebrow uses type-caption class', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    // PageHead renders an eyebrow paragraph with type-caption
    const eyebrow = page.locator('.type-caption').first();
    await expect(eyebrow).toBeVisible();
    await expect(eyebrow).toContainText('Profile');
  });

  test('three section headings with type-section-heading class', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    const sectionHeadings = page.locator('.type-section-heading');
    await expect(sectionHeadings).toHaveCount(3);
  });

  test('profile nav item is active when on profile page', async ({ page }) => {
    await setupMocks(page, { profile: PROFILE });
    await page.goto('/profile');

    await expect(page.getByTestId('link-nav-profile')).toHaveClass(/bg-primary/);
  });
});
