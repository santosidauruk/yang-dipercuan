# Pages Implementation Guide

Detail step-by-step untuk setiap page: wireframe, komponen, API endpoint, dan logic.

---

## 1. Authentication (Login + Onboarding)

### 1a. Login Page (`/login`)

**Wireframe:**

```
┌─────────────────────────────────────────┐
│                                         │
│              StockIDX Logo              │
│                                         │
│     Track your Indonesian stocks        │
│     with AI-powered insights            │
│                                         │
│     ┌─────────────────────────────┐     │
│     │  🔵 Sign in with Google     │     │
│     └─────────────────────────────┘     │
│                                         │
│     By signing in, you agree to our     │
│     Terms of Service                    │
│                                         │
└─────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(auth)/login/page.tsx` — login page
- Pakai `Button` dari shadcn + Google icon

**API:**

- `POST /api/auth/signin` — handled by NextAuth
- `GET /api/auth/session` — get current session

**NextAuth Config (`src/lib/auth.ts`):**

```
- Provider: Google (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Session strategy: JWT
- Callbacks: redirect new users to /onboarding
```

**Middleware (`src/middleware.ts`):**

```
- Protect all /dashboard, /stocks, /portfolio, /recommendations,
  /chat, /settings routes
- Redirect unauthenticated users to /login
- Redirect authenticated users from /login to /dashboard
```

---

### 1b. Onboarding / Risk Profile Questionnaire (`/onboarding`)

**Wireframe:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Risk Profile Assessment                                │
│                                                         │
│  ┌─ Progress Bar ──────────────────────────────────┐    │
│  │ ████████░░░░░░░░░░░░  Step 2 of 5              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  What is your investment horizon?               │    │
│  │                                                 │    │
│  │  ○ Less than 1 year                             │    │
│  │  ○ 1 - 3 years                                  │    │
│  │  ○ 3 - 5 years                                  │    │
│  │  ● More than 5 years                            │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│                       [ Back ]  [ Next → ]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(auth)/onboarding/page.tsx` — onboarding page
- `src/components/risk-profile/QuestionnaireForm.tsx` — multi-step form
- `src/components/risk-profile/RiskScoreResult.tsx` — result display (after submit)

**Library:** React Hook Form + Zod, `Progress` dari shadcn, `RadioGroup` dari shadcn

**API:**

- `POST /api/risk-profile` — save questionnaire result
- `GET /api/risk-profile` — check if user already has a profile

**Questionnaire Steps:**

Step 1 — Investment Goal:

```
Question: "Apa tujuan investasi utama kamu?"
Options:
  - Capital preservation (menjaga nilai uang)        → score: 5
  - Passive income (dividen rutin)                   → score: 10
  - Wealth growth (pertumbuhan kekayaan)             → score: 15
  - Aggressive growth (pertumbuhan maksimal)         → score: 20
```

Step 2 — Investment Horizon:

```
Question: "Berapa lama kamu berencana menginvestasikan uang ini?"
Options:
  - Kurang dari 1 tahun     → score: 5
  - 1 - 3 tahun             → score: 10
  - 3 - 5 tahun             → score: 15
  - Lebih dari 5 tahun      → score: 20
```

Step 3 — Risk Tolerance:

```
Question: "Jika nilai portofolio kamu turun 20% dalam sebulan, apa yang akan kamu lakukan?"
Options:
  - Jual semua untuk menghindari kerugian lebih lanjut    → score: 5
  - Jual sebagian untuk mengurangi risiko                 → score: 10
  - Tahan dan tunggu pemulihan                            → score: 15
  - Beli lebih banyak (averaging down)                    → score: 20
```

Step 4 — Monthly Investment:

```
Question: "Berapa kapasitas investasi bulanan kamu?"
Options:
  - Kurang dari Rp 1.000.000       → score: 5
  - Rp 1.000.000 - Rp 5.000.000   → score: 10
  - Rp 5.000.000 - Rp 20.000.000  → score: 15
  - Lebih dari Rp 20.000.000      → score: 20
```

Step 5 — Experience Level:

```
Question: "Berapa lama pengalaman investasi saham kamu?"
Options:
  - Belum pernah investasi        → score: 5
  - Kurang dari 1 tahun           → score: 10
  - 1 - 3 tahun                   → score: 15
  - Lebih dari 3 tahun            → score: 20
```

**Scoring Logic (`src/lib/risk-scoring.ts`):**

```
rawScore = sum of all 5 answers          (range: 25 - 100)
normalizedScore = ((rawScore - 25) / 75) * 100    (range: 0 - 100)

