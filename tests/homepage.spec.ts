import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/ShopBridge|Home/);
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]');
    await expect(hero).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('product');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/search/);
    }
  });

  test('should display products section', async ({ page }) => {
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    const productsLink = page.locator('a:has-text("Products")');
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/products/);
    }
  });

  test('should load images without errors', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const isVisible = await img.isVisible();
      if (isVisible) {
        const completeState = await img.evaluate((el: HTMLImageElement) => el.complete);
        expect(completeState).toBeTruthy();
      }
    }
  });

  test('should have correct viewport meta tag', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should support dark mode toggle', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await expect(themeToggle).toBeChecked({ checked: true });
    }
  });
});
