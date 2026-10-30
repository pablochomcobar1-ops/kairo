# KAIRO Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Kairo, a premium menswear store that works end to end (catalog, accounts, cart, Razorpay test-mode checkout, orders, reviews, drops, admin), with the Noir Atelier look, four themed collections that transition into each other, and two signature 3D pieces.

**Architecture:** One Next.js App Router app on Vercel. Supabase supplies Postgres (with Row Level Security), Auth (email/password + Google) and Storage. All money logic runs on the server: the browser never decides a price. A single persistent WebGL canvas lives in the root layout so the silk can relight between pages instead of reloading.

**Tech Stack:** Next.js 16.4 · React 19.3 · TypeScript · Tailwind CSS 4.3 · motion 14 (motion/react) · GSAP 3.15 + ScrollTrigger · Lenis 1.3 · three 0.186 + @react-three/fiber 9.8 + @react-three/drei 10.7 · Supabase (supabase-js 2.118, @supabase/ssr 0.12) · Zod 4.6 · Razorpay (razorpay 2.9, Standard Checkout) · Upstash Ratelimit 2.2 · Resend 6 · Sentry 11 · zustand · Vitest 5 · Playwright 1.64. Node ≥ 20.9.

**Spec:** `docs/brief.md`, `.agents/product-marketing.md`, `design/tokens.css`, Stage 1 brief doc, Stage 2 design board (Direction A + collection themes).

---

## Part A — The plan in plain words (read this first, Jainam)

### A1. Accounts you will need (all free tiers, created only when that milestone arrives)

| Service | Used for | Needed at |
| --- | --- | --- |
| Supabase | Database, logins, image storage | M1 |
| Razorpay | Test-mode payments (test keys work right after sign-up, no activation needed) | M9 |
| Google Cloud | "Sign in with Google" client ID | M8 |
| Upstash | Rate limiting (stops spam on forms and login) | M8 |
| Cloudflare Turnstile | Invisible bot check on contact, signup and reviews | M8 |
| Resend | Order confirmation and contact emails | M9 |
| Sentry | Error logging | Stage 5 |
| Vercel | Hosting | Stage 7 |

Honest limit: without your own domain, Resend only delivers to your own email address. Order emails to other people need a domain (about ₹800/year) — optional.

### A2. Folder layout

```
src/
  app/
    (store)/            every shopper page (layout has header, footer, cart drawer)
    (account)/          login, signup, account pages
    admin/              admin panel (role-protected, noindex)
    api/razorpay/webhook/route.ts
    layout.tsx          fonts, theme, persistent 3D canvas, Lenis
  components/
    ui/                 Button, IconButton, Price, Badge, Input, Dialog, Drawer …
    layout/             Header, MegaMenu, MobileMenu, Footer, Loader, Curtain
    home/               one file per home section
    product/            ProductCard, Gallery, SizePicker, CompleteTheLook …
    cart/               CartDrawer, CartLine
    three/              SilkCanvas, Silk material, WardrobeScene, fallbacks
    motion/             presets, Reveal, MagneticButton, SplitText
  lib/                  pure logic (money, pricing, coupons, theme, validation, razorpay, ratelimit, seo)
  server/               server-only code (queries, actions, Supabase admin client)
  stores/               cart and wishlist (zustand)
supabase/migrations/    schema + RLS as SQL files
supabase/seed.sql       collections, products, variants, drops, coupons, sample reviews
tests/unit/  tests/e2e/
```

### A3. Data model (Postgres, money always in paise as integers)

| Table | Key columns |
| --- | --- |
| `profiles` | id (= auth user), full_name, phone, role (`customer` / `admin`) |
| `addresses` | user_id, name, phone, line1, line2, city, state, pincode, is_default |
| `collections` | slug (`streetwear`, `formal`, `old-money`, `riding`), name, tagline, theme, position |
| `products` | slug, name, collection_id, description, fabric, fit, care, price_paise, compare_at_paise, is_published, drop_id |
| `product_images` | product_id, path, alt, position |
| `variants` | product_id, size, colour, sku, stock |
| `product_pairings` | product_id, paired_product_id, kind (`look` / `another_way`) |
| `drops` | slug, name, starts_at, ends_at, hero_image |
| `wishlist_items` | user_id, product_id |
| `orders` | number (`KRO-261028-7Q4M`), user_id (nullable for guests), email, phone, status, payment_status, subtotal/discount/shipping/total paise, coupon_code, razorpay_order_id, razorpay_payment_id, shipping_address (jsonb) |
| `order_items` | order_id, variant_id, product snapshot (name, size, colour, image), unit_price_paise, qty |
| `coupons` | code, kind (`percent` / `fixed`), value, min_subtotal_paise, starts_at, ends_at, max_uses, used_count, is_active |
| `reviews` | product_id, user_id, author_name, rating 1–5, title, body, photo_paths, is_sample, is_verified, status (`pending` / `approved` / `rejected`) |
| `contact_messages` | name, email, phone, message |
| `drop_alerts` | email, drop_id (newsletter / notify me) |

