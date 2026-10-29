# KAIRO

**Four lives. One label.**

Kairo is a concept menswear label from Ahmedabad: Streetwear, Formal, Old Money and Riding under one house. This repo is a full-stack portfolio showcase that works end to end: real database, accounts, admin panel and Razorpay checkout in test mode (no real money moves).

Designed and built by **Jainam Gondaliya**. Kairo is a concept brand; product images are AI concept visuals.

## Status

| Stage | What | State |
| --- | --- | --- |
| 1 | Brief, positioning, site architecture | Done |
| 2 | Visual direction (A: Noir Atelier) + design tokens | Done |
| 3 | Build plan | Done |
| 4 | Build | Tasks 0–6 done |
| 5 | Security hardening | Not started |
| 6 | QA, SEO, accessibility, performance | Not started |
| 7 | Launch on Vercel | Not started |
| 8 | Launch video | Not started |

## Repo layout (so far)

```
src/app/tokens.css            Locked Tailwind v4 tokens: base Noir + 4 collection themes
src/app/globals.css           Base styles, film grain
src/lib/fonts.ts              Syncopate, Manrope, JetBrains Mono (next/font)
src/lib/cn.ts                 Class merging that understands our type scale
src/lib/env.ts, src/server/env.ts   Checked settings (public vs secret)
src/server/supabase/          Supabase clients: as the visitor (RLS) and admin (server only)
supabase/migrations/          Database schema, functions, Row Level Security, storage
supabase/seed/catalog.mjs     The catalog: edit, then `npm run db:seed:build`
src/app/(store)/              Shopper pages share one layout: header, footer, cart drawer
src/components/layout/        Header, mega menu, mobile menu, footer, intro loader, curtain
src/components/three/         WebGL silk hero and the Four Wardrobes (3D + 2.5D)
src/components/home/          Home page sections: marquee, drop countdown, New In, Complete the Look, story, reviews, drop alerts
src/components/product/       Product card and the garment drawings used until the photo shoot
src/server/catalog/           Reads the catalog: Supabase, or the catalog file when KAIRO_DATA=fixtures
src/server/actions/           Server Actions (form posts), e.g. drop alerts
src/stores/                   Bag (saved in the browser) and site UI state
src/components/ui/            Buttons, fields, dialogs, drawers, prices, badges, icons
src/components/motion/        Reveal, SplitText, MagneticButton, SmoothScroll (Lenis + GSAP)
src/app/styleguide/           Every building block on one page (hidden from Google)
tests/unit/                   Vitest tests
tests/db/                     Database + RLS tests on an in-memory Postgres
docs/brief.md                 The Stage 1 brief in short
docs/plan/                    The build plan
.agents/product-marketing.md  Positioning and brand voice (read by the copy tools)
```

## Run it locally

Needs Node 22.12 or newer (`node -v`).

```
npm install
npm run dev        # http://localhost:3000
npm run test       # unit tests
npm run lint       # code style
npm run typecheck  # TypeScript
npm run build      # production build
```

Copy `.env.example` to `.env.local` when a task asks for keys. Never commit `.env.local`.

No database handy? `KAIRO_DATA=fixtures npm run dev` reads the products straight from `supabase/seed/catalog.mjs` (the GitHub checks do this). Forms then pretend to save.
