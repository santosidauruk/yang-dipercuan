# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StockIDX — a Next.js 16 (App Router, React 19) web app for tracking Indonesian (IDX / `.JK`) stocks, managing a portfolio, and getting AI-powered insights. The repo is a monorepo-style layout (`backend/`, `frontend/`, `docs/`); this `CLAUDE.md` covers `frontend/`, which is currently the only active code.

The backend does not exist yet. The frontend is built first, with a deliberate split between **real data** (stock quotes via Yahoo Finance, served through Next.js Route Handlers) and **mocked data** (portfolio, watchlist, recommendations, risk profile, user — served by MSW in the browser). When the backend lands, MSW handlers will be removed one-by-one with no component changes.

## Commands

```bash
npm run dev          # Next.js dev server on :3000
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (eslint-config-next + TS)
npm run tsc          # typecheck (no emit)
npm run test         # vitest run (jsdom, RTL + jest-dom)
npm run test:watch   # vitest watch
npm run validate     # lint + tsc + test
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

Tests live alongside source as `*.test.ts(x)`. RTL component tests prefer integration over implementation — render the page client with a `QueryClient`, seed the Zustand stores directly, mock `globalThis.fetch`, and assert visible text.

## Environment

`.env.local` (already present, gitignored) provides Better Auth + Google OAuth credentials and `NEXT_PUBLIC_APP_URL`. There is no `NEXT_PUBLIC_API_URL` set, so [src/lib/api.ts](src/lib/api.ts) `fetchApi` calls hit same-origin paths — which means MSW (browser) intercepts `/api/portfolio/*`, `/api/watchlist/*`, etc., while Next.js Route Handlers serve `/api/stocks/*`, `/api/auth/*`, `/api/users/me`.

## Architecture

### Data flow split — read this before adding any data source

| Domain                                                            | Source                                      | Where                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stock quotes / history / search                                   | **Real** Yahoo Finance via `yahoo-finance2` | Server-only in [src/app/api/stocks/](src/app/api/stocks/), wrapped by [src/lib/yahoo-finance.ts](src/lib/yahoo-finance.ts)                                                                            |
| Auth (Google OAuth, sessions)                                     | **Real** Better Auth                        | [src/lib/auth.ts](src/lib/auth.ts) (server), [src/lib/auth-client.ts](src/lib/auth-client.ts) (client), catch-all route at [src/app/api/auth/\[...all\]/route.js](src/app/api/auth/[...all]/route.js) |
| Portfolio, watchlist, recommendations, risk profile, user profile | **Mocked** by MSW                           | Handlers in [src/mocks/handlers/](src/mocks/handlers/), data in [src/mocks/data/](src/mocks/data/)                                                                                                    |

`yahoo-finance2` MUST stay server-side (browser calls hit CORS). Always go through a Route Handler under `src/app/api/stocks/`, never import `@/lib/yahoo-finance` from a client component.

### MSW initialization (subtle but important)

[src/components/providers.tsx](src/components/providers.tsx) starts the MSW worker on the client **only in `NODE_ENV === 'development'`**, and **blocks rendering (`return null`) until the worker is ready** to avoid race conditions where the first render fires unintercepted requests. If you add a new MSW handler, register it in [src/mocks/handlers/index.ts](src/mocks/handlers/index.ts) — just creating the file is not enough. Worker file is `public/mockServiceWorker.js` (ignored by prettier).

In production builds MSW is skipped, so any endpoint that's still mocked will 404 — this is the migration signal that the backend needs to take over.

### Route group layout

`src/app/(dashboard)/` is a Next.js route group: every page inside (`dashboard`, `portfolio`, `stocks`, `recommendations`, `chat`, `settings`, `login`, `onboard`) shares [src/app/(dashboard)/layout.tsx](<src/app/(dashboard)/layout.tsx>) which renders `Header` + `BottomNav` and wraps in a max-`xl` mobile-first container. The root [src/app/layout.tsx](src/app/layout.tsx) only wires `Providers` and the Sonner toaster.

### Client state layers

Three coexisting layers — pick the right one:

- **TanStack Query** ([src/hooks/](src/hooks/)) — server state, all API calls. Default `staleTime: 30s`, `refetchOnWindowFocus: false` (set in `Providers`). Most stock hooks use `refetchInterval: 30_000` to simulate realtime since the free Yahoo API has no WebSocket.
- **Zustand** ([src/stores/](src/stores/)) — client-only UI/preference state. `useWatchlistStore` persists to `localStorage` under `stockidx-watchlist`; `useStockStore` is in-memory chart timeframe.
- **Better Auth session** — server-side via `auth.api.getSession({ headers })` in Route Handlers; client-side via `authClient` from [src/lib/auth-client.ts](src/lib/auth-client.ts). Note: [src/hooks/useAuth.ts](src/hooks/useAuth.ts) is a **separate Zustand store** for a dev/demo user shim, not the real session — don't confuse the two.

### Reference data

[src/lib/constants.ts](src/lib/constants.ts) is the source of truth for the IDX stock universe (`IDX_STOCKS`), `SECTORS`, chart `TIMEFRAMES` (with Yahoo `interval`/`range` mappings), `RISK_ALLOCATIONS` for the risk profile questionnaire, and `IHSG_CODE` (`^JKSE`). Stock route handlers join Yahoo quotes with `IDX_STOCKS` to get name/sector — symbols outside this list will return `sector: 'Unknown'`.

## Conventions

- **Path alias:** `@/*` → `src/*` (see [tsconfig.json](tsconfig.json)). Use it; don't write `../../`.
- **shadcn/ui** is configured ([components.json](components.json)) with style `new-york`, base color `neutral`, `lucide` icons. Components live in [src/components/ui/](src/components/ui/). Add new ones via `npx shadcn add <name>` rather than hand-rolling.
- **Tailwind v4** (no `tailwind.config.*` — config is in CSS). Theme tokens and dark mode live in [src/app/globals.css](src/app/globals.css). `next-themes` defaults to `dark`.
- **Prettier:** no semis, single quotes, no trailing commas, 80 col, 2-space (see [.prettierrc](.prettierrc)). `prettier-plugin-tailwindcss` reorders class names — don't fight it.
- **Formatting helpers** ([src/lib/utils.ts](src/lib/utils.ts)) use `id-ID` locale and IDR currency. Use `formatCurrency` / `formatNumber` / `formatPercentage` / `formatCompactNumber` rather than ad-hoc `Intl.NumberFormat` calls so the locale stays consistent.
- **Types** are barrelled through [src/types/index.ts](src/types/index.ts) — import from `@/types`, not the individual files.

## Docs

Longer-form context lives in [docs/frontend-implementation-plan.md](docs/frontend-implementation-plan.md), [docs/frontend-stack-decisions.md](docs/frontend-stack-decisions.md), and [docs/pages-implementation-guide.md](docs/pages-implementation-guide.md). The repo-root [../docs/](../docs/) folder has backend architecture decisions for when that work begins.

## Agent skills

### Issue tracker

GitHub Issues at `santosidauruk/yang-dipercuan` via `gh` CLI. See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

Five canonical labels, default vocabulary. See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at frontend root. See [docs/agents/domain.md](docs/agents/domain.md).
