# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance-a11y.spec.ts >> Performance & Accessibility >> should not have console errors
- Location: tests\performance-a11y.spec.ts:132:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/products", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - button "Switch to dark mode" [ref=e22]:
            - img [ref=e23]
          - generic [ref=e25]:
            - button "Sign in" [ref=e26]
            - button "Sign up" [ref=e27]
          - link "Cart 0" [ref=e28] [cursor=pointer]:
            - /url: /cart
            - img [ref=e29]
            - text: Cart
            - generic [ref=e33]: "0"
    - main [ref=e34]:
      - generic [ref=e37]:
        - generic:
          - img
        - generic [ref=e38]:
          - paragraph [ref=e39]: Loading
          - heading "Loading the latest drops" [level=1] [ref=e40]
          - paragraph [ref=e41]: Fetching live catalogue data, pricing, and stock so the grid stays accurate.
    - contentinfo [ref=e59]:
      - generic [ref=e60]:
        - generic [ref=e61]:
          - heading "ShopBridge" [level=2] [ref=e62]
          - paragraph [ref=e63]: Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
        - generic [ref=e64]:
          - generic [ref=e65]: Authenticity first
          - generic [ref=e66]: Nationwide delivery
          - generic [ref=e67]: Secure checkout
          - generic [ref=e68]: Curated weekly drops
        - generic [ref=e69]:
          - link "Terms & Conditions" [ref=e70] [cursor=pointer]:
            - /url: /terms
          - link "Privacy Policy" [ref=e71] [cursor=pointer]:
            - /url: /privacy
        - paragraph [ref=e72]: © 2026 ShopBridge. All rights reserved.
  - button "Open Next.js Dev Tools" [ref=e78] [cursor=pointer]:
    - img [ref=e79]
  - alert [ref=e82]
```

# Test source

```ts
  42  | 
  43  |     const links = page.locator('a');
  44  |     const count = await links.count();
  45  | 
  46  |     for (let i = 0; i < Math.min(count, 20); i++) {
  47  |       const link = links.nth(i);
  48  |       const text = await link.textContent();
  49  |       const ariaLabel = await link.getAttribute('aria-label');
  50  |       const hasText = text && text.trim().length > 0;
  51  |       const hasLabel = ariaLabel && ariaLabel.trim().length > 0;
  52  |       expect(hasText || hasLabel).toBeTruthy();
  53  |     }
  54  |   });
  55  | 
  56  |   test('should have proper form labels', async ({ page }) => {
  57  |     await page.goto('/checkout');
  58  | 
  59  |     const inputs = page.locator('input[type="text"], input[type="email"], textarea');
  60  |     const count = await inputs.count();
  61  | 
  62  |     for (let i = 0; i < Math.min(count, 10); i++) {
  63  |       const input = inputs.nth(i);
  64  |       const id = await input.getAttribute('id');
  65  |       const ariaLabel = await input.getAttribute('aria-label');
  66  | 
  67  |       if (id) {
  68  |         const label = page.locator(`label[for="${id}"]`);
  69  |         const hasLabel = await label.isVisible();
  70  |         expect(hasLabel || ariaLabel).toBeTruthy();
  71  |       }
  72  |     }
  73  |   });
  74  | 
  75  |   test('should have proper keyboard navigation', async ({ page }) => {
  76  |     await page.goto('/');
  77  | 
  78  |     // Test tab navigation
  79  |     await page.keyboard.press('Tab');
  80  |     let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  81  |     expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  82  | 
  83  |     // Continue tab navigation
  84  |     await page.keyboard.press('Tab');
  85  |     focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  86  |     expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  87  |   });
  88  | 
  89  |   test('should have proper focus indicators', async ({ page }) => {
  90  |     await page.goto('/');
  91  | 
  92  |     const button = page.locator('button').first();
  93  |     await button.focus();
  94  | 
  95  |     const outline = await button.evaluate((el) => {
  96  |       const style = window.getComputedStyle(el);
  97  |       return style.outline || style.boxShadow;
  98  |     });
  99  | 
  100 |     expect(outline).not.toBe('none');
  101 |   });
  102 | 
  103 |   test('products page should load within time limit', async ({ page }) => {
  104 |     const startTime = Date.now();
  105 |     await page.goto('/products');
  106 |     const loadTime = Date.now() - startTime;
  107 | 
  108 |     expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  109 |   });
  110 | 
  111 |   test('search should be responsive', async ({ page }) => {
  112 |     const startTime = Date.now();
  113 |     await page.goto('/search?q=test');
  114 |     const loadTime = Date.now() - startTime;
  115 | 
  116 |     expect(loadTime).toBeLessThan(5000);
  117 |   });
  118 | 
  119 |   test('should lazy load images', async ({ page }) => {
  120 |     await page.goto('/products');
  121 | 
  122 |     const lazyImages = page.locator('img[loading="lazy"]');
  123 |     const count = await lazyImages.count();
  124 | 
  125 |     if (count > 0) {
  126 |       // Images should exist in DOM but not all loaded immediately
  127 |       const img = lazyImages.first();
  128 |       await expect(img).toBeDefined();
  129 |     }
  130 |   });
  131 | 
  132 |   test('should not have console errors', async ({ page }) => {
  133 |     const errors: string[] = [];
  134 | 
  135 |     page.on('console', (msg) => {
  136 |       if (msg.type() === 'error') {
  137 |         errors.push(msg.text());
  138 |       }
  139 |     });
  140 | 
  141 |     await page.goto('/');
> 142 |     await page.goto('/products');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  143 |     await page.goto('/search?q=test');
  144 | 
  145 |     // Filter out known non-critical errors
  146 |     const criticalErrors = errors.filter(
  147 |       (e) =>
  148 |         !e.includes('favicon') &&
  149 |         !e.includes('404') &&
  150 |         !e.includes('GET /_next')
  151 |     );
  152 | 
  153 |     expect(criticalErrors.length).toBe(0);
  154 |   });
  155 | 
  156 |   test('should have proper meta tags', async ({ page }) => {
  157 |     await page.goto('/');
  158 | 
  159 |     const description = page.locator('meta[name="description"]');
  160 |     const viewport = page.locator('meta[name="viewport"]');
  161 | 
  162 |     await expect(description).toBeDefined();
  163 |     await expect(viewport).toBeDefined();
  164 |   });
  165 | });
  166 | 
```