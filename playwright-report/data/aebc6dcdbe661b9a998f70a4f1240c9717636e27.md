# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: products.spec.ts >> Products Page >> should add product to cart
- Location: tests\products.spec.ts:39:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/products", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e5]:
      - link "ShopBridge South African online shopping" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e8]: ShopBridge
        - generic [ref=e9]: South African online shopping
      - navigation [ref=e10]:
        - link "Home" [ref=e11] [cursor=pointer]:
          - /url: /
        - link "Products" [ref=e12] [cursor=pointer]:
          - /url: /products
        - link "Search" [ref=e13] [cursor=pointer]:
          - /url: /search
        - link "Checkout" [ref=e14] [cursor=pointer]:
          - /url: /checkout
      - generic [ref=e15]:
        - generic [ref=e17]:
          - img [ref=e18]
          - searchbox "Search products" [ref=e21]
        - button [disabled] [ref=e22]
        - link "Cart 0" [ref=e24] [cursor=pointer]:
          - /url: /cart
          - img [ref=e25]
          - text: Cart
          - generic [ref=e29]: "0"
  - main [ref=e30]:
    - generic [ref=e33]:
      - generic:
        - img
      - generic [ref=e34]:
        - paragraph [ref=e35]: Loading
        - heading "Loading the latest drops" [level=1] [ref=e36]
        - paragraph [ref=e37]: Fetching live catalogue data, pricing, and stock so the grid stays accurate.
  - contentinfo [ref=e55]:
    - generic [ref=e56]:
      - generic [ref=e57]:
        - heading "ShopBridge" [level=2] [ref=e58]
        - paragraph [ref=e59]: Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
      - generic [ref=e60]:
        - generic [ref=e61]: Authenticity first
        - generic [ref=e62]: Nationwide delivery
        - generic [ref=e63]: Secure checkout
        - generic [ref=e64]: Curated weekly drops
      - generic [ref=e65]:
        - link "Terms & Conditions" [ref=e66] [cursor=pointer]:
          - /url: /terms
        - link "Privacy Policy" [ref=e67] [cursor=pointer]:
          - /url: /privacy
      - paragraph [ref=e68]: © 2026 ShopBridge. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Products Page', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('/products');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6  |   });
  7  | 
  8  |   test('should load products page', async ({ page }) => {
  9  |     await expect(page).toHaveTitle(/Products/);
  10 |   });
  11 | 
  12 |   test('should display product grid', async ({ page }) => {
  13 |     const products = page.locator('[data-testid="product-card"]');
  14 |     const count = await products.count();
  15 |     expect(count).toBeGreaterThan(0);
  16 |   });
  17 | 
  18 |   test('should have functional filters', async ({ page }) => {
  19 |     const filterToggle = page.locator('[data-testid="filter-toggle"]');
  20 |     if (await filterToggle.isVisible()) {
  21 |       await filterToggle.click();
  22 |       await expect(page.locator('[data-testid="filters"]')).toBeVisible();
  23 |     }
  24 |   });
  25 | 
  26 |   test('should have working pagination', async ({ page }) => {
  27 |     const nextButton = page.locator('button:has-text("Next")');
  28 |     const prevButton = page.locator('button:has-text("Previous")');
  29 | 
  30 |     if (await nextButton.isVisible()) {
  31 |       const initialUrl = page.url();
  32 |       await nextButton.click();
  33 |       await page.waitForLoadState('networkidle');
  34 |       const newUrl = page.url();
  35 |       expect(newUrl).not.toBe(initialUrl);
  36 |     }
  37 |   });
  38 | 
  39 |   test('should add product to cart', async ({ page }) => {
  40 |     const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
  41 |     if (await addToCartBtn.isVisible()) {
  42 |       await addToCartBtn.click();
  43 | 
  44 |       const cartNotification = page.locator('[data-testid="cart-notification"], [data-testid="toast"]');
  45 |       await expect(cartNotification).toBeVisible({ timeout: 5000 });
  46 |     }
  47 |   });
  48 | 
  49 |   test('should navigate to product detail', async ({ page }) => {
  50 |     const productLink = page.locator('[data-testid="product-card"]').first();
  51 |     if (await productLink.isVisible()) {
  52 |       await productLink.click();
  53 |       await page.waitForLoadState('networkidle');
  54 |       expect(page.url()).toContain('/products/');
  55 |     }
  56 |   });
  57 | 
  58 |   test('should sort products', async ({ page }) => {
  59 |     const sortSelect = page.locator('select, [data-testid="sort-select"]');
  60 |     if (await sortSelect.isVisible()) {
  61 |       await sortSelect.click();
  62 |       await page.locator('option[value="price-asc"]').click();
  63 |       await page.waitForLoadState('networkidle');
  64 |     }
  65 |   });
  66 | 
  67 |   test('should load images lazily', async ({ page }) => {
  68 |     const images = page.locator('img[loading="lazy"]');
  69 |     const count = await images.count();
  70 |     expect(count).toBeGreaterThan(0);
  71 |   });
  72 | 
  73 |   test('should have accessible product cards', async ({ page }) => {
  74 |     const productCard = page.locator('[data-testid="product-card"]').first();
  75 |     if (await productCard.isVisible()) {
  76 |       const button = productCard.locator('button').first();
  77 |       await expect(button).toHaveAttribute('aria-label', /Add to cart|View product/i);
  78 |     }
  79 |   });
  80 | });
  81 | 
```