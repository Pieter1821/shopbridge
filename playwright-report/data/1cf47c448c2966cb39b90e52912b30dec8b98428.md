# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.ts >> Homepage >> should have working navigation
- Location: tests\homepage.spec.ts:31:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('a:has-text("Products")') resolved to 2 elements:
    1) <a href="/products" class="rounded-full px-3 py-2 text-sm font-medium transition text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">Products</a> aka getByRole('link', { name: 'Products' })
    2) <a href="/products" class="rounded-2xl px-3 py-2 text-sm font-medium transition bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Products</a> aka getByText('Products').nth(1)

Call log:
    - checking visibility of locator('a:has-text("Products")')

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
          - link "Cart 0" [ref=e25] [cursor=pointer]:
            - /url: /cart
            - img [ref=e26]
            - text: Cart
            - generic [ref=e30]: "0"
    - main [ref=e31]:
      - generic [ref=e32]:
        - generic [ref=e33]:
          - generic [ref=e35]:
            - generic [ref=e36]:
              - generic [ref=e38]: Realtime stock
              - generic [ref=e40]: Secure checkout
              - generic [ref=e42]: Local delivery
            - paragraph [ref=e43]: Curated finds, clean essentials
            - heading "South African shopping with a sharper point of view." [level=1] [ref=e44]
            - paragraph [ref=e45]: ShopBridge brings together fashion, footwear, accessories, and everyday finds with a faster, calmer checkout flow for local shoppers.
            - generic [ref=e46]:
              - link "Shop the latest" [ref=e47] [cursor=pointer]:
                - /url: /products
                - text: Shop the latest
                - img [ref=e48]
              - link "Go to checkout" [ref=e51] [cursor=pointer]:
                - /url: /checkout
          - generic [ref=e52]:
            - generic [ref=e54]:
              - img [ref=e56]
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - heading "Quality checked" [level=2] [ref=e61]
                  - generic [ref=e63]: Recommended
                - paragraph [ref=e64]: Every product is selected for trusted quality and a polished shopping experience.
            - generic [ref=e66]:
              - img [ref=e68]
              - generic [ref=e73]:
                - heading "Nationwide delivery" [level=2] [ref=e75]
                - paragraph [ref=e76]: Fast fulfilment across Johannesburg, Cape Town, Durban, and beyond.
            - generic [ref=e78]:
              - img [ref=e80]
              - generic [ref=e83]:
                - heading "Flexible checkout" [level=2] [ref=e85]
                - paragraph [ref=e86]: A clean buying experience built for modern South African shoppers.
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]:
              - paragraph [ref=e90]: Categories
              - heading "Fewer, clearer ways to browse" [level=2] [ref=e91]
            - paragraph [ref=e92]: Showing 4 of 29 live categories
          - generic [ref=e93]:
            - link "Accessories Accessories collection" [ref=e94] [cursor=pointer]:
              - /url: /products?category=accessories
              - generic [ref=e95]:
                - paragraph [ref=e96]: Accessories
                - img [ref=e97]
              - paragraph [ref=e100]: Accessories collection
            - link "Apparel Apparel collection" [ref=e101] [cursor=pointer]:
              - /url: /products?category=apparel
              - generic [ref=e102]:
                - paragraph [ref=e103]: Apparel
                - img [ref=e104]
              - paragraph [ref=e107]: Apparel collection
            - link "Apparel Set Apparel Set in Apparel" [ref=e108] [cursor=pointer]:
              - /url: /products?category=apparel-apparel-set
              - generic [ref=e109]:
                - paragraph [ref=e110]: Apparel Set
                - img [ref=e111]
              - paragraph [ref=e114]: Apparel Set in Apparel
            - link "Bags Bags in Accessories" [ref=e115] [cursor=pointer]:
              - /url: /products?category=accessories-bags
              - generic [ref=e116]:
                - paragraph [ref=e117]: Bags
                - img [ref=e118]
              - paragraph [ref=e121]: Bags in Accessories
        - generic [ref=e122]:
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e126]: Featured now
              - heading "Curated drops" [level=2] [ref=e127]
            - link "View all" [ref=e128] [cursor=pointer]:
              - /url: /products
              - text: View all
              - img [ref=e129]
          - generic [ref=e131]:
            - generic [ref=e132]:
              - generic [ref=e133]:
                - img "Reid & Taylor Men Check Purple Shirts" [ref=e134]
                - generic [ref=e137]: Topwear
                - generic [ref=e138]:
                  - paragraph [ref=e139]: Reid
                  - heading "Reid & Taylor Men Check Purple Shirts" [level=3] [ref=e140]
              - generic [ref=e141]:
                - paragraph [ref=e142]: Shirts • Topwear • Apparel • Formal • Fall
                - generic [ref=e143]:
                  - generic [ref=e145]: Men
                  - generic [ref=e147]: Apparel
                  - generic [ref=e149]: Topwear
                - generic [ref=e150]:
                  - generic [ref=e153]:
                    - generic [ref=e154]: R 1 179,50
                    - generic [ref=e155]: R 2 209,50
                  - generic [ref=e156]: 15 in stock
                - link "View product" [ref=e157] [cursor=pointer]:
                  - /url: /products/reid-taylor-men-check-purple-shirts-12369
            - generic [ref=e158]:
              - generic [ref=e159]:
                - img "Clarks Men Hang Work Leather Black Formal Shoes" [ref=e160]
                - generic [ref=e163]: Shoes
                - generic [ref=e164]:
                  - paragraph [ref=e165]: Clarks
                  - heading "Clarks Men Hang Work Leather Black Formal Shoes" [level=3] [ref=e166]
              - generic [ref=e167]:
                - paragraph [ref=e168]: Formal Shoes • Shoes • Footwear • Formal • Fall
                - generic [ref=e169]:
                  - generic [ref=e171]: Men
                  - generic [ref=e173]: Footwear
                  - generic [ref=e175]: Shoes
                - generic [ref=e176]:
                  - generic [ref=e179]:
                    - generic [ref=e180]: R 931,45
                    - generic [ref=e181]: R 1 701,45
                  - generic [ref=e182]: 10 in stock
                - link "View product" [ref=e183] [cursor=pointer]:
                  - /url: /products/clarks-men-hang-work-leather-black-formal-shoes-10268
            - generic [ref=e184]:
              - generic [ref=e185]:
                - img "Carrera Men Dial steel finish strap Silver Watches" [ref=e186]
                - generic [ref=e189]: Watches
                - generic [ref=e190]:
                  - paragraph [ref=e191]: Carrera
                  - heading "Carrera Men Dial steel finish strap Silver Watches" [level=3] [ref=e192]
              - generic [ref=e193]:
                - paragraph [ref=e194]: Watches • Watches • Accessories • Casual • Winter
                - generic [ref=e195]:
                  - generic [ref=e197]: Men
                  - generic [ref=e199]: Accessories
                  - generic [ref=e201]: Watches
                - generic [ref=e202]:
                  - generic [ref=e205]:
                    - generic [ref=e206]: R 577,34
                    - generic [ref=e207]: R 2 007,34
                  - generic [ref=e208]: 39 in stock
                - link "View product" [ref=e209] [cursor=pointer]:
                  - /url: /products/carrera-men-dial-steel-finish-strap-silver-watches-11188
            - generic [ref=e210]:
              - generic [ref=e211]:
                - img "Wrangler Men Motor Rider Red T-Shirts" [ref=e212]
                - generic [ref=e215]: Topwear
                - generic [ref=e216]:
                  - paragraph [ref=e217]: Wrangler
                  - heading "Wrangler Men Motor Rider Red T-Shirts" [level=3] [ref=e218]
              - generic [ref=e219]:
                - paragraph [ref=e220]: Tshirts • Topwear • Apparel • Casual • Fall
                - generic [ref=e221]:
                  - generic [ref=e223]: Men
                  - generic [ref=e225]: Apparel
                  - generic [ref=e227]: Topwear
                - generic [ref=e228]:
                  - generic [ref=e231]:
                    - generic [ref=e232]: R 1 512,20
                    - generic [ref=e233]: R 1 682,20
                  - generic [ref=e234]: 5 in stock
                - link "View product" [ref=e235] [cursor=pointer]:
                  - /url: /products/wrangler-men-motor-rider-red-t-shirts-10866
            - generic [ref=e236]:
              - generic [ref=e237]:
                - img "Catwalk Women Gun Metal Grey Heels" [ref=e238]
                - generic [ref=e241]: Shoes
                - generic [ref=e242]:
                  - paragraph [ref=e243]: Catwalk
                  - heading "Catwalk Women Gun Metal Grey Heels" [level=3] [ref=e244]
              - generic [ref=e245]:
                - paragraph [ref=e246]: Heels • Shoes • Footwear • Casual • Winter
                - generic [ref=e247]:
                  - generic [ref=e249]: Women
                  - generic [ref=e251]: Footwear
                  - generic [ref=e253]: Shoes
                - generic [ref=e254]:
                  - generic [ref=e257]:
                    - generic [ref=e258]: R 901,23
                    - generic [ref=e259]: R 1 931,23
                  - generic [ref=e260]: 28 in stock
                - link "View product" [ref=e261] [cursor=pointer]:
                  - /url: /products/catwalk-women-gun-metal-grey-heels-11518
            - generic [ref=e262]:
              - generic [ref=e263]:
                - img "Ganuchi Men Casual Black Sandals" [ref=e264]
                - generic [ref=e267]: Sandal
                - generic [ref=e268]:
                  - paragraph [ref=e269]: Ganuchi
                  - heading "Ganuchi Men Casual Black Sandals" [level=3] [ref=e270]
              - generic [ref=e271]:
                - paragraph [ref=e272]: Sandals • Sandal • Footwear • Casual • Summer
                - generic [ref=e273]:
                  - generic [ref=e275]: Men
                  - generic [ref=e277]: Footwear
                  - generic [ref=e279]: Sandal
                - generic [ref=e280]:
                  - generic [ref=e284]: R 100,00
                  - generic [ref=e285]: 27 in stock
                - link "View product" [ref=e286] [cursor=pointer]:
                  - /url: /products/ganuchi-men-casual-black-sandals-11940
    - contentinfo [ref=e287]:
      - generic [ref=e288]:
        - generic [ref=e289]:
          - heading "ShopBridge" [level=2] [ref=e290]
          - paragraph [ref=e291]: Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
        - generic [ref=e292]:
          - generic [ref=e293]: Authenticity first
          - generic [ref=e294]: Nationwide delivery
          - generic [ref=e295]: Secure checkout
          - generic [ref=e296]: Curated weekly drops
        - generic [ref=e297]:
          - link "Terms & Conditions" [ref=e298] [cursor=pointer]:
            - /url: /terms
          - link "Privacy Policy" [ref=e299] [cursor=pointer]:
            - /url: /privacy
        - paragraph [ref=e300]: © 2026 ShopBridge. All rights reserved.
  - button "Open Next.js Dev Tools" [ref=e306] [cursor=pointer]:
    - generic [ref=e309]:
      - text: Compiling
      - generic [ref=e310]:
        - generic [ref=e311]: .
        - generic [ref=e312]: .
        - generic [ref=e313]: .
  - alert [ref=e314]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Homepage', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('should load homepage', async ({ page }) => {
  9  |     await expect(page).toHaveTitle(/ShopBridge|Home/);
  10 |   });
  11 | 
  12 |   test('should display hero section', async ({ page }) => {
  13 |     const hero = page.locator('[data-testid="hero"]');
  14 |     await expect(hero).toBeVisible();
  15 |   });
  16 | 
  17 |   test('should have functional search', async ({ page }) => {
  18 |     const searchInput = page.locator('input[placeholder*="search" i]');
  19 |     if (await searchInput.isVisible()) {
  20 |       await searchInput.fill('product');
  21 |       await page.keyboard.press('Enter');
  22 |       await expect(page).toHaveURL(/search/);
  23 |     }
  24 |   });
  25 | 
  26 |   test('should display products section', async ({ page }) => {
  27 |     const products = page.locator('[data-testid="product-card"]');
  28 |     await expect(products.first()).toBeVisible();
  29 |   });
  30 | 
  31 |   test('should have working navigation', async ({ page }) => {
  32 |     const productsLink = page.locator('a:has-text("Products")');
> 33 |     if (await productsLink.isVisible()) {
     |                            ^ Error: locator.isVisible: Error: strict mode violation: locator('a:has-text("Products")') resolved to 2 elements:
  34 |       await productsLink.click();
  35 |       await expect(page).toHaveURL(/products/);
  36 |     }
  37 |   });
  38 | 
  39 |   test('should load images without errors', async ({ page }) => {
  40 |     const images = page.locator('img');
  41 |     const count = await images.count();
  42 | 
  43 |     for (let i = 0; i < Math.min(count, 10); i++) {
  44 |       const img = images.nth(i);
  45 |       const isVisible = await img.isVisible();
  46 |       if (isVisible) {
  47 |         const completeState = await img.evaluate((el: HTMLImageElement) => el.complete);
  48 |         expect(completeState).toBeTruthy();
  49 |       }
  50 |     }
  51 |   });
  52 | 
  53 |   test('should have correct viewport meta tag', async ({ page }) => {
  54 |     const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  55 |     expect(viewport).toContain('width=device-width');
  56 |   });
  57 | 
  58 |   test('should support dark mode toggle', async ({ page }) => {
  59 |     const themeToggle = page.locator('[data-testid="theme-toggle"]');
  60 |     if (await themeToggle.isVisible()) {
  61 |       await themeToggle.click();
  62 |       await expect(themeToggle).toBeChecked({ checked: true });
  63 |     }
  64 |   });
  65 | });
  66 | 
```