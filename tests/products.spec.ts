import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('should load products page', async ({ page }) => {
    await expect(page).toHaveTitle(/Products/);
  });

  test('should display product grid', async ({ page }) => {
    const products = page.locator('[data-testid="product-card"]');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have functional filters', async ({ page }) => {
    const filterToggle = page.locator('[data-testid="filter-toggle"]');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
      await expect(page.locator('[data-testid="filters"]')).toBeVisible();
    }
  });

  test('should have working pagination', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next")');
    const prevButton = page.locator('button:has-text("Previous")');

    if (await nextButton.isVisible()) {
      const initialUrl = page.url();
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      expect(newUrl).not.toBe(initialUrl);

      // Verify previous button can navigate back
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(initialUrl);
      }
    }
  });

  test('should add product to cart', async ({ page }) => {
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();

      const cartNotification = page.locator('[data-testid="cart-notification"], [data-testid="toast"]');
      await expect(cartNotification).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to product detail', async ({ page }) => {
    const productLink = page.locator('[data-testid="product-card"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/products/');
    }
  });

  test('should sort products', async ({ page }) => {
    const sortSelect = page.locator('select, [data-testid="sort-select"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.click();
      await page.locator('option[value="price-asc"]').click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should load images lazily', async ({ page }) => {
    const images = page.locator('img[loading="lazy"]');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have accessible product cards', async ({ page }) => {
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.isVisible()) {
      const button = productCard.locator('button').first();
      await expect(button).toHaveAttribute('aria-label', /Add to cart|View product/i);
    }
  });
});
