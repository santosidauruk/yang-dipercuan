# Frontend Implementation Plan — Personal Stock App

## Context

Backend belum ada, frontend dibangun duluan. Perlu API mocking strategy supaya frontend bisa dikembangkan secara independen. Plan ini mencakup step-by-step dari project init sampai semua halaman dan komponen selesai.

---

## Data Strategy

### 1. Stock Data: **Yahoo Finance API (Direct, via Next.js Server)**

**Approach:**

- Pakai `yahoo-finance2` npm package di Next.js Route Handlers & Server Actions
- Tidak di-call dari browser (CORS blocked), melainkan dari server-side Next.js
- Data real dari awal — no mocking needed untuk stock data

**Endpoints (Next.js Route Handlers):**

```
src/app/api/stocks/route.ts              → GET list of IDX stocks
src/app/api/stocks/[code]/route.ts       → GET stock detail + quote
src/app/api/stocks/[code]/history/route.ts → GET historical OHLCV
src/app/api/stocks/search/route.ts       → GET search stocks by keyword
```

**Caching strategy:**

- Stock quote: `revalidate: 30` (30 detik, free API rate limit friendly)
- Historical data: `revalidate: 3600` (1 jam, data tidak berubah sering)
- Company profile: `revalidate: 86400` (24 jam, rarely changes)
- Pakai TanStack Query di client untuk tambahan cache layer

**Realtime simulation:**

- Karena Yahoo Finance free API tidak support WebSocket, pakai polling via TanStack Query `refetchInterval: 30000` (30 detik) untuk simulate near-realtime
- Nanti ketika backend ready, ganti dengan real WebSocket

### 2. AI Chat: **Vercel AI SDK + Google Gemini**

**Approach:**

- `ai` npm package + `@ai-sdk/google` provider
- `useChat()` hook di client — built-in streaming, message history, loading state
- Route Handler di `src/app/api/chat/route.ts` — call Gemini via AI SDK
- System prompt include stock context (current price, fundamentals)

**Benefit vs custom SSE:**

- `useChat()` handle streaming, error, loading, abort — semua out of the box
- Message state management sudah built-in (no manual append)
- Type-safe, well-documented

### 3. Mock (MSW): **Hanya untuk fitur tanpa backend**

MSW tetap dipakai untuk data yang belum punya real source:

```
src/mocks/
├── browser.ts
├── handlers/
│   ├── portfolio.ts        # CRUD holdings, P&L
│   ├── recommendations.ts  # Daily stock picks
│   ├── risk-profile.ts     # Questionnaire results
│   └── watchlist.ts        # Watchlist CRUD
├── data/
│   ├── portfolio.json      # Sample 5-8 holdings
│   ├── recommendations.json # 5 daily picks with reasoning
│   └── risk-profiles.json  # Risk scoring reference
└── utils.ts
```

## Ketika backend ready, matikan MSW handler satu per satu — zero code change di komponen.

## Project Structure