0  - 33  → Conservative
34 - 66  → Moderate
67 - 100 → Aggressive
```

**Data yang di-POST:**

```json
{
  "level": "moderate",
  "score": 62,
  "investmentGoal": "wealth_growth",
  "investmentHorizon": "3_5_years",
  "monthlyInvestment": 10000000,
  "experienceLevel": "1_3_years"
}
```

**MSW Mock (`src/mocks/handlers/risk-profile.ts`):**

- `GET /api/risk-profile` — return stored profile or `null`
- `POST /api/risk-profile` — store in memory, return with `completedAt` timestamp

**After submit:** redirect to `/settings` yang menampilkan result + stress test + goal-based investing.

---

## 2. Stock Data Pages

### 2a. Stock List / Screener (`/stocks`)

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar │  Stocks                                               │
│         │                                                       │
│         │  ┌─ Search ──────────────────────────────────────┐    │
│         │  │ 🔍  Search by code or name...                 │    │
│         │  └───────────────────────────────────────────────┘    │
│         │                                                       │
│         │  Filter: [All] [Banking] [Mining] [Consumer] [Telco]  │
│         │          [Automotive] [Property] [Construction]       │
│         │          [Energy] [Healthcare] [Technology]            │
│         │                                                       │
│         │  ┌────────┬──────────────┬─────────┬────────┬──────┐  │
│         │  │ Code   │ Name         │ Price   │ Change │ Vol  │  │
│         │  ├────────┼──────────────┼─────────┼────────┼──────┤  │
│         │  │ BBCA   │ Bank Central │ 9.250   │ +1.23% │ 15M  │  │
│         │  │ BBRI   │ Bank Rakyat  │ 5.100   │ -0.58% │ 32M  │  │
│         │  │ TLKM   │ Telkom Indo  │ 3.450   │ +0.87% │ 28M  │  │
│         │  │ ASII   │ Astra Inter  │ 5.625   │ +2.10% │ 12M  │  │
│         │  │ ...    │ ...          │ ...     │ ...    │ ...  │  │
│         │  └────────┴──────────────┴─────────┴────────┴──────┘  │
│         │                                                       │
│         │  Showing 30 stocks · Auto-refresh every 30s           │
└─────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/stocks/page.tsx` — page wrapper
- `src/components/stocks/StockList.tsx` — table (sudah dibuat)
- `src/components/common/PriceChange.tsx` — colored percentage (sudah dibuat)
- `src/components/stocks/SectorFilter.tsx` — tombol filter per sektor
- `src/components/stocks/StockSearch.tsx` — search input dengan debounce

**API:**

- `GET /api/stocks?sector=Banking` — list stocks, optional filter by sector (Yahoo Finance, real)
- `GET /api/stocks/search?q=bank` — search stocks by keyword (Yahoo Finance, real)

**Hook:** `useStocks(sector)`, `useStockSearch(query)` — sudah dibuat di `src/hooks/useStocks.ts`

**Behavior:**

- Default: tampilkan semua 30 saham IDX
- Click sector filter → refetch dengan `?sector=Banking`
- Search input → debounce 300ms → hit search API
- Click row → navigate ke `/stocks/[code]`
- Auto refresh setiap 30 detik via TanStack Query `refetchInterval`

---

### 2b. Stock Detail (`/stocks/[code]`)

