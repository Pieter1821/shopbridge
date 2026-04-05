# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.ts >> Homepage >> should display hero section
- Location: tests\homepage.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="hero"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="hero"]')

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
          - generic [ref=e38]:
            - generic [ref=e39]:
              - generic [ref=e41]: Realtime stock
              - generic [ref=e43]: Secure checkout
              - generic [ref=e45]: Local delivery
            - paragraph [ref=e46]: Curated finds, clean essentials
            - heading "South African shopping with a sharper point of view." [level=1] [ref=e47]
            - paragraph [ref=e48]: ShopBridge brings together fashion, footwear, accessories, and everyday finds with a faster, calmer checkout flow for local shoppers.
            - generic [ref=e49]:
              - link "Shop the latest" [ref=e50] [cursor=pointer]:
                - /url: /products
                - text: Shop the latest
                - img [ref=e51]
              - link "Go to checkout" [ref=e54] [cursor=pointer]:
                - /url: /checkout
          - generic [ref=e55]:
            - generic [ref=e57]:
              - img [ref=e59]
              - generic [ref=e62]:
                - generic [ref=e63]:
                  - heading "Quality checked" [level=2] [ref=e64]
                  - generic [ref=e66]: Recommended
                - paragraph [ref=e67]: Every product is selected for trusted quality and a polished shopping experience.
            - generic [ref=e69]:
              - img [ref=e71]
              - generic [ref=e76]:
                - heading "Nationwide delivery" [level=2] [ref=e78]
                - paragraph [ref=e79]: Fast fulfilment across Johannesburg, Cape Town, Durban, and beyond.
            - generic [ref=e81]:
              - img [ref=e83]
              - generic [ref=e86]:
                - heading "Flexible checkout" [level=2] [ref=e88]
                - paragraph [ref=e89]: A clean buying experience built for modern South African shoppers.
        - generic [ref=e90]:
          - generic [ref=e91]:
            - generic [ref=e92]:
              - paragraph [ref=e93]: Categories
              - heading "Fewer, clearer ways to browse" [level=2] [ref=e94]
            - paragraph [ref=e95]: Showing 4 of 29 live categories
          - generic [ref=e96]:
            - link "Accessories Accessories collection" [ref=e97] [cursor=pointer]:
              - /url: /products?category=accessories
              - generic [ref=e98]:
                - paragraph [ref=e99]: Accessories
                - img [ref=e100]
              - paragraph [ref=e103]: Accessories collection
            - link "Apparel Apparel collection" [ref=e104] [cursor=pointer]:
              - /url: /products?category=apparel
              - generic [ref=e105]:
                - paragraph [ref=e106]: Apparel
                - img [ref=e107]
              - paragraph [ref=e110]: Apparel collection
            - link "Apparel Set Apparel Set in Apparel" [ref=e111] [cursor=pointer]:
              - /url: /products?category=apparel-apparel-set
              - generic [ref=e112]:
                - paragraph [ref=e113]: Apparel Set
                - img [ref=e114]
              - paragraph [ref=e117]: Apparel Set in Apparel
            - link "Bags Bags in Accessories" [ref=e118] [cursor=pointer]:
              - /url: /products?category=accessories-bags
              - generic [ref=e119]:
                - paragraph [ref=e120]: Bags
                - img [ref=e121]
              - paragraph [ref=e124]: Bags in Accessories
        - generic [ref=e125]:
          - generic [ref=e126]:
            - generic [ref=e127]:
              - generic [ref=e129]: Featured now
              - heading "Curated drops" [level=2] [ref=e130]
            - link "View all" [ref=e131] [cursor=pointer]:
              - /url: /products
              - text: View all
              - img [ref=e132]
          - generic [ref=e134]:
            - generic [ref=e135]:
              - generic [ref=e136]:
                - img "Reid & Taylor Men Check Purple Shirts" [ref=e137]
                - generic [ref=e140]: Topwear
                - generic [ref=e141]:
                  - paragraph [ref=e142]: Reid
                  - heading "Reid & Taylor Men Check Purple Shirts" [level=3] [ref=e143]
              - generic [ref=e144]:
                - paragraph [ref=e145]: Shirts • Topwear • Apparel • Formal • Fall
                - generic [ref=e146]:
                  - generic [ref=e148]: Men
                  - generic [ref=e150]: Apparel
                  - generic [ref=e152]: Topwear
                - generic [ref=e153]:
                  - generic [ref=e156]:
                    - generic [ref=e157]: R 1 179,50
                    - generic [ref=e158]: R 2 209,50
                  - generic [ref=e159]: 15 in stock
                - link "View product" [ref=e160] [cursor=pointer]:
                  - /url: /products/reid-taylor-men-check-purple-shirts-12369
            - generic [ref=e161]:
              - generic [ref=e162]:
                - img "Clarks Men Hang Work Leather Black Formal Shoes" [ref=e163]
                - generic [ref=e166]: Shoes
                - generic [ref=e167]:
                  - paragraph [ref=e168]: Clarks
                  - heading "Clarks Men Hang Work Leather Black Formal Shoes" [level=3] [ref=e169]
              - generic [ref=e170]:
                - paragraph [ref=e171]: Formal Shoes • Shoes • Footwear • Formal • Fall
                - generic [ref=e172]:
                  - generic [ref=e174]: Men
                  - generic [ref=e176]: Footwear
                  - generic [ref=e178]: Shoes
                - generic [ref=e179]:
                  - generic [ref=e182]:
                    - generic [ref=e183]: R 931,45
                    - generic [ref=e184]: R 1 701,45
                  - generic [ref=e185]: 10 in stock
                - link "View product" [ref=e186] [cursor=pointer]:
                  - /url: /products/clarks-men-hang-work-leather-black-formal-shoes-10268
            - generic [ref=e187]:
              - generic [ref=e188]:
                - img "Carrera Men Dial steel finish strap Silver Watches" [ref=e189]
                - generic [ref=e192]: Watches
                - generic [ref=e193]:
                  - paragraph [ref=e194]: Carrera
                  - heading "Carrera Men Dial steel finish strap Silver Watches" [level=3] [ref=e195]
              - generic [ref=e196]:
                - paragraph [ref=e197]: Watches • Watches • Accessories • Casual • Winter
                - generic [ref=e198]:
                  - generic [ref=e200]: Men
                  - generic [ref=e202]: Accessories
                  - generic [ref=e204]: Watches
                - generic [ref=e205]:
                  - generic [ref=e208]:
                    - generic [ref=e209]: R 577,34
                    - generic [ref=e210]: R 2 007,34
                  - generic [ref=e211]: 39 in stock
                - link "View product" [ref=e212] [cursor=pointer]:
                  - /url: /products/carrera-men-dial-steel-finish-strap-silver-watches-11188
            - generic [ref=e213]:
              - generic [ref=e214]:
                - img "Wrangler Men Motor Rider Red T-Shirts" [ref=e215]
                - generic [ref=e218]: Topwear
                - generic [ref=e219]:
                  - paragraph [ref=e220]: Wrangler
                  - heading "Wrangler Men Motor Rider Red T-Shirts" [level=3] [ref=e221]
              - generic [ref=e222]:
                - paragraph [ref=e223]: Tshirts • Topwear • Apparel • Casual • Fall
                - generic [ref=e224]:
                  - generic [ref=e226]: Men
                  - generic [ref=e228]: Apparel
                  - generic [ref=e230]: Topwear
                - generic [ref=e231]:
                  - generic [ref=e234]:
                    - generic [ref=e235]: R 1 512,20
                    - generic [ref=e236]: R 1 682,20
                  - generic [ref=e237]: 5 in stock
                - link "View product" [ref=e238] [cursor=pointer]:
                  - /url: /products/wrangler-men-motor-rider-red-t-shirts-10866
            - generic [ref=e239]:
              - generic [ref=e240]:
                - img "Catwalk Women Gun Metal Grey Heels" [ref=e241]
                - generic [ref=e244]: Shoes
                - generic [ref=e245]:
                  - paragraph [ref=e246]: Catwalk
                  - heading "Catwalk Women Gun Metal Grey Heels" [level=3] [ref=e247]
              - generic [ref=e248]:
                - paragraph [ref=e249]: Heels • Shoes • Footwear • Casual • Winter
                - generic [ref=e250]:
                  - generic [ref=e252]: Women
                  - generic [ref=e254]: Footwear
                  - generic [ref=e256]: Shoes
                - generic [ref=e257]:
                  - generic [ref=e260]:
                    - generic [ref=e261]: R 901,23
                    - generic [ref=e262]: R 1 931,23
                  - generic [ref=e263]: 28 in stock
                - link "View product" [ref=e264] [cursor=pointer]:
                  - /url: /products/catwalk-women-gun-metal-grey-heels-11518
            - generic [ref=e265]:
              - generic [ref=e266]:
                - img "Ganuchi Men Casual Black Sandals" [ref=e267]
                - generic [ref=e270]: Sandal
                - generic [ref=e271]:
                  - paragraph [ref=e272]: Ganuchi
                  - heading "Ganuchi Men Casual Black Sandals" [level=3] [ref=e273]
              - generic [ref=e274]:
                - paragraph [ref=e275]: Sandals • Sandal • Footwear • Casual • Summer
                - generic [ref=e276]:
                  - generic [ref=e278]: Men
                  - generic [ref=e280]: Footwear
                  - generic [ref=e282]: Sandal
                - generic [ref=e283]:
                  - generic [ref=e287]: R 100,00
                  - generic [ref=e288]: 27 in stock
                - link "View product" [ref=e289] [cursor=pointer]:
                  - /url: /products/ganuchi-men-casual-black-sandals-11940
    - contentinfo [ref=e290]:
      - generic [ref=e291]:
        - generic [ref=e292]:
          - heading "ShopBridge" [level=2] [ref=e293]
          - paragraph [ref=e294]: Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
        - generic [ref=e295]:
          - generic [ref=e296]: Authenticity first
          - generic [ref=e297]: Nationwide delivery
          - generic [ref=e298]: Secure checkout
          - generic [ref=e299]: Curated weekly drops
        - generic [ref=e300]:
          - link "Terms & Conditions" [ref=e301] [cursor=pointer]:
            - /url: /terms
          - link "Privacy Policy" [ref=e302] [cursor=pointer]:
            - /url: /privacy
        - paragraph [ref=e303]: © 2026 ShopBridge. All rights reserved.
  - button "Open Next.js Dev Tools" [ref=e309] [cursor=pointer]:
    - img [ref=e310]
  - alert [ref=e313]
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
> 14 |     await expect(hero).toBeVisible();
     |                        ^ Error: expect(locator).toBeVisible() failed
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
  33 |     if (await productsLink.isVisible()) {
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