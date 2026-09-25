import { test, expect } from '@playwright/test';
import { setupMocks, WORKOUT_ACTIVE, WORKOUT_ALL_SETS_DONE, WORKOUT_COMPLETED } from './fixtures';

test.describe('Workout — active', () => {
  test('loading state — skeleton visible', async ({ page }) => {
    await page.route(/\/api\/workouts\/99$/, () => { /* hang */ });
    await page.goto('/workout/99');

    await expect(page.getByTestId('status-loading')).toBeVisible();
  });

  test('error state — retry shown on fetch failure', async ({ page }) => {
    await setupMocks(page, { workout: 'error' });
    await page.goto('/workout/99');

    await expect(page.getByTestId('status-error')).toBeVisible();
    await expect(page.getByTestId('button-retry')).toBeVisible();
  });

  test('active workout — current set card with session name visible', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    // Session name in h1 — DOM text, not CSS-uppercased
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Snatch Focus');

    // Programme name caption
    await expect(page.getByText('Bulgarian Method')).toBeVisible();

    // Complete and miss action buttons
    await expect(page.getByTestId('button-complete-set')).toBeVisible();
    await expect(page.getByTestId('button-miss-set')).toBeVisible();

    // Set progress counter: 2/3
    await expect(page.getByText('2/3')).toBeVisible();
  });

  test('active workout — exit link present', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    await expect(page.getByTestId('link-workout-exit')).toBeVisible();
    await expect(page.getByTestId('link-workout-exit')).toContainText('Exit workout');
  });

  test('active workout — saves an adjusted load without completing the rep', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    let savedBody: unknown;
    await page.route(/\/api\/workouts\/99\/sets\/303$/, async (route) => {
      savedBody = route.request().postDataJSON();
      const updatedWorkout = {
        ...WORKOUT_ACTIVE,
        sets: WORKOUT_ACTIVE.sets.map((set) => set.id === 303 ? { ...set, weight: 75 } : set),
      };
      await route.fulfill({ status: 200, body: JSON.stringify(updatedWorkout), contentType: 'application/json' });
    });
    await page.goto('/workout/99');

    await page.getByTestId('button-edit-workout-load').click();
    await page.getByTestId('input-workout-load').fill('75');
    await page.getByTestId('button-save-workout-load').click();

    await expect(page.getByTestId('button-save-workout-load')).toHaveCount(0);
    expect(savedBody).toEqual({ weight: 75 });
    await expect(page.locator('.text-workout-weight')).toContainText('75');
    await expect(page.getByText('2/3')).toBeVisible();
  });

  test('accessory workout — labels and saves equipment from the load editor', async ({ page }) => {
    const accessoryWorkout = {
      ...WORKOUT_ACTIVE,
      sessionName: 'Accessories',
      completedSets: 0,
      attempts: 0,
      sets: [{
        ...WORKOUT_ACTIVE.sets[0],
        id: 401,
        movementId: 'deadlift',
        exercise: 'deadlift',
        setNumber: 1,
        totalSets: 1,
        reps: 8,
        percentage: undefined,
        weight: 32,
        equipment: 'kettlebell',
        status: 'pending',
        completedAt: null,
      }],
    };
    await setupMocks(page, { workout: accessoryWorkout });
    let savedBody: unknown;
    await page.route(/\/api\/workouts\/99\/sets\/401$/, async (route) => {
      savedBody = route.request().postDataJSON();
      const updatedWorkout = {
        ...accessoryWorkout,
        sets: accessoryWorkout.sets.map((set) => ({ ...set, equipment: 'dumbbell' })),
      };
      await route.fulfill({ status: 200, body: JSON.stringify(updatedWorkout), contentType: 'application/json' });
    });
    await page.goto('/workout/99');

    await expect(page.getByText('Equipment', { exact: true })).toBeVisible();
    await expect(page.getByText('Kettlebell', { exact: true })).toBeVisible();
    await page.getByTestId('button-edit-workout-load').click();
    await page.getByTestId('select-workout-equipment').selectOption('dumbbell');
    await page.getByTestId('button-save-workout-load').click();

    expect(savedBody).toEqual({ weight: 32, equipment: 'dumbbell' });
    await expect(page.getByText('Dumbbell', { exact: true })).toBeVisible();
  });

  test('active workout — uses the same status-bar space and content gutters as other pages', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    const exitLink = page.getByTestId('link-workout-exit');
    const completeButton = page.getByTestId('button-complete-set');
    const exitBox = await exitLink.boundingBox();
    const completeBox = await completeButton.boundingBox();

    expect(exitBox?.x).toBe(20);
    expect(exitBox?.y).toBeGreaterThan(44);
    expect(completeBox?.x).toBe(20);
    expect(completeBox?.width).toBe(page.viewportSize()?.width! - 40);
  });

  test('missed-set sheet opens on miss button click', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    await page.getByTestId('button-miss-set').click();

    await expect(page.getByTestId('button-retry-set')).toBeVisible();
    await expect(page.getByTestId('button-move-on')).toBeVisible();
    await expect(page.getByText('Choose your next move')).toBeVisible();
  });

  test('all sets done — finish workout button shown', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ALL_SETS_DONE });
    await page.goto('/workout/99');

    await expect(page.getByText('All reps accounted for')).toBeVisible();
    await expect(page.getByTestId('button-finish-workout')).toBeVisible();
  });

  test('typography — session h1 has type-page-title class', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveClass(/type-page-title/);
  });

  test('typography — set counter uses text-pb-number class', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_ACTIVE });
    await page.goto('/workout/99');

    const counter = page.locator('.text-pb-number').first();
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('2/3');
  });
});

test.describe('Workout — completed', () => {
  test('completed state — success screen with session name and stats', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_COMPLETED });
    await page.goto('/workout/99');

    // h1 shows session name (DOM text, CSS uppercases)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Snatch Focus');

    // "Session logged" caption
    await expect(page.getByText('Session logged')).toBeVisible();

    // Stats line: "3 sets completed · 0 missed · 3 attempts"
    await expect(page.getByText(/3 sets completed/)).toBeVisible();

    // Navigation links
    await expect(page.getByTestId('link-finished-home')).toBeVisible();
    await expect(page.getByTestId('link-finished-history')).toBeVisible();
  });

  test('completed state — uses the mobile status-bar space and content gutters', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_COMPLETED });
    await page.goto('/workout/99');

    const headingBox = await page.getByRole('heading', { level: 1 }).boundingBox();
    const homeBox = await page.getByTestId('link-finished-home').boundingBox();

    expect(headingBox?.y).toBeGreaterThan(44);
    expect(homeBox?.x).toBe(20);
    expect(homeBox?.width).toBe(page.viewportSize()?.width! - 40);
  });

  test('completed state — "Back to today" link points to home', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_COMPLETED });
    await page.goto('/workout/99');

    await expect(page.getByTestId('link-finished-home')).toHaveAttribute('href', '/');
  });

  test('completed state — "View history" link points to history', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_COMPLETED });
    await page.goto('/workout/99');

    await expect(page.getByTestId('link-finished-history')).toHaveAttribute('href', '/history');
  });

  test('completed state — success icon ring visible', async ({ page }) => {
    await setupMocks(page, { workout: WORKOUT_COMPLETED });
    await page.goto('/workout/99');

    // Success icon wrapped in gold ring (bg-secondary/20)
    const ring = page.locator('[class*="bg-secondary"]').first();
    await expect(ring).toBeVisible();
  });
});