**Wireframe:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar │  ← Back to Stocks                                      │
│         │                                                         │
│         │  BBCA  Bank Central Asia                    [★ Watchlist]│
│         │  Rp 9.250  +125 (+1.37%)                                │
│         │                                                         │
│         │  ┌─ Timeframe ──────────────────────────────────────┐   │
│         │  │ [1M] [5M] [15M] [1H] [1D] [1W] [1MO]           │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌─ Candlestick Chart ──────────────────────────────┐   │
│         │  │                                                  │   │
│         │  │     ┃                                            │   │
│         │  │    ┃┃┃    ┃                                      │   │
│         │  │   ┃┃┃┃┃  ┃┃┃    ┃                                │   │
│         │  │  ┃┃┃┃┃┃┃┃┃┃┃┃  ┃┃                                │   │
│         │  │ ┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃┃                               │   │
│         │  │                                                  │   │
│         │  │  ▁▂▃▅▃▂▁▂▃▅▇▅▃▂▁▂  (volume bars)               │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌─ Key Metrics ────────────────────────────────────┐   │
│         │  │                                                  │   │
│         │  │  Open      9.125    │  P/E Ratio     24.5       │   │
│         │  │  High      9.300    │  P/B Ratio     4.2        │   │
│         │  │  Low       9.050    │  EPS            377       │   │
│         │  │  Volume    15.2M    │  Div Yield     2.1%       │   │
│         │  │  Mkt Cap   1.12T    │  52W High      9.800     │   │
│         │  │  Prev Close 9.125   │  52W Low       7.400     │   │
│         │  │                                                  │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/stocks/[code]/page.tsx` — page wrapper
- `src/components/stocks/StockDetail.tsx` — header (name, price, change) + key metrics grid
- `src/components/charts/CandlestickChart.tsx` — Lightweight Charts wrapper
- `src/components/stocks/TimeframeSelector.tsx` — timeframe buttons
- `src/components/stocks/WatchlistButton.tsx` — toggle watchlist (star icon)

**API:**

- `GET /api/stocks/[code]` — stock detail + realtime quote (Yahoo Finance, real)
- `GET /api/stocks/[code]/history?interval=1d&range=6mo` — OHLCV data (Yahoo Finance, real)

**Hook:** `useStockDetail(code)`, `useStockHistory(code, interval, range)`

**State:** `useStockStore` — `selectedTimeframe` (Zustand)

**CandlestickChart Implementation Notes:**

```
- Import: import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
- useRef for chart container div
- useEffect to create chart on mount, cleanup on unmount
- useEffect to update data when OHLCV data changes
- Candlestick series for price
- Histogram series for volume (overlay di bawah)
- chart.timeScale().fitContent() to auto-fit
- Handle container resize with ResizeObserver
```

**Timeframe → API Params Mapping (dari `lib/constants.ts` TIMEFRAMES):**

```
1M  → interval=1m,  range=1d
5M  → interval=5m,  range=5d
15M → interval=15m, range=5d
1H  → interval=60m, range=1mo
1D  → interval=1d,  range=6mo
1W  → interval=1wk, range=2y
1MO → interval=1mo, range=5y
```

**WatchlistButton:**

- Pakai `useWatchlistStore` (Zustand, persisted di localStorage)
- Star icon: filled (yellow) if in watchlist, outline if not
- Click → toggle `addToWatchlist` / `removeFromWatchlist`

---

### 2c. Watchlist (Widget, bukan page terpisah)

Watchlist bukan halaman terpisah, tapi muncul sebagai widget di Dashboard page.
State di-manage via `useWatchlistStore` (Zustand + localStorage persist).

**Wireframe (widget di dashboard):**

```
┌─ Watchlist ────────────────────────┐
│                                    │
│  BBCA   Rp 9.250   +1.37%    [✕]  │
│  BBRI   Rp 5.100   -0.58%    [✕]  │
│  TLKM   Rp 3.450   +0.87%    [✕]  │
│                                    │
│  [+ Add Stock]                     │
└────────────────────────────────────┘
```

**Komponen:**

- `src/components/stocks/WatchlistWidget.tsx` — card dengan list watchlist items

**Data flow:**

- Watchlist codes stored di Zustand (`useWatchlistStore`)
- Price data fetched dari `/api/stocks/[code]` per item
- Remove: click ✕ → `removeFromWatchlist(code)`
- Add: open dialog → search stock → `addToWatchlist(code)`

---

## 3. Portfolio Tracker (`/portfolio`)

**Wireframe:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar │  Portfolio                                              │
│         │                                                         │
│         │  ┌─ Summary Cards ──────────────────────────────────┐   │
│         │  │                                                  │   │
│         │  │  Total Value        Total Cost        P&L        │   │
│         │  │  Rp 52.350.000     Rp 48.100.000    +8.83%      │   │
│         │  │                                   +Rp 4.250.000  │   │
│         │  │                                                  │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌─ Holdings ──────────────────────── [+ Add Holding]┐  │
│         │  │                                                   │  │
│         │  │ Code │ Name      │ Qty │ Avg Buy │ Current │ P&L  │  │
│         │  │──────┼───────────┼─────┼─────────┼─────────┼──────│  │
│         │  │ BBCA │ Bank BCA  │ 100 │  8.500  │  9.250  │+8.8%│  │
│         │  │ BBRI │ Bank BRI  │ 200 │  4.800  │  5.100  │+6.3%│  │
│         │  │ TLKM │ Telkom    │ 500 │  3.200  │  3.450  │+7.8%│  │
│         │  │ ASII │ Astra     │ 150 │  5.400  │  5.625  │+4.2%│  │
│         │  │ ADRO │ Adaro     │ 300 │  2.800  │  2.650  │-5.4%│  │
│         │  │ KLBF │ Kalbe     │ 400 │  1.550  │  1.620  │+4.5%│  │
│         │  │                                                   │  │
│         │  └───────────────────────────────────────────────────┘  │
│         │                                                         │
│         │  ┌─ Allocation ────────┐  ┌─ vs IHSG ──────────────┐   │
│         │  │                     │  │                         │   │
│         │  │     ┌───┐           │  │  ──── Portfolio         │   │
│         │  │   ┌─┤   ├─┐        │  │  ---- IHSG              │   │
│         │  │   │ │   │ │        │  │       /\                 │   │
│         │  │   │ │PIE│ │        │  │   /\/   \  ----          │   │
│         │  │   └─┤   ├─┘        │  │  /  ----  \/             │   │
│         │  │     └───┘           │  │ /                       │   │
│         │  │                     │  │                         │   │
│         │  │ Banking    45%      │  │ Portfolio: +8.83%       │   │
│         │  │ Telco      12%      │  │ IHSG:     +5.20%       │   │
│         │  │ Automotive 10%      │  │ Alpha:    +3.63%       │   │
│         │  │ Mining     18%      │  │                         │   │
│         │  │ Healthcare 15%      │  │                         │   │
│         │  └─────────────────────┘  └─────────────────────────┘   │
│         │                                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/portfolio/page.tsx` — page wrapper
- `src/components/portfolio/PortfolioSummary.tsx` — summary cards (total value, cost, P&L)
- `src/components/portfolio/HoldingsTable.tsx` — table of holdings with P&L per row
- `src/components/portfolio/AddHoldingForm.tsx` — dialog form untuk tambah holding
- `src/components/portfolio/UnrealizedPnL.tsx` — P&L display component (colored)
- `src/components/charts/AllocationPieChart.tsx` — Recharts PieChart by sector
- `src/components/charts/BenchmarkComparisonChart.tsx` — Recharts dual LineChart

