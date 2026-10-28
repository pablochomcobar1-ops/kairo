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
| 4 | Build | Task 0 done |
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
tests/unit/                   Vitest tests
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