```
frontend/
├── public/
│   └── mockServiceWorker.js    # MSW service worker
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (providers, navbar)
│   │   ├── page.tsx            # Landing page (public)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── onboarding/page.tsx   # Risk profile questionnaire
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Dashboard layout (sidebar + content)
│   │   │   ├── dashboard/page.tsx    # Main dashboard
│   │   │   ├── stocks/
│   │   │   │   ├── page.tsx          # Stock screener/list
│   │   │   │   └── [code]/page.tsx   # Stock detail + chart
│   │   │   ├── portfolio/page.tsx    # Portfolio tracker
│   │   │   ├── recommendations/page.tsx
│   │   │   ├── chat/page.tsx         # AI chat
│   │   │   └── settings/page.tsx     # Profile & risk settings
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── chat/route.ts                # AI SDK + Gemini streaming
│   │       └── stocks/
│   │           ├── route.ts                 # GET list IDX stocks
│   │           ├── search/route.ts          # GET search stocks
│   │           └── [code]/
│   │               ├── route.ts             # GET stock detail + quote
│   │               └── history/route.ts     # GET historical OHLCV
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── charts/
│   │   │   ├── CandlestickChart.tsx     # Lightweight Charts
│   │   │   ├── VolumeChart.tsx
│   │   │   ├── AllocationPieChart.tsx    # Recharts
│   │   │   ├── PnLLineChart.tsx         # Recharts
│   │   │   └── BenchmarkComparisonChart.tsx # Recharts
│   │   ├── stocks/
│   │   │   ├── StockCard.tsx
│   │   │   ├── StockList.tsx
│   │   │   ├── StockDetail.tsx
│   │   │   ├── WatchlistButton.tsx
│   │   │   └── TimeframeSelector.tsx
│   │   ├── portfolio/
│   │   │   ├── HoldingsTable.tsx
│   │   │   ├── AddHoldingForm.tsx
│   │   │   ├── PortfolioSummary.tsx
│   │   │   ├── UnrealizedPnL.tsx
│   │   │   └── BenchmarkComparison.tsx
│   │   ├── recommendations/
│   │   │   ├── DailyPickCard.tsx
│   │   │   ├── RecommendationList.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── risk-profile/
│   │   │   ├── QuestionnaireForm.tsx
│   │   │   ├── RiskScoreResult.tsx
│   │   │   ├── StressTestCard.tsx
│   │   │   └── GoalBasedForm.tsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ConversationList.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       └── PriceChange.tsx     # +2.5% green, -1.2% red
│   │   ├── hooks/
│   │   │   ├── useStocks.ts
│   │   │   ├── usePortfolio.ts
│   │   │   ├── useRecommendations.ts
│   │   │   ├── useRiskProfile.ts
│   │   │   └── useWatchlist.ts
│   │   ├── lib/
│   │   │   ├── api.ts              # fetch wrapper with base URL
│   │   │   ├── auth.ts             # NextAuth config
│   │   │   ├── yahoo-finance.ts    # yahoo-finance2 wrapper (server-only)
│   │   │   ├── utils.ts            # cn() helper, formatters
│   │   │   └── constants.ts        # stock sectors, timeframes
│   ├── stores/
│   │   ├── useThemeStore.ts
│   │   ├── useStockStore.ts    # selected stock, timeframe
│   │   └── useWatchlistStore.ts
│   ├── types/
│   │   ├── stock.ts
│   │   ├── portfolio.ts
│   │   ├── recommendation.ts
│   │   ├── chat.ts
│   │   └── user.ts
│   │   └── mocks/                  # MSW (portfolio, recommendations, risk-profile, watchlist only)
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## Implementation Steps (Urutan)

### Phase 1: Project Setup & Foundation

**Step 1 — Init Next.js + Core Dependencies**

- `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir`
- Install: `zustand`, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`
- Install: `lightweight-charts`, `recharts`
- Install: `next-auth@beta` (v5)
- Install: `yahoo-finance2` (stock data)
- Install: `ai`, `@ai-sdk/google` (Vercel AI SDK + Gemini provider)
- Install dev: `msw`

**Step 2 — shadcn/ui Setup**

- `npx shadcn@latest init`
- Add komponen yang dibutuhkan: `button`, `card`, `input`, `dialog`, `dropdown-menu`, `tabs`, `table`, `badge`, `avatar`, `sheet`, `separator`, `skeleton`, `toast`, `form`, `select`, `radio-group`, `progress`, `tooltip`

**Step 3 — Base Config**

- Tailwind config: custom colors (financial green/red, brand colors), dark mode
- `lib/utils.ts`: `cn()` helper, `formatCurrency()`, `formatPercentage()`, `formatDate()`
- `lib/constants.ts`: stock sectors, API base URL, timeframe options
- `types/`: semua TypeScript interfaces

**Step 4 — Layout & Theme**

- Root layout: providers (QueryClientProvider, ThemeProvider, SessionProvider)
- `Navbar.tsx`: logo, navigation links, ThemeToggle, UserMenu
- `Sidebar.tsx`: dashboard navigation (collapsible)
- `ThemeToggle.tsx`: light/dark mode toggle
- Dark mode implementation via `next-themes`

**Step 5 — Yahoo Finance API Routes**

