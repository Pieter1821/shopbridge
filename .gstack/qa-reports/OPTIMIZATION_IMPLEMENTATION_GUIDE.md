# ShopBridge Performance Optimization Implementation Guide

## Issue #1: Unoptimized Images in ProductCard

**Current Code (❌ Suboptimal):**
```tsx
// components/products/ProductCard.tsx line 21
<img
  src={coverImage}
  alt={product.name}
  loading="lazy"
  referrerPolicy="no-referrer"
  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
/>
```

**Why it's slow:**
- Uses plain `<img>` (disables Next.js Image optimization)
- No explicit dimensions (causes layout shift)
- No responsive sizing (mobile gets same 1200px image as desktop)
- No WebP variant (saves 30% bandwidth with modern format)
- No blur-up/placeholder (visual "jank" while loading)

**Fixed Code (✅ Optimized):**
```tsx
import Image from "next/image";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const coverImage = normalizeRemoteImageUrl(product.images?.[0]);
  const brand = product.brand ?? "ShopBridge";
  const categoryLabel = product.category?.name ?? "Featured";
  const tags = product.tags?.slice(0, 3) ?? [];

  return (
    <Card className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-32px_rgba(15,23,42,0.5)] dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[0_24px_60px_-36px_rgba(2,6,23,0.85)]">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={75}
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3C/svg%3E"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-sm font-medium text-slate-500">
            Product image coming soon
          </div>
        )}

        {/* Rest of the component stays the same */}
        <div className="absolute right-3 top-3">
          <Chip className="bg-white/90 text-slate-900 backdrop-blur" size="sm" variant="soft">
            {categoryLabel}
          </Chip>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-900/50 to-transparent p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-200">{brand}</p>
          <h3 className="mt-2 line-clamp-2 text-xl font-semibold">{product.name}</h3>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        {/* Rest stays the same */}
      </CardContent>
    </Card>
  );
}
```

**Key Changes:**
1. ✅ Remove `/* eslint-disable @next/next/no-img-element */` comment at top
2. ✅ Import `Image` from `next/image`
3. ✅ Replace `<img>` with `<Image>`
4. ✅ Change `<div className="relative h-56">` to `<div className="relative aspect-square">`
5. ✅ Add `fill` prop (fills parent container)
6. ✅ Add `sizes` prop (responsive image selection)
7. ✅ Add `quality={75}` (reduce file size 20-30%)
8. ✅ Add `placeholder="blur"` (show gradient while loading)

**Expected Impact:**
- LCP improvement: **-1.5 to 2.0 seconds** (fewer bytes, better caching)
- CLS improvement: **-0.05** (aspect-square prevents shift)
- Visual experience: Blur placeholder while image loads

**Testing:**
```bash
npm run build
npm run start
# Open DevTools → Performance → Reload
# Before: LCP ~4s
# After: LCP ~2s
```

---

## Issue #2: Missing Image on Homepage Hero

**Current Code (❌ No optimization):**
```tsx
// app/page.tsx - no image, just gradient background
<div className="soft-mesh relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-...">
  <div aria-hidden className="pointer-events-none absolute inset-0">
    <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
    <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
  </div>
```

**Issue:** Hero section has no image. If you later add one, it will cause major LCP delay.

**Add Hero Image (✅ Optimized):**
```tsx
import Image from "next/image";

export default async function Home() {
  // ... existing code ...

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="soft-mesh relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.7)] sm:p-8">
          {/* Gradient elements */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* ... existing gradients ... */}
          </div>

          {/* Optional: Add hero background image */}
          {heroImageUrl && (
            <Image
              src={heroImageUrl}
              alt="ShopBridge hero background"
              fill
              className="absolute inset-0 object-cover opacity-30"
              priority
              quality={60}
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          )}

          <div className="relative z-10">
            {/* ... existing hero content ... */}
          </div>
        </div>
        {/* ... rest of component ... */}
      </section>
    </div>
  );
}
```

**Key Points:**
- Use `priority` for hero images (above-fold)
- Use `quality={60}` for background images (lower quality acceptable)
- Place `<Image>` with `absolute` positioning before content

---

## Issue #3: Layout Shift - Missing aspect-ratio

**Problem:** Product cards jump when images load because container height isn't reserved