**API:**

- `GET /api/portfolio/holdings` — get all holdings (MSW mock)
- `POST /api/portfolio/holdings` — add new holding (MSW mock)
- `PUT /api/portfolio/holdings/:id` — update holding (MSW mock)
- `DELETE /api/portfolio/holdings/:id` — delete holding (MSW mock)
- `GET /api/stocks/[code]` — get current price per holding (Yahoo Finance, real)

**Hook:** `src/hooks/usePortfolio.ts`

```
- usePortfolioHoldings() — GET holdings
- useAddHolding() — POST mutation
- useUpdateHolding() — PUT mutation
- useDeleteHolding() — DELETE mutation
```

**P&L Calculation Logic (client-side):**

```
Per holding:
  totalCost = quantity * avgBuyPrice
  currentValue = quantity * currentPrice  (currentPrice dari Yahoo Finance API)
  unrealizedPnL = currentValue - totalCost
  unrealizedPnLPercent = (unrealizedPnL / totalCost) * 100

Portfolio total:
  totalCost = sum of all holdings' totalCost
  totalValue = sum of all holdings' currentValue
  totalPnL = totalValue - totalCost
  totalPnLPercent = (totalPnL / totalCost) * 100
```

**Allocation Pie Chart Logic:**

```
1. Group holdings by sector
2. Per sector: sectorValue = sum of currentValue of holdings in that sector
3. percentage = (sectorValue / totalValue) * 100
4. Colors from CHART_COLORS constant
```

**Benchmark Comparison Logic:**

```
1. Fetch IHSG historical data: GET /api/stocks/%5EJKSE/history?interval=1d&range=6mo
2. Calculate IHSG return: (currentIHSG - startIHSG) / startIHSG * 100
3. Portfolio return: totalPnLPercent (calculated above)
4. Plot both as line chart over time
5. Alpha = portfolio return - IHSG return
```

**AddHoldingForm Fields (Zod schema):**

```
stockCode: string     — autocomplete dari stock search
quantity: number      — positive integer
avgBuyPrice: number   — positive number
buyDate: string       — date picker
notes: string         — optional textarea
```

**MSW Mock Logic (`src/mocks/handlers/portfolio.ts`):**

- In-memory array `holdings[]`, initialized from `data/portfolio.json`
- `GET` → return array
- `POST` → generate ID (`h${Date.now()}`), push to array, return new holding
- `PUT` → find by ID, merge fields, return updated
- `DELETE` → filter out by ID, return `{ success: true }`

---

## 4. Risk Profile & Settings (`/settings`)