- `lib/yahoo-finance.ts`: wrapper functions (server-only) — `getQuote()`, `getHistory()`, `searchStocks()`
- `api/stocks/route.ts`: GET list popular IDX stocks (hardcoded list of ~30 stock codes, fetch quotes)
- `api/stocks/[code]/route.ts`: GET stock detail + realtime quote
- `api/stocks/[code]/history/route.ts`: GET historical OHLCV (params: interval, range)
- `api/stocks/search/route.ts`: GET search stocks by keyword

**Step 6 — MSW Setup (Mock untuk fitur tanpa backend)**

- Setup MSW browser worker
- Buat seed data JSON: portfolio holdings, recommendations, risk profile
- Handlers hanya untuk: portfolio CRUD, recommendations, risk-profile, watchlist
- Conditional init: hanya aktif di development

### Phase 2: Authentication

**Step 7 — Auth Pages & Flow**

- NextAuth config (`lib/auth.ts`): Google provider (pakai dummy credentials di dev, MSW mock session)
- Login page: Google sign-in button, branding
- Middleware: protect `/dashboard/*` routes
- `UserMenu.tsx`: avatar, nama, logout

**Step 8 — Onboarding (Risk Profile Questionnaire)**

- `QuestionnaireForm.tsx`: multi-step form (React Hook Form + Zod)
  - Step 1: Investment goals (retirement, wealth growth, passive income)
  - Step 2: Investment horizon (< 1 year, 1-3 years, 3-5 years, > 5 years)
  - Step 3: Risk tolerance scenarios (market drop 20%, how do you react?)
  - Step 4: Monthly investment capacity
  - Step 5: Investment experience level
- `RiskScoreResult.tsx`: display hasil scoring (Conservative/Moderate/Aggressive) + asset allocation recommendation
- Redirect new users ke onboarding setelah first login

### Phase 3: Stock Data & Charts (Core Feature)

**Step 9 — Stock List & Search**

- `stocks/page.tsx`: stock screener page
- `StockList.tsx`: table/grid of stocks with current price, change %, volume
- Filter by sector (Banking, Mining, Consumer, etc.)
- Search by stock code or name
- `PriceChange.tsx`: colored percentage component (+green/-red)
- `useStocks.ts`: TanStack Query hook for fetching stock list

**Step 10 — Stock Detail & Candlestick Chart**

- `stocks/[code]/page.tsx`: stock detail page
- `CandlestickChart.tsx`: Lightweight Charts integration
  - Candlestick series + volume histogram overlay
  - Crosshair with price/date tooltip
  - Responsive container
- `TimeframeSelector.tsx`: 1m, 5m, 15m, 1h, 1D, 1W, 1M buttons
- `StockDetail.tsx`: company info, key metrics (P/E, market cap, dividend yield)
- `WatchlistButton.tsx`: add/remove from watchlist (Zustand + optimistic update)
- Near-realtime: TanStack Query `refetchInterval: 30000` (polling Yahoo Finance setiap 30 detik)

**Step 11 — Watchlist**

- Watchlist section di sidebar atau dashboard
- Watchlist management (add/remove, reorder)
- Mini sparkline per watchlist item (optional, nice-to-have)

### Phase 4: Portfolio Tracker

**Step 12 — Portfolio Page & Holdings**

- `portfolio/page.tsx`: main portfolio page
- `PortfolioSummary.tsx`: total value, total cost, overall P&L
- `HoldingsTable.tsx`: table with columns:
  - Stock code, name
  - Quantity, avg buy price
  - Current price, current value
  - Unrealized P&L (amount + percentage, colored)
- `AddHoldingForm.tsx`: dialog/sheet form (stock code autocomplete, price, quantity, date)
- `usePortfolio.ts`: TanStack Query hook + mutations

**Step 13 — Portfolio Charts**

- `AllocationPieChart.tsx`: asset allocation by stock/sector (Recharts PieChart)
- `PnLLineChart.tsx`: portfolio value over time (Recharts LineChart)
- `BenchmarkComparisonChart.tsx`: portfolio return vs IHSG return (Recharts dual LineChart)

### Phase 5: Risk Profile & Goal Planning

**Step 14 — Risk Profile Dashboard**

