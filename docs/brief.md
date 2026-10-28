# KAIRO — Brief (Stage 1, locked 2026-10-28)

Kairo dresses one man for four lives: the street, the boardroom, the old-money weekend and the open road.

| Decision | Choice |
| --- | --- |
| Purpose | Portfolio showcase that works end to end; Razorpay test mode |
| Brand | In-house Ahmedabad label |
| Prices | Accessible luxury, ~₹1,800 – ₹18,000 |
| Who wears it | Menswear; Streetwear line is unisex. Male models only |
| Collections | Streetwear · Formal · Old Money · Riding |
| Photos | One consistent AI concept shoot, credited in the footer |
| Logo | KAIRO wordmark + K monogram (Direction A) |
| Accounts | Guest checkout; optional email/password or Google account |
| Shopping | Filters, search, size guide, wishlist, quick view, cart drawer, order tracking, Drops with countdown, Complete the Look, coupons, reviews (Verified buyer badge; seeded reviews tagged "Sample") |
| Signature 3D | Fabric hero (KAIRO on silk) + Four Wardrobes scroll journey; 2.5D on phones |
| Collection themes | Each collection page has its own theme; switching collections transitions the whole site (see design/tokens.css) |
| Contact | Store contact page + "Designed & built by Jainam Gondaliya" footer credit |
| Tagline | Four lives. One label. |

## Pages

- Storefront: `/`, `/shop`, `/collections/{streetwear|formal|old-money|riding}`, `/products/[slug]`, `/drops`, `/drops/[slug]`, `/lookbook`, `/search`
- Buying: cart drawer + `/cart`, `/wishlist`, `/checkout`, `/checkout/success`, `/track`
- Account: `/login`, `/signup`, `/forgot-password`, `/account`, `/account/orders/[id]`, `/account/addresses`
- Brand and help: `/about`, `/contact`, `/size-guide`, `/shipping-returns`, `/faq`, `/privacy`, `/terms`
- Admin (role-protected, noindex): `/admin` with products, orders, drops, coupons, reviews, messages