**Wireframe:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar │  Settings                                               │
│         │                                                         │
│         │  ┌─ Your Risk Profile ──────────────────────────────┐   │
│         │  │                                                  │   │
│         │  │  Profile: MODERATE          Score: 62/100        │   │
│         │  │                                                  │   │
│         │  │  ░░░░░░░░░░████████████████░░░░░░░░░░░░░░       │   │
│         │  │  Conservative   ▲ You      Aggressive            │   │
│         │  │                                                  │   │
│         │  │  [ Retake Assessment ]                           │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌─ Recommended Allocation ─────────────────────────┐   │
│         │  │                                                  │   │
│         │  │  ██████████████████████████  Saham         50%   │   │
│         │  │  ███████████████            Obligasi       30%   │   │
│         │  │  ████████                   Reksa Dana PM  15%   │   │
│         │  │  ███                        Deposito        5%   │   │
│         │  │                                                  │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌─ Portfolio Stress Test ──────────────────────────┐   │
│         │  │                                                  │   │
│         │  │  Based on your portfolio value: Rp 52.350.000    │   │
│         │  │  Stock portion (50%): Rp 26.175.000              │   │
│         │  │                                                  │   │
│         │  │  If market crashes:                              │   │
│         │  │                                                  │   │
│         │  │  -10%  │ ████░░░░░░  Loss: -Rp 2.617.500        │   │
│         │  │  -20%  │ ████████░░  Loss: -Rp 5.235.000        │   │
│         │  │  -30%  │ ██████████  Loss: -Rp 7.852.500        │   │
│         │  │                                                  │   │
│         │  │  Your remaining portfolio value:                 │   │
│         │  │  -10%: Rp 49.732.500                             │   │
│         │  │  -20%: Rp 47.115.000                             │   │
│         │  │  -30%: Rp 44.497.500                             │   │
│         │  │                                                  │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌─ Goal-Based Investing ──────────────────────────┐    │
│         │  │                                                  │   │
│         │  │  Goal Name:      [ Retirement Fund         ]     │   │
│         │  │  Target Amount:  [ Rp 500.000.000          ]     │   │
│         │  │  Target Date:    [ 2030-01-01              ]     │   │
│         │  │  Current Savings:[ Rp 52.350.000           ]     │   │
│         │  │                                                  │   │
│         │  │  [ Calculate ]                                   │   │
│         │  │                                                  │   │
│         │  │  Result:                                         │   │
│         │  │  ─────────────────────────────────               │   │
│         │  │  Months remaining:      46                       │   │
│         │  │  Monthly needed:        Rp 9.731.522             │   │
│         │  │  Progress:              10.5%                    │   │
│         │  │                                                  │   │
│         │  │  [========..........................] 10.5%       │   │
│         │  │                                                  │   │
│         │  └──────────────────────────────────────────────────┘   │
│         │                                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/settings/page.tsx` — page wrapper
- `src/components/risk-profile/RiskScoreResult.tsx` — display risk level + score bar
- `src/components/risk-profile/StressTestCard.tsx` — stress test visualization
- `src/components/risk-profile/GoalBasedForm.tsx` — goal input + calculation result

**API:**

- `GET /api/risk-profile` — get current risk profile (MSW)
- `GET /api/portfolio/holdings` — get holdings for stress test calculation (MSW)
- `GET /api/stocks/[code]` — current prices for total portfolio value (Yahoo Finance, real)

**Hook:** `src/hooks/useRiskProfile.ts`

```
- useRiskProfile() — GET risk profile
- useSaveRiskProfile() — POST mutation
```

**Stress Test Logic (`src/lib/risk-scoring.ts`):**

```
Input:
  - totalPortfolioValue (from portfolio holdings + current prices)
  - allocation.saham (from risk profile, e.g. 50%)

Calculation:
  stockPortion = totalPortfolioValue * (allocation.saham / 100)
  nonStockPortion = totalPortfolioValue - stockPortion

  For each scenario [-10%, -20%, -30%]:
    loss = stockPortion * (percentage / 100)
    remainingValue = nonStockPortion + (stockPortion - loss)

Output:
  Array of { scenario: "-10%", loss: number, remainingValue: number }
```

**Goal-Based Logic (client-side, pure function in `src/lib/risk-scoring.ts`):**

```
Input:
  - targetAmount: number
  - targetDate: string (ISO date)
  - currentSavings: number

Calculation:
  monthsRemaining = diff(targetDate, now) in months
  gap = targetAmount - currentSavings
  monthlyNeeded = gap / monthsRemaining
  progressPercent = (currentSavings / targetAmount) * 100

