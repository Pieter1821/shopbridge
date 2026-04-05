# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance-a11y.spec.ts >> Performance & Accessibility >> search should be responsive
- Location: tests\performance-a11y.spec.ts:111:7

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5000
Received:   14775
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
            - searchbox "Search products" [ref=e21]: test
            - img [ref=e22]
          - button "Switch to dark mode" [ref=e24]:
            - img [ref=e25]
          - generic [ref=e27]:
            - button "Sign in" [ref=e28]
            - button "Sign up" [ref=e29]
          - link "Cart 0" [ref=e30] [cursor=pointer]:
            - /url: /cart
            - img [ref=e31]
            - text: Cart
            - generic [ref=e35]: "0"
    - main [ref=e36]:
      - generic [ref=e39]:
        - img [ref=e41]
        - generic [ref=e43]:
          - generic [ref=e45]: Something went wrong
          - heading "We hit a temporary storefront issue." [level=1] [ref=e46]
          - paragraph [ref=e47]: Please try the action again. If the problem keeps happening, head back to the catalogue and retry from there.
          - paragraph [ref=e48]: "Invalid src prop (https://example.com/image.jpg) on `next/image`, hostname \"example.com\" is not configured under images in your `next.config.js` See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host"
        - generic [ref=e49]:
          - button "Try again" [ref=e50] [cursor=pointer]:
            - img
            - text: Try again
          - link "Go home" [ref=e51] [cursor=pointer]:
            - /url: /
    - contentinfo [ref=e52]:
      - generic [ref=e53]:
        - generic [ref=e54]:
          - heading "ShopBridge" [level=2] [ref=e55]
          - paragraph [ref=e56]: Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
        - generic [ref=e57]:
          - generic [ref=e58]: Authenticity first
          - generic [ref=e59]: Nationwide delivery
          - generic [ref=e60]: Secure checkout
          - generic [ref=e61]: Curated weekly drops
        - generic [ref=e62]:
          - link "Terms & Conditions" [ref=e63] [cursor=pointer]:
            - /url: /terms
          - link "Privacy Policy" [ref=e64] [cursor=pointer]:
            - /url: /privacy
        - paragraph [ref=e65]: © 2026 ShopBridge. All rights reserved.
  - generic [ref=e70] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e71]:
      - img [ref=e72]
    - generic [ref=e75]:
      - button "Open issues overlay" [ref=e76]:
        - generic [ref=e77]:
          - generic [ref=e78]: "1"
          - generic [ref=e79]: "2"
        - generic [ref=e80]:
          - text: Issue
          - generic [ref=e81]: s
      - button "Collapse issues badge" [ref=e82]:
        - img [ref=e83]
  - alert [ref=e85]
```

# Test source

```ts
  16  |       await expect(mobileMenu).toBeVisible();
  17  |     }
  18  |   });
  19  | 
  20  |   test('should have semantic HTML structure', async ({ page }) => {
  21  |     await page.goto('/');
  22  | 
  23  |     const mainContent = page.locator('main');
  24  |     await expect(mainContent).toBeVisible();
  25  | 
  26  |     const headings = page.locator('h1, h2, h3');
  27  |     const count = await headings.count();
  28  |     expect(count).toBeGreaterThan(0);
  29  |   });
  30  | 
  31  |   test('should have proper color contrast', async ({ page }) => {
  32  |     await page.goto('/');
  33  | 
  34  |     // Check text elements have sufficient contrast
  35  |     const textElements = page.locator('p, a, button, span');
  36  |     const count = await textElements.count();
  37  |     expect(count).toBeGreaterThan(0);
  38  |   });
  39  | 
  40  |   test('should have proper link labels', async ({ page }) => {
  41  |     await page.goto('/');
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
> 116 |     expect(loadTime).toBeLessThan(5000);
      |                      ^ Error: expect(received).toBeLessThan(expected)
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
  142 |     await page.goto('/products');
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