**Current CSS (❌ No reserved space):**
```tsx
<div className="relative h-56 overflow-hidden bg-slate-100">
  <img /* unoptimized */ />
</div>
```

**Fixed CSS (✅ Reserved space):**
```tsx
// Option 1: aspect-square (1:1 ratio)
<div className="relative aspect-square overflow-hidden bg-slate-100">
  <Image fill />
</div>

// Option 2: custom ratio (16:9, common for hero/banner)
<div className="relative aspect-video overflow-hidden bg-slate-100">
  <Image fill />
</div>

// Option 3: explicit height with fallback
<div className="relative h-56 overflow-hidden bg-slate-100" style={{ aspectRatio: "1" }}>
  <Image fill />
</div>
```

**Verification:**
```bash
# DevTools → Lighthouse → CLS metric
# Before: 0.18
# After: <0.05 (significant improvement)
```

---

## Issue #4: Lazy Loading Strategy

**Current Code (✅ Already correct):**
```tsx
<img loading="lazy" /> // Good for below-fold
```

**For optimal performance, use this strategy:**

```tsx
// Above-fold images (visible on page load)
<Image priority src="..." />

// Below-fold images (scroll to see)
<Image priority={false} loading="lazy" src="..." />

// For ProductCard grid (below-fold on mobile, partially visible on desktop)
// → Use lazy loading is correct choice
```

---

## Issue #5: Form Field Accessibility

**Problem:** Forms may lack proper labels

**Example from checkout:**
```tsx
// BEFORE (❌ no label association)
<input
  type="email"
  placeholder="you@example.com"
  className="..."
/>

// AFTER (✅ proper label)
<label htmlFor="email" className="block text-sm font-medium text-slate-700">
  Email address
</label>
<input
  id="email"
  type="email"
  placeholder="you@example.com"
  className="..."
  aria-label="Email address"
/>
```

**Audit Checklist:**
- [ ] Every `<input>` has matching `<label htmlFor="id">`
- [ ] Form buttons have descriptive text (not just "Submit")
- [ ] Error messages linked to inputs with `aria-describedby`

---

## Issue #6: Remove ESLint Disable Comment

**File:** `components/products/ProductCard.tsx`

**Line 1:**
```tsx
// ❌ REMOVE THIS
/* eslint-disable @next/next/no-img-element */

// ✅ After fixing, this comment is no longer needed
```

---

## Implementation Checklist

### Priority 1 (Do First - 2 hours)
- [ ] Update ProductCard to use `next/image`
- [ ] Add `aspect-square` to product image containers
- [ ] Remove ESLint disable comment
- [ ] Test on mobile (DevTools Lighthouse)
- [ ] Commit: `git commit -m "fix(perf): optimize product images with Next.js Image component"`

### Priority 2 (After Priority 1 - 1 hour)
- [ ] Check all form inputs have labels (search, checkout)
- [ ] Test keyboard navigation (Tab through entire page)
- [ ] Add aria-labels to interactive elements without text
- [ ] Commit: `git commit -m "fix(a11y): improve form labels and keyboard navigation"`

### Priority 3 (After Priority 2 - 45 min)
- [ ] Add `font-display: swap` to web fonts (prevents invisible text)
- [ ] Implement skeleton loader for product grid while loading
- [ ] Add `loading="lazy"` to images properly (already done)
- [ ] Commit: `git commit -m "fix(perf): improve font loading and add skeleton loaders"`

### Priority 4 (Polish - 30 min)
- [ ] Run full Lighthouse audit
- [ ] Compare before/after scores
- [ ] Document improvements in README

---

## Expected Results After All Fixes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Mobile Performance | 45 | 78 | +73% |
| Mobile LCP | 4.2s | 2.0s | -52% |
| Mobile CLS | 0.18 | 0.06 | -67% |
| Desktop Performance | 65 | 85 | +31% |
| Accessibility | 53-89 | 90+ | Consistent |

---

## Testing After Each Change

```bash
# 1. Build for production (catch issues)
npm run build

# 2. Run locally
npm run start

# 3. Run Lighthouse
# Option A: DevTools (F12 → Lighthouse)
# Option B: https://pagespeed.web.dev/

# 4. Run Playwright tests
npm run test
```

---

## Rollback Plan (if something breaks)

```bash
# If a change causes issues:
git diff HEAD~1
git revert HEAD
git push

# Then investigate the issue before re-applying
```

