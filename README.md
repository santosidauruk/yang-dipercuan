# Granary

Granary is a Next.js 16 web app for tracking Indonesian IDX stocks and a
personal portfolio. It supports purchases, sales, dividends, a watchlist,
stock search, price quotes, and portfolio views.

The app is currently frontend-only for user data. Portfolio records are stored
in the browser with Zustand persistence, while market data is fetched through
Next.js Route Handlers that wrap Yahoo Finance server-side.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui with Radix primitives
- TanStack Query for server state
- Zustand for browser-persisted client state
- Vitest, jsdom, and Testing Library
- Yahoo Finance via `yahoo-finance2`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects
to the portfolio dashboard.

## Scripts

```bash
npm run dev          # Start the Next.js dev server
npm run build        # Create a production build
npm run start        # Serve the production build
npm run lint         # Run ESLint
npm run tsc          # Type-check only
npm run test         # Run Vitest once
npm run test:watch   # Run Vitest in watch mode
npm run validate     # Run lint, type-check, and tests
npm run format       # Format files with Prettier
npm run format:check # Check Prettier formatting
```

## Architecture

Granary uses two data layers:

- Market data comes from Yahoo Finance through API routes under
  `src/app/api/stocks/`.
- Portfolio data lives in `localStorage` through Zustand stores under
  `src/stores/`.

`yahoo-finance2` must remain server-side because browser calls hit CORS
restrictions. Client code should call the stock API routes and should not import
`@/lib/yahoo-finance`.

## Stock API Routes

- `/api/stocks/search?q=` searches Yahoo and returns `.JK` stock results.
- `/api/stocks/prices?codes=A.JK,B.JK` returns batch prices.
- `/api/stocks/quotes?codes=A.JK,B.JK` returns batch prices and daily percent
  changes.
- `/api/stocks/[code]` returns full detail for one symbol.
- `/api/stocks/[code]/history` returns OHLCV chart data.
- `/api/stocks/[code]/profile` returns cached display metadata such as company
  name and sector.

The app stores bare IDX codes such as `BBCA` and only appends `.JK` at API
boundaries.

## Persistence

Local browser data uses the `granary:*` namespace:

- `granary:purchases`
- `granary:sales`
- `granary:dividends`
- `granary:watchlist`
- `granary:settings`
- `granary:stockMeta`

There is no backend persistence yet, so clearing browser storage removes the
portfolio data for that browser.

## Project Layout

```text
src/app/                 Next.js routes and API handlers
src/app/(dashboard)/     Shared dashboard layout and pages
src/components/          Feature and UI components
src/hooks/               TanStack Query hooks
src/lib/                 Utilities, CSV helpers, portfolio math, Yahoo wrapper
src/stores/              Zustand stores
src/types/               Shared TypeScript types
docs/                    Planning, deployment, and agent documentation
```

## Testing

Run all checks before shipping:

```bash
npm run validate
```

Run a single test file:

```bash
npx vitest run src/stores/useWatchlist.test.ts
```

Store tests reset Zustand state and browser storage in `beforeEach`. Component
tests use Testing Library with TanStack Query providers and stubbed `fetch`
responses.

## Documentation

Additional context lives in:

- `AGENTS.md` for coding-agent guidance
- `docs/prd.md` for product requirements and architecture notes
- `docs/deploy-sumopod.md` for deployment notes
- `docs/future-enhancements.md` for planned improvements
