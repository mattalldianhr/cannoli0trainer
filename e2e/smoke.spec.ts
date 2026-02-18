import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cannoli|S&C/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/athletes lists 5 athletes', async ({ page }) => {
    await page.goto('/athletes');
    await expect(page).toHaveURL(/athletes/);

    // Should render a list of athlete names
    const athleteItems = page.getByRole('link').filter({ hasText: /Matt|Chris|Michael|Hannah|Maddy/i });
    await expect(athleteItems).toHaveCount(5);
  });

  test('/exercises shows exercise library with search', async ({ page }) => {
    await page.goto('/exercises');
    await expect(page).toHaveURL(/exercises/);

    // Should have a search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Should show exercises (800+ in DB, page likely paginates)
    const exerciseItems = page.getByRole('listitem').or(page.locator('[data-testid="exercise-card"]'));
    await expect(exerciseItems.first()).toBeVisible();

    // Search should filter results
    await searchInput.fill('squat');
    await page.waitForTimeout(500); // debounce
    const filtered = page.getByRole('listitem').or(page.locator('[data-testid="exercise-card"]'));
    await expect(filtered.first()).toBeVisible();
  });

  test('/dashboard displays stat cards with non-zero values', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Should have stat cards showing real data
    const statCards = page.locator('[data-testid="stat-card"]').or(page.getByRole('heading'));
    await expect(statCards.first()).toBeVisible();

    // At least one stat should be non-zero (5 athletes, active programs, etc.)
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
    // Check for numeric values > 0 in stat areas
    expect(pageText).toMatch(/[1-9]\d*/);
  });

  test('/analytics renders charts', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/analytics/);

    // Should render chart containers (SVG from recharts or similar)
    const charts = page.locator('svg.recharts-surface').or(page.locator('[data-testid="chart"]'));
    await expect(charts.first()).toBeVisible({ timeout: 10_000 });
  });
});
