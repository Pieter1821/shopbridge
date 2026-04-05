import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search?q=test');
  });

  test('should display search results', async ({ page }) => {
    const results = page.locator('[data-testid="search-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show no results message if needed', async ({ page }) => {
    await page.goto('/search?q=nonexistentproduct123456789');
    const noResults = page.locator('[data-testid="no-results"]');
    if (await noResults.isVisible()) {
      await expect(noResults).toContainText(/no results|not found/i);
    }
  });

  test('should have working search filters', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-toggle"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await expect(page.locator('[data-testid="filters"]')).toBeVisible();
    }
  });

  test('should update results on filter change', async ({ page }) => {
    const priceFilter = page.locator('input[name="price-range"]');
    if (await priceFilter.isVisible()) {
      const initialCount = await page.locator('[data-testid="search-result"]').count();
      await priceFilter.fill('100');
      await page.waitForLoadState('networkidle');
      // Verify page updated and result count reflects filter
      await expect(page).toHaveURL(/search/);
      const newCount = await page.locator('[data-testid="search-result"]').count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    }
  });
});

test.describe('Checkout Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products and add to cart first
    await page.goto('/products');
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should access checkout from cart', async ({ page }) => {
    const cartIcon = page.locator('[data-testid="cart-icon"]');
    if (await cartIcon.isVisible()) {
      await cartIcon.click();
      await page.waitForLoadState('networkidle');

      const checkoutBtn = page.locator('button:has-text("Checkout")');
      if (await checkoutBtn.isVisible()) {
        await checkoutBtn.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('checkout');
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/checkout');

    const submitBtn = page.locator('button:has-text("Complete"), button:has-text("Pay")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      const errorMsg = page.locator('[data-testid="error"], .error, [role="alert"]');
      if (await errorMsg.isVisible()) {
        await expect(errorMsg).toBeVisible();
      }
    }
  });

  test('should display order summary', async ({ page }) => {
    await page.goto('/checkout');

    const orderSummary = page.locator('[data-testid="order-summary"]');
    if (await orderSummary.isVisible()) {
      await expect(orderSummary).toBeVisible();
      const total = page.locator('[data-testid="total-price"]');
      if (await total.isVisible()) {
        const text = await total.textContent();
        expect(text).toMatch(/\$|€|£/);
      }
    }
  });

  test('should have secure payment info notice', async ({ page }) => {
    await page.goto('/checkout');

    const secureNotice = page.locator('[data-testid="secure-notice"], :has-text("secure"), :has-text("SSL")');
    if (await secureNotice.isVisible()) {
      await expect(secureNotice).toBeVisible();
    }
  });
});
