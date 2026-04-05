# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: search-checkout.spec.ts >> Checkout Page >> should have secure payment info notice
- Location: tests\search-checkout.spec.ts:98:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('[data-testid="secure-notice"], :has-text("secure"), :has-text("SSL")') resolved to 12 elements:
    1) <html lang="en" data-scroll-behavior="smooth" class="h-full antialiased geist_deef94d5-module__Sms4YG__variable geist_mono_1bf8cbf6-module__FlyLvG__variable font-sans poppins_736f17cb-module__TYV3Na__variable">…</html> aka locator('html')
    2) <body class="min-h-full bg-slate-100 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-50">…</body> aka locator('body')
    3) <div class="flex min-h-screen flex-col">…</div> aka locator('div').nth(1)
    4) <main class="flex-1">…</main> aka getByRole('main')
    5) <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">…</div> aka locator('div').filter({ hasText: 'CheckoutSecure checkout,' }).nth(1)
    6) <div class="mb-6">…</div> aka getByText('CheckoutSecure checkout,')
    7) <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Secure checkout, powered by Stripe</h1> aka getByRole('heading', { name: 'Secure checkout, powered by' })
    8) <p class="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">Enter your delivery details, review the final amo…</p> aka getByText('Enter your delivery details,')
    9) <footer class="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">…</footer> aka getByRole('contentinfo')
    10) <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-slate-600 dark:text-slate-300 sm:px-6 lg:px-8">…</div> aka locator('div').filter({ hasText: 'ShopBridgeFashion,' }).nth(1)
    ...

Call log:
    - checking visibility of locator('[data-testid="secure-notice"], :has-text("secure"), :has-text("SSL")')

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
      - generic [ref=e35]:
        - generic [ref=e36]:
          - paragraph [ref=e37]: Checkout
          - heading "Secure checkout, powered by Stripe" [level=1] [ref=e38]
          - paragraph [ref=e39]: Enter your delivery details, review the final amount including VAT, and pay securely with card, Apple Pay, Google Pay, and other supported methods.
        - generic [ref=e40]:
          - generic [ref=e41]:
            - paragraph [ref=e42]: Sign in required
            - paragraph [ref=e43]: Please sign in before you can pay for your order or place a purchase.
          - button "Sign in to continue" [ref=e44]
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]:
              - heading "Contact details" [level=2] [ref=e48]
              - generic [ref=e49]:
                - generic [ref=e50]:
                  - generic [ref=e51]: First name
                  - textbox "First name" [ref=e52]
                - generic [ref=e53]:
                  - generic [ref=e54]: Last name
                  - textbox "Last name" [ref=e55]
                - generic [ref=e56]:
                  - generic [ref=e57]: Email address
                  - textbox "Email address" [ref=e58]
                - generic [ref=e59]:
                  - generic [ref=e60]: Mobile number
                  - textbox "Mobile number" [ref=e61]
            - generic [ref=e62]:
              - heading "Delivery address" [level=2] [ref=e63]
              - generic [ref=e64]:
                - generic [ref=e65]:
                  - generic [ref=e66]: Street address
                  - textbox "Street address" [ref=e67]
                - generic [ref=e68]:
                  - generic [ref=e69]: Apartment, suite, etc. (optional)
                  - textbox "Apartment, suite, etc." [ref=e70]:
                    - /placeholder: Apartment, suite, etc. (optional)
                - generic [ref=e71]:
                  - generic [ref=e72]:
                    - generic [ref=e73]: City
                    - textbox "City" [ref=e74]
                  - generic [ref=e75]:
                    - generic [ref=e76]: Province
                    - combobox "Province" [ref=e77]:
                      - option "Gauteng" [selected]
                      - option "Western Cape"
                      - option "KwaZulu-Natal"
                      - option "Eastern Cape"
                      - option "Free State"
                      - option "Limpopo"
                      - option "Mpumalanga"
                      - option "Northern Cape"
                      - option "North West"
                  - generic [ref=e78]:
                    - generic [ref=e79]: Postal code
                    - textbox "Postal code" [ref=e80]
            - generic [ref=e81]:
              - heading "Delivery method" [level=2] [ref=e82]
              - generic [ref=e83]:
                - generic [ref=e84]:
                  - generic [ref=e85]:
                    - radio "Standard delivery · 2–4 business days Free" [checked] [ref=e86]
                    - generic [ref=e87]: Standard delivery · 2–4 business days
                  - generic [ref=e88]: Free
                - generic [ref=e89]:
                  - generic [ref=e90]:
                    - radio "Express delivery · 1–2 business days R 99,00" [ref=e91]
                    - generic [ref=e92]: Express delivery · 1–2 business days
                  - generic [ref=e93]: R 99,00
                - generic [ref=e94]:
                  - generic [ref=e95]:
                    - radio "Cape Town same-day courier on selected drops R 149,00" [ref=e96]
                    - generic [ref=e97]: Cape Town same-day courier on selected drops
                  - generic [ref=e98]: R 149,00
          - complementary [ref=e99]:
            - heading "Order summary" [level=2] [ref=e100]
            - paragraph [ref=e101]: 0 items in your cart
            - generic [ref=e102]:
              - generic [ref=e103]:
                - generic [ref=e104]: Subtotal
                - generic [ref=e105]: R 0,00
              - generic [ref=e106]:
                - generic [ref=e107]: VAT (15%)
                - generic [ref=e108]: R 0,00
              - generic [ref=e109]:
                - generic [ref=e110]: Delivery
                - generic [ref=e111]: Free
              - generic [ref=e112]:
                - generic [ref=e113]: Total
                - generic [ref=e114]: R 0,00
            - generic [ref=e115]:
              - text: Your cart is empty. Add a few products before checkout.
              - link "Browse products" [ref=e116] [cursor=pointer]:
                - /url: /products
    - contentinfo [ref=e117]:
      - generic [ref=e118]:
        - generic [ref=e119]:
          - heading "ShopBridge" [level=2] [ref=e120]
          - paragraph [ref=e121]: Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
        - generic [ref=e122]:
          - generic [ref=e123]: Authenticity first
          - generic [ref=e124]: Nationwide delivery
          - generic [ref=e125]: Secure checkout
          - generic [ref=e126]: Curated weekly drops
        - generic [ref=e127]:
          - link "Terms & Conditions" [ref=e128] [cursor=pointer]:
            - /url: /terms
          - link "Privacy Policy" [ref=e129] [cursor=pointer]:
            - /url: /privacy
        - paragraph [ref=e130]: © 2026 ShopBridge. All rights reserved.
  - button "Open Next.js Dev Tools" [ref=e136] [cursor=pointer]:
    - img [ref=e137]
  - alert [ref=e140]