Output:
  { monthsRemaining, monthlyNeeded, progressPercent }
```

**State:** Goal-based form hasil hanya di-calculate client-side, tidak disimpan ke API.

---

## 5. Recommendations (`/recommendations`)

**Wireframe:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar │  Daily Recommendations                                  │
│         │                                                         │
│         │  ┌─ Filters ───────────────────────────────────────┐    │
│         │  │ Signal: [All] [Buy] [Hold] [Sell]               │    │
│         │  │ Sector: [All ▼]                                 │    │
│         │  └─────────────────────────────────────────────────┘    │
│         │                                                         │
│         │  ┌─ Card ──────────────────────────────────────────┐    │
│         │  │  BBCA  Bank Central Asia           Score: 88    │    │
│         │  │  [BUY]  Banking                                 │    │
│         │  │                                                 │    │
│         │  │  Pertumbuhan kredit yang solid di Q4 2025,       │    │
│         │  │  NIM stabil di atas 5%, dan kualitas aset       │    │
│         │  │  terjaga dengan NPL di bawah 2%.                │    │
│         │  │                                                 │    │
│         │  │  P/E: 24.5  │  Div Yield: 2.1%  │  MCap: 1.2T  │    │
│         │  └─────────────────────────────────────────────────┘    │
│         │                                                         │
│         │  ┌─ Card ──────────────────────────────────────────┐    │
│         │  │  ADRO  Adaro Energy                Score: 82    │    │
│         │  │  [BUY]  Mining                                  │    │
│         │  │  ...                                            │    │
│         │  └─────────────────────────────────────────────────┘    │
│         │                                                         │
│         │  ┌─ Card ──────────────────────────────────────────┐    │
│         │  │  UNVR  Unilever Indonesia          Score: 35    │    │
│         │  │  [SELL]  Consumer                               │    │
│         │  │  ...                                            │    │
│         │  └─────────────────────────────────────────────────┘    │
│         │                                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/recommendations/page.tsx` — page wrapper
- `src/components/recommendations/RecommendationList.tsx` — list of cards
- `src/components/recommendations/DailyPickCard.tsx` — individual recommendation card
- `src/components/recommendations/FilterBar.tsx` — signal type + sector filter

**API:**

- `GET /api/recommendations?signal=buy&sector=Banking` — filtered recommendations (MSW mock)

**Hook:** `src/hooks/useRecommendations.ts`

```
- useRecommendations(signal?, sector?) — GET with filters
```

**MSW Mock Logic (`src/mocks/handlers/recommendations.ts`):**

- Returns data from `data/recommendations.json`
- Filters by `signal` query param if provided
- Filters by `sector` query param if provided
- Sorts by score descending

**DailyPickCard Details:**

```
- Stock code + name (bold, link to /stocks/[code])
- Signal badge:
    Buy  → green badge
    Hold → yellow/amber badge
    Sell → red badge
- Score: 0-100, displayed as number
- Reasoning: 2-3 sentences of analysis text
- Bottom row: P/E, Dividend Yield, Market Cap (formatted)
```

**FilterBar:**

- Signal filter: toggle buttons [All] [Buy] [Hold] [Sell]
- Sector filter: shadcn `Select` dropdown with all sectors
- Both are controlled state, passed as params to `useRecommendations`

---

## 6. AI Chat (`/chat`)

