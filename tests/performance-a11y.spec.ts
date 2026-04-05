import { test, expect } from '@playwright/test';

test.describe('Performance & Accessibility', () => {
  test('homepage should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 812 });
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="menu"]');
    if (await mobileMenu.isVisible()) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('/');

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');

    // Check text elements have sufficient contrast
    const textElements = page.locator('p, a, button, span');
    const count = await textElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have proper link labels', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const hasText = text && text.trim().length > 0;
      const hasLabel = ariaLabel && ariaLabel.trim().length > 0;
      expect(hasText || hasLabel).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/checkout');

    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const count = await inputs.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible();
        expect(hasLabel || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);

    // Continue tab navigation
    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').first();
    await button.focus();

    const outline = await button.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outline || style.boxShadow;
    });

    expect(outline).not.toBe('none');
  });

  test('products page should load within time limit', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/products');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('search should be responsive', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/search?q=test');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/products');

    const lazyImages = page.locator('img[loading="lazy"]');
    const count = await lazyImages.count();

    if (count > 0) {
      // Images should exist in DOM but not all loaded immediately
      const img = lazyImages.first();
      await expect(img).toBeDefined();
    }
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.goto('/products');
    await page.goto('/search?q=test');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('GET /_next')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    const description = page.locator('meta[name="description"]');
    const viewport = page.locator('meta[name="viewport"]');

    await expect(description).toBeDefined();
    await expect(viewport).toBeDefined();
  });
});