```

# Test source

```ts
  2   | 
  3   | test.describe('Search Page', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/search?q=test');
  6   |   });
  7   | 
  8   |   test('should display search results', async ({ page }) => {
  9   |     const results = page.locator('[data-testid="search-result"]');
  10  |     const count = await results.count();
  11  |     expect(count).toBeGreaterThanOrEqual(0);
  12  |   });
  13  | 
  14  |   test('should show no results message if needed', async ({ page }) => {
  15  |     await page.goto('/search?q=nonexistentproduct123456789');
  16  |     const noResults = page.locator('[data-testid="no-results"]');
  17  |     if (await noResults.isVisible()) {
  18  |       await expect(noResults).toContainText(/no results|not found/i);
  19  |     }
  20  |   });
  21  | 
  22  |   test('should have working search filters', async ({ page }) => {
  23  |     const filterButton = page.locator('[data-testid="filter-toggle"]');
  24  |     if (await filterButton.isVisible()) {
  25  |       await filterButton.click();
  26  |       await expect(page.locator('[data-testid="filters"]')).toBeVisible();
  27  |     }
  28  |   });
  29  | 
  30  |   test('should update results on filter change', async ({ page }) => {
  31  |     const priceFilter = page.locator('input[name="price-range"]');
  32  |     if (await priceFilter.isVisible()) {
  33  |       const initialCount = await page.locator('[data-testid="search-result"]').count();
  34  |       await priceFilter.fill('100');
  35  |       await page.waitForLoadState('networkidle');
  36  |       // Verify page updated and result count reflects filter
  37  |       await expect(page).toHaveURL(/search/);
  38  |       const newCount = await page.locator('[data-testid="search-result"]').count();
  39  |       expect(newCount).toBeLessThanOrEqual(initialCount);
  40  |     }
  41  |   });
  42  | });
  43  | 
  44  | test.describe('Checkout Page', () => {
  45  |   test.beforeEach(async ({ page }) => {
  46  |     // Navigate to products and add to cart first
  47  |     await page.goto('/products');
  48  |     const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
  49  |     if (await addToCartBtn.isVisible()) {
  50  |       await addToCartBtn.click();
  51  |       await page.waitForLoadState('networkidle');
  52  |     }
  53  |   });
  54  | 
  55  |   test('should access checkout from cart', async ({ page }) => {
  56  |     const cartIcon = page.locator('[data-testid="cart-icon"]');
  57  |     if (await cartIcon.isVisible()) {
  58  |       await cartIcon.click();
  59  |       await page.waitForLoadState('networkidle');
  60  | 
  61  |       const checkoutBtn = page.locator('button:has-text("Checkout")');
  62  |       if (await checkoutBtn.isVisible()) {
  63  |         await checkoutBtn.click();
  64  |         await page.waitForLoadState('networkidle');
  65  |         expect(page.url()).toContain('checkout');
  66  |       }
  67  |     }
  68  |   });
  69  | 
  70  |   test('should validate required fields', async ({ page }) => {
  71  |     await page.goto('/checkout');
  72  | 
  73  |     const submitBtn = page.locator('button:has-text("Complete"), button:has-text("Pay")');
  74  |     if (await submitBtn.isVisible()) {
  75  |       await submitBtn.click();
  76  | 
  77  |       const errorMsg = page.locator('[data-testid="error"], .error, [role="alert"]');
  78  |       if (await errorMsg.isVisible()) {
  79  |         await expect(errorMsg).toBeVisible();
  80  |       }
  81  |     }
  82  |   });
  83  | 
  84  |   test('should display order summary', async ({ page }) => {
  85  |     await page.goto('/checkout');
  86  | 
  87  |     const orderSummary = page.locator('[data-testid="order-summary"]');
  88  |     if (await orderSummary.isVisible()) {
  89  |       await expect(orderSummary).toBeVisible();
  90  |       const total = page.locator('[data-testid="total-price"]');
  91  |       if (await total.isVisible()) {
  92  |         const text = await total.textContent();
  93  |         expect(text).toMatch(/\$|€|£/);
  94  |       }
  95  |     }
  96  |   });
  97  | 
  98  |   test('should have secure payment info notice', async ({ page }) => {
  99  |     await page.goto('/checkout');
  100 | 
  101 |     const secureNotice = page.locator('[data-testid="secure-notice"], :has-text("secure"), :has-text("SSL")');
> 102 |     if (await secureNotice.isVisible()) {
      |                            ^ Error: locator.isVisible: Error: strict mode violation: locator('[data-testid="secure-notice"], :has-text("secure"), :has-text("SSL")') resolved to 12 elements:
  103 |       await expect(secureNotice).toBeVisible();
  104 |     }
  105 |   });
  106 | });
  107 | 
```