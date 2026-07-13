# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack). Only ONE instance can run at a time —
                 # if one is already running, Next refuses to start a second and prints its port/PID.
npm run build    # Production build
npm run lint     # ESLint (flat config, eslint.config.mjs)
npx tsc --noEmit # Typecheck (no dedicated script)
```

There is no test script; vitest + testing-library are installed but no test files or config exist yet.

## Critical: Next.js version

Per AGENTS.md above: this is Next.js 16 — APIs and conventions may differ from training data (e.g. route `params` is a `Promise` that must be awaited). Read `node_modules/next/dist/docs/` before writing framework-touching code.

## Architecture

`docs/ARCHITECTURE.md` is the authoritative reference. Summary of the rules it enforces:

- **Feature-driven structure**: `src/app/` is routing ONLY (pages are thin controllers that fetch data and render a feature shell). All UI/logic lives in `src/features/<domain>/` (shop, cart, checkout, orders, invoices, auth, user, gift-cards), each with `components/`, `services/`, `types/`, optional `store/`/`hooks/`/`utils/`, and an `index.ts` public entry point.
- **Import discipline**: import from `@/features/<name>` (the index), not deep paths. Features must not import another feature's internals.
- **Service layer is mandatory**: no `fetch`/axios calls inside components or hooks — API calls go in the feature's `services/`. The shop feature's API surface is `shopApi` (`features/shop/services/shop-api.ts`, re-exported via `features/shop/api.ts`).
- **State**: feature-local Zustand stores (e.g. `features/auth/store/auth.store.ts`); server state via TanStack Query (provider wired in `src/app/providers.tsx`).
- **`src/shared/`** is for logic-free, 2+-feature items only: shadcn UI (`shared/components/ui`), brand assets, and `shared/lib` (axios client with auth interceptors, firebase, query client).

### Routing (App Router, route groups)

- `(public)`: `/shop` (home shell), `/[slug]` (category pages), `/[slug]/[productSlug]` (product detail → `LiveProductDetail`), `/cart`, `/checkout`, `/login`, `/register`, `/verify-otp`
- `(protected)`: `/orders`, `/invoices`, `/transactions`, `/gift-cards` — protection is enforced **client-side** via AuthGuard (`src/proxy.ts` is a legacy stub), because access tokens are memory-only and refresh tokens are HttpOnly cookies. The axios client (`shared/lib/axios.ts`) injects the bearer token and queues a refresh on 401.

### Data flow (shop)

Server components in `app/` call `shopApi` (categories, products, product detail), map API models to view models via `features/shop/utils/mappers.ts` (`apiToCard`), then render client shells (`ShopShell`, `ShopLayout`, `LiveProductDetail`). Static sample data in `features/shop/services/product.service.ts` acts as fallback when the API is unreachable. Checkout goes through `useCheckout`/`checkout.utils.ts` with a debounced `checkoutPreview` API call and Razorpay (`utils/razorpay-checkout.ts`).

The backend base URL comes from `NEXT_PUBLIC_SHOP_API_BASE` / `NEXT_PUBLIC_API_BASE_URL` (see `src/config/env.ts` and the rewrite in `next.config.ts` that proxies `/api/*` to it).

## Design system ("Broadcast HUD")

Dark esports theme defined in `src/styles/globals.css` (Tailwind v4 — no `tailwind.config`; theme lives in CSS via `@theme`):

- **Tokens**: `--void` (page bg), `--carbon`/`--surface` (panels), `--flame`/`--flame-deep` (primary orange), `--coin` (gold), `--ice` (cyan "live" accent), `--win` (green), `--muted`/`--faint` (text). Use these instead of hardcoded hexes.
- **Primitives**: `HudPanel`/`CornerTicks` (chamfered panels, `features/shop/components/hud.tsx`), `.eyebrow` (mono uppercase labels), `.font-data` (tabular numerics), `.tac-grid` + `.ar-*` animation classes, `.shop-content-width` (fluid page width — don't add per-component max-widths inside layout-wrapped content; `ShopLayout` already constrains and pads children).