Shop rules fixed here: free shipping on orders of ₹3,000 or more, otherwise ₹149. Max 5 of one variant per order.

### A4. Every page, its sections and how they move

Global: Lenis smooth scroll; page text rises line by line behind a mask using the current theme's `--k-dur-reveal`; buttons are magnetic on desktop; links draw their underline; a small cursor label ("View", "Drag") appears over product images and carousels on desktop only.

**Loader** (first visit per session only): K monogram draws its two rings and strokes (1.2 s), then the wordmark tracks out and the hero is revealed. Skipped on repeat visits and under reduced motion.

**Home `/`**

| # | Section | Animation |
| --- | --- | --- |
| 1 | Fabric hero — KAIRO on graphite silk, headline, 2 CTAs | WebGL silk ripples toward the cursor (gyroscope tilt on phones); headline lines rise; brass rim light breathes slowly |
| 2 | Brand marquee — "Four lives. One label. · Cut in Ahmedabad · Drop 01 Friday" | Infinite marquee, speed follows scroll velocity, pauses on hover |
| 3 | The Four Wardrobes journey | Pinned GSAP ScrollTrigger: the camera moves through 4 rooms; the site theme shifts to each collection as you enter its room; each room ends with "Enter Streetwear →" |
| 4 | Drop teaser (C energy borrowed here) | Live countdown digits flip; "Notify me" form; low-stock badges pulse once |
| 5 | New In carousel | Drag with inertia; cards tilt slightly toward the cursor; second photo fades in on hover |
| 6 | Complete the Look | Full-bleed lookbook photo with hotspots; tapping one opens a mini product card; "Add the whole look" |
| 7 | Ahmedabad story | Image parallax, one big sentence revealed word by word |
| 8 | Reviews strip | Slow horizontal drift; "Sample" tags shown |
| 9 | Drop alerts signup | Input underline draws on focus; success morphs the button into a check |
| 10 | Footer | Giant KAIRO wordmark rises as the footer enters; credit line "Designed & built by Jainam Gondaliya →" |

**Collection page `/collections/[slug]`** — themed (Streetwear neon, Formal pinstripe, Old Money ivory flip, Riding night highway).
Header: big title, tagline, the silk relit in the collection's light (smaller band) → sticky filter bar (size, colour, price, sort) → product grid (staggered rise, delay = theme `--k-stagger`) → "The other three wardrobes" row at the bottom. Moving to another collection plays the **curtain transition**: next collection's colour wipes across carrying its name (0–400 ms), colours and grain tween underneath (400–600 ms), curtain lifts and text rises (600–900 ms). Reduced motion: 200 ms crossfade.

**Product page `/products/[slug]`** — wears its collection's theme.
Gallery (drag on phones, zoom lens on desktop) · name, price, size picker (sizes slide a marker under the chosen one; sold-out sizes struck through) · Add to bag (button morphs to "Added ✓", bag icon bounces, drawer opens) · fabric, fit and care accordion · Size guide dialog · Complete the Look · "Wear it another way" (one piece from another collection) · Reviews (stars, photos, Verified buyer / Sample tags) · sticky Add to bag bar on phones.

**Shop all `/shop`, Search `/search`** — Noir theme, same grid and filters; search results update as you type (debounced), empty state with the four collections.

**Drops `/drops`, `/drops/[slug]`** — Noir with brass: countdown, marquee, low-stock badges, notify-me form; a finished drop says so and links to its collection.

**Lookbook `/lookbook`** — editorial, horizontal scroll on desktop (GSAP), vertical on phones, each look links to its products.

**Cart drawer + `/cart`** — slides in from the right; lines animate in and out (layout animation); free-shipping progress bar fills toward ₹3,000; "You might also like" (2 pieces).

**Checkout `/checkout` → Razorpay → `/checkout/success`** — always Noir and calm: contact, address, coupon, summary. Pay opens Razorpay's own checkout window (card and UPI details are typed into Razorpay, never into Kairo). Success page: order number, the K monogram draws once, "Track your order".

**Track `/track`** — email + order number → status line Placed → Packed → Shipped → Delivered, the current step fills in.

**Account** — login, signup (email + password or Google), forgot/reset password, orders with status, addresses, wishlist. Minimal motion.

**Brand and help** — About (Ahmedabad story, parallax), Contact (form + WhatsApp + map card + store hours), Size guide, Shipping and returns, FAQ (accordion), Privacy, Terms, custom 404 (search + the four collections).