- `settings/page.tsx`: risk profile section
- Display current risk score + retake questionnaire option
- Asset allocation recommendation based on profile
- `StressTestCard.tsx`:
  - Simulate market crash scenarios (-10%, -20%, -30%)
  - Show projected portfolio impact
  - Visual bar showing potential loss

**Step 15 — Goal-Based Investing**

- `GoalBasedForm.tsx`:
  - Input: target amount, target date, current savings
  - Output: required monthly investment, recommended allocation
  - Progress bar toward goal
  - Projection chart (Recharts AreaChart)

### Phase 6: Recommendations

**Step 16 — Daily Recommendations**

- `recommendations/page.tsx`: recommendation list page
- `DailyPickCard.tsx`: stock recommendation card
  - Stock code + name
  - Signal (Buy/Sell/Hold) badge
  - Score (0-100)
  - Reasoning text
  - Key metrics snapshot
- `FilterBar.tsx`: filter by signal type, sector, market cap
- `RecommendationList.tsx`: sorted by score, date selector
- `useRecommendations.ts`: TanStack Query hook

### Phase 7: AI Chat

**Step 17 — Chat Interface**

- `chat/page.tsx`: chat page (split: conversation list + chat window)
- `api/chat/route.ts`: Route Handler — Vercel AI SDK + `@ai-sdk/google` (Gemini)
  - System prompt: "Kamu adalah advisor saham Indonesia..."
  - Inject stock context (current price, fundamentals) jika user sedang discuss emiten tertentu
  - `streamText()` dari AI SDK untuk streaming response
- `ConversationList.tsx`: list of past conversations, new chat button
- `ChatWindow.tsx`: message list + auto-scroll
- `ChatMessage.tsx`: user/assistant message bubbles, markdown rendering (`react-markdown`)
- `ChatInput.tsx`: text input + send button, stock context selector
- Client: `useChat()` hook dari `ai/react` — handles streaming, message state, loading, error, abort
- Conversation history: localStorage (mock), nanti migrate ke backend PostgreSQL

### Phase 8: Dashboard (Aggregation Page)

**Step 18 — Main Dashboard**

- `dashboard/page.tsx`: overview page combining widgets
- Widgets:
  - Portfolio summary card (total value, daily change)
  - Watchlist with mini prices
  - Today's top recommendation
  - Recent AI chat snippet
  - Market overview (IHSG index)
- Responsive grid layout (shadcn cards)

### Phase 9: Landing Page

**Step 19 — Public Landing Page**

- `page.tsx` (root): marketing landing page
- Hero section: tagline + CTA (Sign in with Google)
- Feature highlights (3-4 cards)
- Screenshot/mockup of dashboard
- Footer

### Phase 10: Polish & Quality

**Step 20 — Loading & Error States**

- `Skeleton` loading states untuk setiap data-dependent component
- `ErrorBoundary.tsx`: graceful error handling
- `EmptyState.tsx`: empty watchlist, empty portfolio, no recommendations
- Toast notifications (add to watchlist, add holding, etc.)

**Step 21 — Responsive Design**

- Mobile-responsive semua halaman
- Sidebar → bottom navigation di mobile
- Chart resize handling
- Table → card view di mobile

---

## Verification / Testing Plan

1. **Dev server:** `npm run dev` — semua halaman accessible
2. **Yahoo Finance:** Stock list loads real data, stock detail shows real quote, historical chart renders real OHLCV
3. **Auth flow:** Login → onboarding → dashboard redirect
4. **Chart rendering:** Candlestick chart renders real Yahoo Finance data, timeframe switching works
5. **Portfolio CRUD:** Add/edit/remove holdings (MSW mock), P&L calculates correctly using real stock prices
6. **Near-realtime:** Stock prices auto-refresh via TanStack Query polling (30s interval)
7. **AI Chat:** Gemini streaming response renders token by token via Vercel AI SDK `useChat()`
8. **Dark mode:** Toggle works, semua komponen render correctly di kedua modes
9. **Responsive:** Test di mobile viewport (375px), tablet (768px), desktop (1280px+)
10. **Type safety:** `tsc --noEmit` passes tanpa error
11. **Lint:** `eslint .` passes

## Environment Variables (.env.local)

```
# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini (for AI Chat)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```