**Wireframe:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar │  AI Chat                                                │
│         │                                                         │
│         │  ┌────────────────────────────────────────────────────┐  │
│         │  │                                                    │  │
│         │  │                                                    │  │
│         │  │  ┌──────────────────────────────────────────────┐  │  │
│         │  │  │ 🤖 Halo! Saya advisor saham AI. Tanyakan    │  │  │
│         │  │  │    apa saja tentang saham Indonesia.         │  │  │
│         │  │  └──────────────────────────────────────────────┘  │  │
│         │  │                                                    │  │
│         │  │  ┌──────────────────────────────────────────────┐  │  │
│         │  │  │ 👤 Analisa BBCA dong, apakah masih layak    │  │  │
│         │  │  │    untuk dibeli saat ini?                    │  │  │
│         │  │  └──────────────────────────────────────────────┘  │  │
│         │  │                                                    │  │
│         │  │  ┌──────────────────────────────────────────────┐  │  │
│         │  │  │ 🤖 Berdasarkan data terkini, BBCA...        │  │  │
│         │  │  │                                              │  │  │
│         │  │  │ **Fundamental:**                             │  │  │
│         │  │  │ - P/E Ratio: 24.5 (wajar untuk banking)     │  │  │
│         │  │  │ - Dividend Yield: 2.1%                      │  │  │
│         │  │  │ - EPS: Rp 377                                │  │  │
│         │  │  │                                              │  │  │
│         │  │  │ **Kesimpulan:**                              │  │  │
│         │  │  │ BBCA masih layak untuk...█ (streaming)      │  │  │
│         │  │  └──────────────────────────────────────────────┘  │  │
│         │  │                                                    │  │
│         │  │                                                    │  │
│         │  └────────────────────────────────────────────────────┘  │
│         │                                                         │
│         │  ┌──────────────────────────────────┐ ┌──────┐          │
│         │  │ Tanyakan tentang saham...        │ │ Send │          │
│         │  └──────────────────────────────────┘ └──────┘          │
│         │                                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/chat/page.tsx` — page wrapper
- `src/components/chat/ChatWindow.tsx` — scrollable message area
- `src/components/chat/ChatMessage.tsx` — single message bubble (user / assistant)
- `src/components/chat/ChatInput.tsx` — text input + send button

**API:**

- `POST /api/chat` — Vercel AI SDK route handler (streaming response)

**Route Handler (`src/app/api/chat/route.ts`):**

```typescript
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: `Kamu adalah advisor saham Indonesia yang membantu user menganalisa
             saham-saham di Bursa Efek Indonesia (IDX). Berikan analisa yang
             berimbang, mention risiko dan peluang. Gunakan bahasa Indonesia
             yang profesional tapi mudah dipahami. Jangan memberikan saran
             untuk membeli/menjual secara langsung, tapi berikan analisa
             untuk membantu user membuat keputusan sendiri.`,
    messages
  })

  return result.toDataStreamResponse()
}
```

**Client Integration:**

```typescript
import { useChat } from 'ai/react'

// Di chat page:
const { messages, input, handleInputChange, handleSubmit, isLoading } =
  useChat()
```

**Behavior:**

- User ketik pesan → submit → POST /api/chat
- Response di-stream token by token dari Gemini
- `useChat()` handle semua state (messages, loading, error)
- Messages per-session only, hilang saat refresh
- AI response di-render sebagai markdown via `react-markdown`
- Auto-scroll ke bawah saat pesan baru masuk

**ChatMessage Styling:**

```
User message:   aligned right, bg-primary, text-primary-foreground
AI message:     aligned left, bg-muted, text-foreground
                rendered with react-markdown (bold, lists, code blocks)
```

**Environment Variable Required:**

```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

---

## 7. Dashboard (`/dashboard`)

**Wireframe:**

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar │  Dashboard                                              │
│         │                                                         │
│         │  ┌─ Portfolio Summary ──────┐  ┌─ IHSG ──────────────┐  │
│         │  │                         │  │                      │  │
│         │  │  Total Value            │  │  IHSG: 7.245,32      │  │
│         │  │  Rp 52.350.000          │  │  +45,12 (+0.63%)     │  │
│         │  │                         │  │                      │  │
│         │  │  Today's Change         │  │  Open:    7.200      │  │
│         │  │  +Rp 325.000 (+0.62%)   │  │  High:    7.268      │  │
│         │  │                         │  │  Low:     7.188      │  │
│         │  │  Total P&L              │  │  Volume:  8.2B       │  │
│         │  │  +Rp 4.250.000 (+8.83%) │  │                      │  │
│         │  │                         │  │                      │  │
│         │  └─────────────────────────┘  └──────────────────────┘  │
│         │                                                         │
│         │  ┌─ Watchlist ─────────────┐  ┌─ Top Recommendation ─┐  │
│         │  │                         │  │                      │  │
│         │  │  BBCA  9.250   +1.37%   │  │  BBCA               │  │
│         │  │  BBRI  5.100   -0.58%   │  │  Bank Central Asia   │  │
│         │  │  TLKM  3.450   +0.87%   │  │  [BUY] Score: 88    │  │
│         │  │                         │  │                      │  │
│         │  │  [View All Stocks →]    │  │  Pertumbuhan kredit  │  │
│         │  │                         │  │  yang solid...       │  │
│         │  │                         │  │                      │  │
│         │  │                         │  │  [View All →]        │  │
│         │  └─────────────────────────┘  └──────────────────────┘  │
│         │                                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/(dashboard)/dashboard/page.tsx` — page with grid layout
- `src/components/dashboard/PortfolioSummaryCard.tsx` — ringkasan portfolio
- `src/components/dashboard/WatchlistWidget.tsx` — mini watchlist (reuse WatchlistWidget)
- `src/components/dashboard/TopRecommendationCard.tsx` — top 1 recommendation
- `src/components/dashboard/MarketOverviewCard.tsx` — IHSG summary

**API:**

- `GET /api/stocks/%5EJKSE` — IHSG index data (Yahoo Finance, real)
- `GET /api/portfolio/holdings` — for portfolio summary (MSW mock)
- `GET /api/recommendations` — for top recommendation (MSW mock)
- `GET /api/stocks/[code]` — per watchlist item (Yahoo Finance, real)

**Layout:**

- 2-column grid on desktop (`grid-cols-2`)
- 1-column stack on mobile (`grid-cols-1`)
- Each widget is a shadcn `Card`

**IHSG Note:**
Yahoo Finance code for IHSG is `^JKSE`. When calling the API route, URL-encode it: `/api/stocks/%5EJKSE`.

---

## 8. Landing Page (`/`)

**Wireframe:**

```
┌─────────────────────────────────────────────────────────┐
│  StockIDX                              [Sign In]        │
│                                                         │
│                                                         │
│          Track Indonesian Stocks                        │
│          with AI-Powered Insights                       │
│                                                         │
│          Monitor real-time stock prices, manage          │
│          your portfolio, and get daily                   │
│          recommendations powered by AI.                 │
│                                                         │
│          ┌─────────────────────────────┐                 │
│          │  🔵 Get Started with Google │                 │
│          └─────────────────────────────┘                 │
│                                                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │         [ Dashboard Screenshot / Mockup ]        │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│                                                         │
│  © 2026 StockIDX. All rights reserved.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Komponen:**

