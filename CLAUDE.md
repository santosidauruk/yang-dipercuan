# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Yang Dipercuan — a Next.js 16 (App Router, React 19) web app for tracking Indonesian (IDX / `.JK`) stocks and managing a personal portfolio (purchases, sales, dividends, watchlist). Monorepo-style layout (`backend/`, `frontend/`, `docs/`); this `CLAUDE.md` covers `frontend/`, currently the only active code.

The backend does not exist yet. All persistence is client-side `localStorage` via Zustand `persist` middleware; only stock market data is real, served through Next.js Route Handlers wrapping Yahoo Finance.

## Commands

```bash
npm run dev          # Next.js dev server on :3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (eslint-config-next + TS)
npm run tsc          # type-check only
npm run test         # vitest run (one-shot)
npm run test:watch   # vitest watch
npm run validate     # lint + tsc + test (run before pushing)
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

## Architecture

### Data flow

| Domain                                              | Source                            | Where                                                                                                                     |
| --------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Stock quotes / history / search                     | **Real** Yahoo via `yahoo-finance2` | Server-only in [src/app/api/stocks/](src/app/api/stocks/), wrapped by [src/lib/yahoo-finance.ts](src/lib/yahoo-finance.ts) |
| Purchases / sales / dividends / watchlist / metadata | **Local** Zustand `persist`        | Stores in [src/stores/](src/stores/), persisted to `localStorage`                                                         |

`yahoo-finance2` MUST stay server-side (browser CORS). Always go through a Route Handler under `src/app/api/stocks/`; never import `@/lib/yahoo-finance` from a client component.

### Stock data endpoints — pick the right one

- `/api/stocks/search?q=` — Yahoo search, filtered to `.JK` symbols. Returns `StockSearchResult[]`.
- `/api/stocks/prices?codes=A.JK,B.JK` — batch, **price only**. Returns `Record<symbol, number>`. Legacy; use `quotes` for new features.
- `/api/stocks/quotes?codes=A.JK,B.JK` — batch, **price + `regularMarketChangePercent`**. Returns `Record<symbol, {price, changePercent}>`. Prefer this when UI needs %Δ today.
- `/api/stocks/[code]` — full `StockDetail` for one symbol.
- `/api/stocks/[code]/history` — OHLCV chart data.

All hooks live in [src/hooks/useStocks.ts](src/hooks/useStocks.ts) with `refetchInterval: 30_000` to simulate realtime.

### Code form convention — bare vs Yahoo symbol

- **Bare code** (`BBCA`, `PGAS`) — what stores, types (`Purchase.code`, `WatchlistItem.code`, `Dividend.code`), and URL slugs (`/stocks/BBCA`) hold.
- **Yahoo symbol** (`BBCA.JK`) — what Yahoo APIs and route handlers expect on the wire.
- **Convert at the boundary**: append `.JK` only when calling `/api/stocks/*`; strip on the way back. Helpers usually inline: `code.replace(/\.JK$/i, '')`.

### Route group layout

`src/app/(dashboard)/` is a Next.js route group: pages (`portfolio`, `purchases`, `sales`, `dividends`, `watchlist`, `stocks/[code]`) share [src/app/(dashboard)/layout.tsx](<src/app/(dashboard)/layout.tsx>) which renders `Header` + `BottomNav` in a max-`xl` mobile-first container. The root [src/app/layout.tsx](src/app/layout.tsx) wires `Providers` and the Sonner toaster.

Page files are thin: `(dashboard)/<domain>/page.tsx` typically just renders `<DomainPageClient />` from `src/components/<domain>/`. All interactive state lives in the client component.

### Client state layers

- **TanStack Query** ([src/hooks/](src/hooks/)) — server state, all API calls. Defaults: `staleTime: 30s`, `refetchOnWindowFocus: false` (set in `Providers`).
- **Zustand** ([src/stores/](src/stores/)) — client state. Stores using `persist` write to `localStorage` under the **`yangdipercuan:*` namespace** (`yangdipercuan:purchases`, `:sales`, `:dividends`, `:watchlist`, `:stockMeta`). Never reuse legacy `stockidx-*` keys — they were retired in Phase 0 with no migration.

### Stock metadata cache

`useStockMeta` ([src/stores/useStockMeta.ts](src/stores/useStockMeta.ts)) is the canonical `code → {name, sector}` map, persisted at `yangdipercuan:stockMeta`. Populate via `setMeta(code, {name, sector})` whenever a search result is selected (purchases, sales, dividends, watchlist all do this); read `meta[code]?.name` for display instead of refetching `/api/stocks/[code]`. Lookups return `undefined` for unknown codes — fall back to the bare code.

### Reference data

[src/lib/constants.ts](src/lib/constants.ts) holds chart `TIMEFRAMES` (with Yahoo `interval`/`range` mappings) and `IHSG_CODE` (`^JKSE`). The IDX universe is **not** hardcoded — symbols come from Yahoo search, names from `useStockMeta`.

## Conventions

- **Path alias:** `@/*` → `src/*`. Use it; never write `../../`.
- **shadcn/ui** ([components.json](components.json)): style `new-york`, base color `neutral`, `lucide` icons. Add new components via `npx shadcn add <name>`, don't hand-roll.
- **Tailwind v4** — no `tailwind.config.*`; theme tokens + dark mode in [src/app/globals.css](src/app/globals.css). `next-themes` defaults to `dark`.
- **Prettier:** no semis, single quotes, no trailing commas, 80 col, 2-space ([.prettierrc](.prettierrc)). `prettier-plugin-tailwindcss` reorders class names.
- **Formatting helpers** ([src/lib/utils.ts](src/lib/utils.ts)) use `id-ID` locale + IDR currency. Use `formatCurrency` / `formatNumber` / `formatPercentage` / `formatCompactNumber` over ad-hoc `Intl.NumberFormat`.
- **Types** are barrelled through [src/types/index.ts](src/types/index.ts) — import from `@/types`.
- **Forms**: react-hook-form + Zod schema, shadcn `Form*` primitives. See [src/components/purchases/PurchaseFormDialog.tsx](src/components/purchases/PurchaseFormDialog.tsx) as the reference shape.

## Testing

Vitest + jsdom + `@testing-library/react`. Config: [vitest.config.ts](vitest.config.ts), setup: [vitest.setup.ts](vitest.setup.ts) (registers `@testing-library/jest-dom/vitest` matchers + `cleanup()` after each).

- **Store tests** (`src/stores/*.test.ts`) — call `setState` to reset, `localStorage.clear()` in `beforeEach`. Spy on `Storage.prototype.setItem` to assert the persist key.
- **Component tests** (`src/components/<domain>/*.test.tsx`) — wrap render in `<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>`. Stub `fetch` with `vi.stubGlobal('fetch', mockFn)` and dispatch on URL. Use `data-testid="<domain>-row-<code>"` + `data-testid="remove-<code>"` style hooks for stable selectors. Reset stores in `beforeEach`.

Run a single file: `npx vitest run src/stores/useWatchlist.test.ts`.

## Docs

Longer-form context: [docs/frontend-implementation-plan.md](docs/frontend-implementation-plan.md), [docs/frontend-stack-decisions.md](docs/frontend-stack-decisions.md), [docs/pages-implementation-guide.md](docs/pages-implementation-guide.md). Repo-root [../docs/](../docs/) holds backend architecture decisions for later.

## Agent skills

### Issue tracker

GitHub Issues at `santosidauruk/yang-dipercuan` via `gh` CLI. See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Five canonical labels, default vocabulary. See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at frontend root. See [docs/agents/domain.md](docs/agents/domain.md).