**Admin `/admin`** — functional, no flourish: dashboard (today's orders, revenue in test mode, low stock), products (create/edit, images upload, variants and stock, pairings), orders (move status, view items), drops, coupons, reviews (approve/reject), messages.

### A5. The 3D pieces

1. **Fabric hero (`SilkCanvas`)** — one plane, about 160×90 segments, custom shader: layered simplex-noise folds, a soft dent that follows the cursor, fresnel rim light in the theme's `--k-silk-light`, fine thread texture. One canvas for the whole site, mounted in the root layout and shown behind the hero and collection headers, so a theme change only tweens shader uniforms (light colour, fold speed, roughness): no reload, no flash.
2. **Four Wardrobes journey (`WardrobeScene`)** — four low-poly rooms built in code with baked lighting: neon alley with wet-floor reflections (Streetwear), tailor's atelier with mannequins and bolts of cloth (Formal), sunlit library with leather chairs (Old Money), night highway with passing lights (Riding). Each room loads only as you approach it. Product photos hang in each room as framed planes.
3. **Fallbacks** — phones get the 2.5D version: layered parallax images of the same rooms, no WebGL. No WebGL or reduced motion: a still render of the silk and room images, no blank space ever.
4. **Budget** — 3D code loads after the page is interactive (dynamic import), pixel ratio capped at 1.5, rendering pauses when off screen or the tab is hidden, under 120 draw calls per room, textures ≤ 1024 px (KTX2 where possible).

### A6. Speed targets

LCP under 2.5 s on a mid-range phone on 4G · CLS under 0.05 · INP under 200 ms · home page JavaScript under 250 KB gzipped before the 3D chunk · images through `next/image` as AVIF/WebP with real `sizes` · fonts self-hosted by `next/font` with `display: swap`.

### A7. Security plan (built in from day one, audited in Stage 5)

| Area | What we do |
| --- | --- |
| Transport and headers | HTTPS only (Vercel + HSTS), Content-Security-Policy with per-request nonces, X-Frame-Options DENY (frame-ancestors none), X-Content-Type-Options nosniff, strict Referrer-Policy, Permissions-Policy (camera/mic/geo off; gyroscope allowed for the silk) |
| Inputs | Every form and API input is parsed with a Zod schema on the server; text is length-limited; nothing user-written is rendered as HTML |
| Database | Supabase queries are parameterised; Row Level Security on every table; the public can only read published catalog rows; users only see their own orders, addresses and wishlist; admin powers come from `profiles.role = 'admin'` checked in RLS and on the server |
| Auth | Supabase Auth (bcrypt-hashed passwords, httpOnly + Secure + SameSite=Lax session cookies), Google OAuth, email confirmation, password reset by email; admin routes blocked in middleware and again on the server |
| CSRF | Server Actions check the request origin (built into Next.js); the one route handler that changes data (the Razorpay webhook) is protected by its signature instead |
| Rate limits | Login and signup 5 per 10 min per IP; contact, reviews and drop alerts 3 per 10 min; coupon check 10 per min; checkout 10 per 10 min; order tracking 10 per 10 min |
| Bots | Cloudflare Turnstile on signup, contact and reviews |
| Payments | Razorpay Standard Checkout only; the server creates the Razorpay order from database prices; payment success is accepted only after the HMAC signature checks out; the webhook (`payment.captured`, `payment.failed`) is signature-checked and idempotent; card data never touches Kairo |
| Secrets | Only in `.env.local` (your PC) and Vercel environment variables; the Supabase service key and Razorpay secret live only in `src/server/` files marked `server-only`; nothing secret has a `NEXT_PUBLIC_` prefix |
| Supply chain | Lockfile committed, `npm audit` and the supply-chain-risk-auditor run in Stage 5, no unvetted packages |
| Monitoring and backups | Sentry error logging with personal data scrubbed; a weekly GitHub Action dumps the database (Supabase's free plan has no automatic backups you can restore yourself) |

---

## Part B — Implementation tasks

## Global Constraints

- Node ≥ 20.9; Next.js 16.4 App Router, `src/` directory, TypeScript strict.
- All colours, type sizes, spacing and motion timing come from `design/tokens.css` (moved to `src/app/tokens.css` in Task 0). No raw hex in components.
- Fonts: Syncopate (display), Manrope (text), JetBrains Mono (labels, prices).
- Money is integer paise everywhere; display with `formatINR`.
- Theme names: `noir`, `street`, `formal`, `old-money`, `riding`. Cart, checkout, account, admin and shop-all are always `noir`.
- Male models only in every image, video and 3D piece.
- Seeded reviews have `is_sample = true` and show a visible "Sample" tag; "Verified buyer" only when the reviewer has a paid order containing that product.
- Copy follows `.agents/product-marketing.md` (voice table, banned words).
- Every interactive element is keyboard reachable with a visible focus ring; touch targets ≥ 44 px; every animation has a reduced-motion path.
- Footer carries "Kairo is a concept brand. Images are AI concept visuals." and "Designed & built by Jainam Gondaliya →".

## Review Focus

1. **Tampered price or quantity from the browser** → the server ignores any client price and recomputes from the database; quantity is clamped to 1–5 and to stock. Test in Task 9 (`createCheckout ignores client price`).
2. **Payment confirmed twice** (success callback and webhook both arrive, or Razorpay retries the webhook) → the order becomes paid once, stock and coupon use drop once. Test in Task 9 (`mark_order_paid is idempotent`).
3. **Drop sells out between Add to bag and Pay** → checkout refuses with "Only N left in size M" before any payment is created. Test in Task 9 (`createCheckout rejects quantity above stock`).
4. **Theme stays wrong after back button, refresh or opening a product from another collection** → theme always follows the current route. Test in Task 2 (`themeForPath` table test) and e2e in Stage 6.
5. **No WebGL, weak phone or reduced motion** → hero and journey show their still fallbacks, never an empty box. Test in Task 5 (`SilkHero renders fallback`).

---

### Task 0: Scaffold, tokens, fonts, tooling

**Files:** Create: `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/tokens.css` (moved from `design/tokens.css`), `src/lib/fonts.ts`, `.env.example`, `.github/workflows/ci.yml`, `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: `npm run dev | build | lint | typecheck | test`; CSS variables `--font-syncopate`, `--font-manrope`, `--font-jetbrains` on `<html>`; `<html data-theme="noir">`.

- [ ] **Step 1:** `npx create-next-app@16.4 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`, then add vitest, prettier, `server-only`, zod, clsx, tailwind-merge.
- [ ] **Step 2:** Write `tests/unit/smoke.test.ts` asserting `1 + 1 === 2`; run `npm run test`, expect PASS (proves the runner).
- [ ] **Step 3:** Import `tokens.css` from `globals.css`; load the three fonts in `src/lib/fonts.ts` with `next/font/google` and the variable names above.
- [ ] **Step 4:** CI workflow runs `npm ci`, `lint`, `typecheck`, `test`, `build` on every push.
- [ ] **Step 5:** Run `npm run build`; expect success. Deliver zip; Jainam commits "Task 0: scaffold".

### Task 1: Database schema, RLS and seed

**Files:** Create: `supabase/migrations/2026102815xxxx_{schema,functions,rls,storage}.sql`, `supabase/seed/catalog.mjs` → `scripts/build-seed.mjs` → `supabase/seed.sql`, `src/server/supabase/{server.ts,admin.ts}`, `src/lib/supabase/browser.ts`, `src/lib/env.ts`, `src/server/env.ts`, `src/types/db.ts` (generated after linking), `tests/db/{harness.ts,database.test.ts}` (in-memory Postgres via PGlite)

**Interfaces:**
- Produces: tables in A3; SQL function `is_admin() returns boolean`; SQL function `mark_order_paid(p_order_id uuid, p_payment_id text) returns text` — `'paid'` the first time (decrements stock, increments coupon `used_count`, sets `payment_status='paid'`, `status='placed'`), `'already_paid'` on repeats, `'paid_out_of_stock'` when stock ran out (order cancelled, `payment_status='refund_due'`), `'not_found'`; SQL function `is_verified_buyer(user, product) returns boolean`; order status moves forward only (trigger) and every change is logged in `order_events`; `createServerClient()` (user session, RLS applies), `createAdminClient()` (service role, `server-only`).

- [ ] **Step 1:** Write `tests/unit/rls.sql.test.ts` (runs against the Supabase local stack): anonymous select on unpublished product returns 0 rows; user A cannot select user B's order; non-admin update on `products` fails; anonymous insert on `orders` fails.
- [ ] **Step 2:** Run it, expect FAIL (no schema).
- [ ] **Step 3:** Write the migrations. Checks: `rating between 1 and 5`, `qty between 1 and 5`, `stock >= 0`, `price_paise > 0`, unique `products.slug`, unique `coupons.code` (upper-case).
- [ ] **Step 4:** Write `mark_order_paid` with `select … for update` on the order and an early `return false` when already paid.
- [ ] **Step 5:** Seed: 4 collections; 8 products per collection (32), 4–6 sizes each with stock 3–20; 1 upcoming drop (Riding × Streetwear, starts 7 days after seeding) holding 4 products; coupons `KAIRO10` (10%, min ₹2,000) and `FIRSTFIT` (₹500 off, min ₹4,000, max 100 uses); 3–5 sample reviews per product with `is_sample = true`; look and another-way pairings.
- [ ] **Step 6:** Run the RLS test, expect PASS. Deliver; commit "Task 1: database".

### Task 2: Theme system and curtain transition

**Files:** Create: `src/lib/theme.ts`, `src/components/layout/ThemeController.tsx`, `src/components/layout/Curtain.tsx`, `src/components/layout/CollectionLink.tsx`, `tests/unit/theme.test.ts`

**Interfaces:**
- Produces: `type ThemeName = 'noir' | 'street' | 'formal' | 'old-money' | 'riding'`; `themeForCollection(slug: string): ThemeName`; `themeForPath(pathname: string, productCollectionSlug?: string): ThemeName`; `<ThemeController theme={ThemeName} />` (sets `data-theme` on `<html>`, emits `kairo:theme` event for the 3D canvas); `<CollectionLink href slug>` (plays the curtain, then navigates).

- [ ] **Step 1:** Table test: `/`→noir, `/shop`→noir, `/collections/streetwear`→street, `/collections/old-money`→old-money, `/products/x` with `'riding'`→riding, `/checkout`→noir, `/admin/orders`→noir, `/collections/unknown`→noir.
- [ ] **Step 2:** Run, expect FAIL; implement; run, expect PASS.
- [ ] **Step 3:** Curtain: motion `AnimatePresence`, timings 0–400 / 400–600 / 600–900 ms from A4; reduced motion → 200 ms opacity only.
- [ ] **Step 4:** Commit "Task 2: themes".

### Task 3: Design primitives and motion presets

**Files:** Create: `src/components/ui/{Button,IconButton,Price,Badge,Input,Select,Dialog,Drawer,Accordion,Skeleton}.tsx`, `src/components/motion/{presets.ts,Reveal.tsx,SplitText.tsx,MagneticButton.tsx,SmoothScroll.tsx}`, `src/lib/money.ts`, `tests/unit/money.test.ts`

**Interfaces:**
- Produces: `formatINR(paise: number): string`; `Button` variants `primary | outline | ghost`, sizes `md | lg`, `loading` prop; `Reveal` (`as`, `delay`, `stagger`) reading `--k-dur-reveal`; `SmoothScroll` wraps Lenis and syncs GSAP ScrollTrigger.

- [ ] **Step 1:** Tests: `formatINR(149000) === '₹1,490'`, `formatINR(1490000) === '₹14,900'`, `formatINR(5) === '₹0.05'`, `formatINR(0) === '₹0'`.
- [ ] **Step 2:** Implement with `Intl.NumberFormat('en-IN')`, drop `.00` for whole rupees.
- [ ] **Step 3:** Build primitives with Radix-style accessible Dialog/Drawer (focus trap, Escape closes, focus returns).
- [ ] **Step 4:** Commit "Task 3: primitives".

### Task 4: Layout shell — header, menus, footer, loader, cart drawer shell

**Files:** Create: `src/components/layout/{Header,MegaMenu,MobileMenu,Footer,Loader,Logo,Monogram}.tsx`, `src/app/(store)/layout.tsx`, `src/stores/cart.ts`, `src/components/cart/{CartDrawer,CartLine}.tsx`

**Interfaces:**
- Consumes: Task 2 `CollectionLink`, Task 3 primitives.
- Produces: `useCart()` store `{ lines: {variantId, productSlug, name, size, colour, image, unitPaise, qty}[], add(line), setQty(variantId, qty), remove(variantId), clear() }` persisted to `localStorage` key `kairo-cart-v1`; `unitPaise` is for display only.

- [ ] **Step 1:** Test `tests/unit/cart.test.ts`: adding the same variant twice sums qty; qty is clamped to 1–5; remove empties; persisted state survives reload (mock storage).
- [ ] **Step 2:** Run FAIL → implement → PASS.
- [ ] **Step 3:** Header transparent over hero, solid with blur after 80 px scroll, hides on scroll down; mobile menu with the 4 collection image tiles; footer per Stage 1 brief; loader once per session (`sessionStorage`).
- [ ] **Step 4:** Commit "Task 4: layout".

### Task 5: 3D — silk hero and Four Wardrobes

**Files:** Create: `src/components/three/{SilkCanvas.tsx,silk.vert.glsl,silk.frag.glsl,useThemeUniforms.ts,WardrobeScene.tsx,rooms/*.tsx,Fallbacks.tsx,canUseWebGL.ts}`, `tests/unit/silk-fallback.test.tsx`

**Interfaces:**
- Consumes: `kairo:theme` event (Task 2), `--k-silk-light` token.
- Produces: `<SilkHero />` (renders `<SilkFallback />` when `!canUseWebGL()` or reduced motion), `<WardrobeJourney />` (desktop WebGL; `<Wardrobe25D />` under 768 px).

- [ ] **Step 1:** Test: with `canUseWebGL` mocked `false`, `SilkHero` renders the fallback image with alt text; with `prefers-reduced-motion: reduce`, same.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Shader uniforms: `uTime`, `uPointer` (vec2, eased), `uLight` (vec3 from theme), `uFoldSpeed`, `uRoughness`; theme change tweens uniforms over 900 ms.
- [ ] **Step 4:** Budget check in browser: 60 fps on desktop, DPR ≤ 1.5, < 120 draw calls per room, canvas paused when hidden.
- [ ] **Step 5:** Commit "Task 5: 3D".

**As built (2026-10-29), changes from the plan above:**
- One canvas per 3D section (hero silk, Four Wardrobes), each loaded lazily after the page is interactive, instead of one site-wide canvas. Theme changes still relight both live (`kairo:theme` event + uniform tweening).
- Rooms use unlit materials with gradient and glow textures drawn in code ("baked" lighting), so there are no model or texture downloads; KTX2 is not needed until real product photos arrive (Task 13).
- Draw calls measured per room (including the neighbour seen through the doorway): 76 / 114 / 78 / 18. Only the current room and its neighbours are drawn.
- 3D journey needs ≥ 768 px wide, WebGL, no reduced motion, no data saver, and (where the browser reports them) ≥ 4 CPU cores and ≥ 4 GB memory; otherwise the 2.5D version. Silk runs on phones as a lighter mesh; still image without WebGL, under reduced motion or data saver.
- GSAP + ScrollTrigger load only with the 3D journey; Lenis runs on its own. The bag validates saved data with plain checks instead of Zod. Home page JS before load: 237 KB (target < 250 KB).

### Task 6: Home page sections

**Files:** Create: `src/app/(store)/page.tsx`, `src/components/home/{Hero,BrandMarquee,WardrobesSection,DropTeaser,Countdown,NewInCarousel,CompleteTheLookHero,StorySection,ReviewsStrip,DropAlertForm}.tsx`, `tests/unit/countdown.test.ts`

**As built (2026-10-29):** catalog reads live in `src/server/catalog/` (one `getHomeData()`, cached for an hour with tag `catalog`, from Supabase or from the catalog file when `KAIRO_DATA=fixtures`). Complete the Look is a flat-lay of garment drawings with hotspots until the photo shoot. The drop-alert Server Action exists now (Task 11 listed it); its rate limit and Turnstile arrive with Task 8. Product links point at `/products/…`, which Task 7 builds.

**Interfaces:**
- Consumes: Tasks 3–5; `getHomeData()` from `src/server/queries/home.ts` returning `{ newIn: ProductCard[], drop: Drop | null, look: Look, reviews: ReviewSnippet[] }`.
- Produces: `timeLeft(target: Date, now: Date): { days, hours, minutes, seconds, done: boolean }`.

- [ ] **Step 1:** Countdown tests: 2 days 3 h before → `{days:2,hours:3,minutes:0,seconds:0,done:false}`; past target → all zero, `done:true`.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Build sections 1–10 in A4 order with the listed animations; each section ships with its reduced-motion path.
- [ ] **Step 4:** Commit after each section ("Task 6.3: wardrobes", …) so Jainam reviews one at a time.

### Task 7: Catalog — shop, collections, search, product page

**Files:** Create: `src/app/(store)/{shop,collections/[slug],products/[slug],search}/page.tsx`, `src/server/queries/catalog.ts`, `src/lib/filters.ts`, `src/components/product/*`, `tests/unit/filters.test.ts`

**Interfaces:**
- Produces: `parseFilters(searchParams): { sizes: string[]; colours: string[]; minPaise?: number; maxPaise?: number; sort: 'new' | 'price-asc' | 'price-desc' }` (unknown values dropped); `listProducts(filters, collectionSlug?)`; `getProduct(slug)` → product with variants, images, pairings, approved reviews.

- [ ] **Step 1:** Filter tests: `?size=m&size=xl&sort=price-asc` parses; `?sort=hack` → `'new'`; `?min=abc` ignored; `?size=<script>` dropped.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Collection pages set theme via `ThemeController`; product pages use their collection's theme; canonical URLs drop filter params; `generateMetadata` per page; breadcrumbs on collection and product pages (Home › Riding › Nightfall Riding Jacket).
- [ ] **Step 4:** Quick view: the product card's "Quick view" opens a Dialog with gallery, size picker and Add to bag, without leaving the grid (Escape closes, focus returns to the card).
- [ ] **Step 5:** Commit "Task 7: catalog".

**As built (2026-10-29):** filters, sorting and search run on one cached catalog list (`getCatalog()`), not a query per filter; fine for dozens of pieces, revisit past a few hundred. Size + colour filters match the same in-stock variant. Search is word matching over name, collection, fabric, colours and description (no Postgres full-text yet). Drop pieces can't be added to the bag before the drop opens (the buy box becomes a countdown and "notify me"); checkout must enforce the same in Task 9. Product structured data leaves out the star rating while every review is a sample. Unknown product or collection URLs show the not-found page with `noindex` (status 200, because those pages stream).

### Task 8: Auth, account, wishlist, rate limits, Turnstile

**Files:** Create: `src/app/(account)/{login,signup,forgot-password,reset-password,account,account/orders/[id],account/addresses}/page.tsx`, `src/app/auth/callback/route.ts`, `src/middleware.ts`, `src/lib/ratelimit.ts`, `src/lib/validation.ts`, `src/server/actions/{auth,addresses,wishlist}.ts`, `src/stores/wishlist.ts`, `tests/unit/validation.test.ts`

**Interfaces:**
- Produces: `limit(bucket: 'auth' | 'contact' | 'review' | 'alert' | 'coupon' | 'checkout' | 'track', key: string): Promise<{ ok: boolean; retryAfterSec: number }>` with A7's numbers; Zod schemas `signupSchema`, `addressSchema` (Indian 6-digit pincode, 10-digit mobile), `contactSchema`, `reviewSchema`, `trackSchema`, `checkoutSchema`; middleware protects `/account/*` (login) and `/admin/*` (admin role).

- [ ] **Step 1:** Validation tests: pincode `380015` ok, `38001` rejected; phone `9876543210` ok, `12345` rejected; review body over 2,000 chars rejected; email trimmed and lower-cased.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Guest wishlist in `localStorage`, merged into `wishlist_items` on login.
- [ ] **Step 4:** Commit "Task 8: auth".

**As built (2026-10-30):** Next.js 16 renamed middleware to `src/proxy.ts`. Account pages live in `src/app/(store)/(account)/` so they keep the header and footer. Session cookies are set httpOnly + SameSite=Lax (+ Secure on HTTPS) on every write; nothing in the browser reads them, so "am I signed in?" is a small server action (`syncWishlist`) that also merges the guest wishlist. Rate limits talk to Upstash's REST API directly (no package), with IPs hashed; in production without Upstash keys the limited forms switch off rather than run unprotected. Turnstile is on sign-up now (contact and reviews when they're built). Form actions return what was typed (never passwords) because React 19 empties a form after each submit. Components that read the current path do it through `RouteWatcher` inside its own `<Suspense>`, which pages with unknown params (an order) require. Stage 5 note: the CSP must allow `challenges.cloudflare.com` for Turnstile.

### Task 9: Checkout, Razorpay, orders, emails, tracking

**Files:** Create: `src/lib/{pricing,coupons,razorpay}.ts`, `src/server/actions/checkout.ts`, `src/app/api/razorpay/webhook/route.ts`, `src/app/(store)/{checkout,checkout/success,track}/page.tsx`, `src/server/email/{orderConfirmation,contactNotice}.tsx`, `tests/unit/{pricing,coupons,razorpay,checkout}.test.ts`

**Interfaces:**
- Consumes: `mark_order_paid` (Task 1), `limit` and `checkoutSchema` (Task 8).
- Produces: `computeTotals(items: {unitPaise: number; qty: number}[], discountPaise: number): { subtotal, discount, shipping, total }` (shipping 0 when subtotal − discount ≥ 300000, else 14900); `validateCoupon(coupon: Coupon | null, subtotalPaise: number, now: Date): { ok: true; discountPaise: number } | { ok: false; reason: 'not_found' | 'inactive' | 'expired' | 'not_started' | 'min_subtotal' | 'used_up' }`; `verifyPaymentSignature(orderId, paymentId, signature, secret): boolean`; `verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean` (both HMAC-SHA256 with `timingSafeEqual`); server action `createCheckout(input) → { orderNumber, razorpayOrderId, amountPaise, keyId }`; server action `confirmPayment({ razorpayOrderId, razorpayPaymentId, signature }) → { orderNumber }`.

- [ ] **Step 1:** Pricing tests: one ₹2,999 item → shipping 14900; ₹3,000 → shipping 0; ₹3,200 with ₹500 discount → shipping 14900 (threshold is after discount).
- [ ] **Step 2:** Coupon tests: `KAIRO10` on ₹1,999 → `min_subtotal`; on ₹5,000 → 50000 off; expired → `expired`; `used_count = max_uses` → `used_up`; percent discount never exceeds subtotal.
- [ ] **Step 3:** Razorpay tests: a signature computed with the test secret verifies; a one-character change fails; signatures of different length fail without throwing.
- [ ] **Step 4:** Checkout tests (Supabase local): **`createCheckout ignores client price`** (input carries `unitPaise: 1`, order total equals DB price); **`createCheckout rejects quantity above stock`** (stock 2, qty 3 → error "Only 2 left in size M"); **`mark_order_paid is idempotent`** (called twice → second returns `'already_paid'`, stock dropped once, coupon used once — already covered by the Task 1 database tests).
- [ ] **Step 5:** Run all FAIL → implement → PASS.
- [ ] **Step 6:** Webhook reads the raw body, verifies, handles `payment.captured` (→ `mark_order_paid`, send email) and `payment.failed` (→ `payment_status = 'failed'`), returns 200 for unknown events.
- [ ] **Step 7:** Manual test with Razorpay test card and test UPI ID; order appears in admin. Commit "Task 9: checkout".

**As built (2026-10-30):** checkout pricing lives in `src/server/checkout/core.ts` behind a small store interface, so "ignores client price", "Only N left in size M" and "drop not open yet" are unit-tested without a database (the database-level idempotency of `mark_order_paid` stays covered by Task 1's tests). The browser's success callback and the webhook both call `completePayment`; only the call that gets `'paid'` sends the email. Resend and Razorpay are called with `fetch` (no SDKs). Each "Pay" press creates one order awaiting payment; abandoned ones never show in accounts or tracking and the admin can clear them (Task 12). The success page shows only the order number from the URL, never order details. Stage 5 CSP must allow `checkout.razorpay.com` (script, frame) and `api.razorpay.com`.

### Task 10: Reviews

**Files:** Create: `src/server/actions/reviews.ts`, `src/components/product/{Reviews,ReviewForm,Stars}.tsx`, `tests/unit/reviews.test.ts`

**Interfaces:**
- Produces: `submitReview(input) → { status: 'pending' }`; `isVerifiedBuyer(userId: string, productId: string): Promise<boolean>` (true only with an order item for that product on a `paid` order).

- [ ] **Step 1:** Tests: guest review saved as `pending`, not verified; user with paid order → `is_verified = true`; user with only a failed order → false; photo upload over 5 MB or non-image MIME rejected.
- [ ] **Step 2:** FAIL → implement → PASS. Photos go to a private Storage bucket and are served through signed URLs after approval.
- [ ] **Step 3:** Commit "Task 10: reviews".

### Task 11: Drops, lookbook, brand and help pages, contact

**Files:** Create: `src/app/(store)/{drops,drops/[slug],lookbook,about,contact,size-guide,shipping-returns,faq,privacy,terms}/page.tsx`, `src/app/not-found.tsx`, `src/server/actions/{contact,dropAlerts}.ts`

- [ ] **Step 1:** Test `tests/unit/contact.test.ts`: valid message saved and notification queued; 4th message in 10 min from one IP → rate-limited; Turnstile token missing → rejected.
- [ ] **Step 2:** FAIL → implement → PASS. Commit "Task 11: pages".

### Task 12: Admin

**Files:** Create: `src/app/admin/{layout,page,products,products/[id],orders,orders/[id],drops,coupons,reviews,messages}/…`, `src/server/actions/admin/*.ts`

**Interfaces:**
- Consumes: `is_admin()` (Task 1); every admin action starts with `requireAdmin()` which throws for non-admins.

- [ ] **Step 1:** Test `tests/unit/admin.test.ts`: `requireAdmin` throws for customer and anonymous; order status can only move forward (`placed → packed → shipped → delivered`, plus `cancelled`); product price must be > 0.
- [ ] **Step 2:** FAIL → implement → PASS. Admin pages send `X-Robots-Tag: noindex`. Commit "Task 12: admin".

### Task 13: The photo shoot (AI concept visuals)

**Files:** Create: `scripts/shoot/prompts.json`, `scripts/shoot/generate.ts`, uploads to Supabase Storage bucket `products`.

- [ ] **Step 1:** One art direction per collection matching its theme (lighting, backdrop, palette); male models only; product shots on a consistent backdrop plus 2 lookbook scenes per collection.
- [ ] **Step 2:** Generate, review every image (hands, logos, text artefacts), reject anything off-brand; export AVIF/WebP at 2000 px max; write alt text per image.
- [ ] **Step 3:** Update seed image paths. Commit "Task 13: shoot".

### Task 14: Copy pass

- [ ] **Step 1:** Write all page copy with the copywriting skill against `.agents/product-marketing.md`, then run humanizer; check the banned-words list with `grep`.
- [ ] **Step 2:** Commit "Task 14: copy".

---

**Then:** Stage 5 (security audit and checklist), Stage 6 (device QA, SEO + schema, WCAG, Core Web Vitals), Stage 7 (Vercel launch), Stage 8 (launch video).