- `src/app/page.tsx` — landing page (no sidebar, no dashboard layout)
- Tidak pakai `(dashboard)/layout.tsx`, langsung under root layout

**Behavior:**

- Public page, no auth required
- "Get Started with Google" button → redirect ke `/login`
- If already authenticated → redirect ke `/dashboard`
- Screenshot bisa pakai placeholder image dulu

**Styling:**

- Centered content, max-width container
- Large heading, muted description text
- One CTA button (primary, large)
- Simple footer

---

## File Creation Summary

All files that need to be created (excluding already existing ones):

```
src/lib/risk-scoring.ts
src/lib/auth.ts
src/middleware.ts
src/app/page.tsx                                 — update existing
src/app/(auth)/login/page.tsx
src/app/(auth)/onboarding/page.tsx
src/app/(dashboard)/dashboard/page.tsx           — update existing
src/app/(dashboard)/stocks/page.tsx
src/app/(dashboard)/stocks/[code]/page.tsx
src/app/(dashboard)/portfolio/page.tsx
src/app/(dashboard)/recommendations/page.tsx
src/app/(dashboard)/chat/page.tsx
src/app/(dashboard)/settings/page.tsx
src/app/api/chat/route.ts
src/components/stocks/SectorFilter.tsx
src/components/stocks/StockSearch.tsx
src/components/stocks/StockDetail.tsx
src/components/stocks/TimeframeSelector.tsx
src/components/stocks/WatchlistButton.tsx
src/components/stocks/WatchlistWidget.tsx
src/components/charts/CandlestickChart.tsx
src/components/charts/AllocationPieChart.tsx
src/components/charts/BenchmarkComparisonChart.tsx
src/components/portfolio/PortfolioSummary.tsx
src/components/portfolio/HoldingsTable.tsx
src/components/portfolio/AddHoldingForm.tsx
src/components/portfolio/UnrealizedPnL.tsx
src/components/recommendations/RecommendationList.tsx
src/components/recommendations/DailyPickCard.tsx
src/components/recommendations/FilterBar.tsx
src/components/risk-profile/QuestionnaireForm.tsx
src/components/risk-profile/RiskScoreResult.tsx
src/components/risk-profile/StressTestCard.tsx
src/components/risk-profile/GoalBasedForm.tsx
src/components/chat/ChatWindow.tsx
src/components/chat/ChatMessage.tsx
src/components/chat/ChatInput.tsx
src/components/dashboard/PortfolioSummaryCard.tsx
src/components/dashboard/WatchlistWidget.tsx
src/components/dashboard/TopRecommendationCard.tsx
src/components/dashboard/MarketOverviewCard.tsx
src/hooks/usePortfolio.ts
src/hooks/useRecommendations.ts
src/hooks/useRiskProfile.ts
```
