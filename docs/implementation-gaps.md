# Implementation Gaps — `pages-implementation-guide.md` vs. Codebase

> **Snapshot as of 2026-04-23.** Re-run the audit before acting on it; pages may have moved out of "stub" status since.
>
> Companion to [pages-implementation-guide.md](pages-implementation-guide.md). Status of every documented page, route, hook, and component.

## High-level scorecard

| Area               | Status                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Pages (App Router) | 10/10 routes exist, but **5 are stubs / partials**                                          |
| API Route Handlers | Stocks ✅ · Auth ✅ · Users/me ✅ · **Chat ❌ (route missing)**                             |
| MSW handlers       | 5/5 ✅ (portfolio, recommendations, risk-profile, watchlist, user)                          |
| Hooks              | 4/5 (`useRiskProfile` **missing**; `useUpdateHolding` **missing**)                          |
| Components         | ~18 of ~40 implemented (~45%); biggest gaps in chat, risk-profile result, portfolio, charts |
| Cross-cutting libs | `middleware.ts`, `lib/risk-scoring.ts` **both missing**                                     |

---

## Section-by-section gaps

### 1. Authentication

#### 1a. Login (`/login`)

- ✅ Page exists at [../src/app/(dashboard)/login/page.tsx](<../src/app/(dashboard)/login/page.tsx>) and uses Better Auth Google provider.
- ⚠️ **Route group drift**: doc says `(auth)/login`, actual is `(dashboard)/login`. Cosmetic, but means login inherits the `Header`/`BottomNav` from the dashboard layout.
- ❌ **`src/middleware.ts` missing** — no route protection. Doc requires redirecting unauthenticated users to `/login` and authenticated users away from `/login` → `/dashboard`.
- ❌ **Better Auth onboarding redirect callback** — [../src/lib/auth.ts](../src/lib/auth.ts) has no `callbacks` field that sends new users to `/onboarding`.

#### 1b. Onboarding (`/onboarding`)

- ⚠️ Path drift: doc says `/onboarding`, actual is [../src/app/(dashboard)/onboard/page.tsx](<../src/app/(dashboard)/onboard/page.tsx>).
- ❌ **`QuestionnaireForm` is an empty shell** — see [../src/components/risk-profile/QuestionnaireForm.tsx](../src/components/risk-profile/QuestionnaireForm.tsx) (24 lines, empty `<form>`, `console.log`-only submit). All 5 questionnaire steps and the scoring logic are unimplemented.
- ❌ **`src/lib/risk-scoring.ts` missing** — no scoring (rawScore → normalizedScore → conservative/moderate/aggressive bucket), no stress-test, no goal-based math.
- ⚠️ Progress bar in the page is hardcoded to 40%.

### 2. Stock Data Pages

#### 2a. Stock List / Screener (`/stocks`)

- ✅ Page, `StockList`, `SectorFilter` exist; `useStocks` and `useStockSearch` hooks present.
- ❌ **`src/components/stocks/StockSearch.tsx` missing** — search input is inlined in the page rather than the documented dedicated component.

#### 2b. Stock Detail (`/stocks/[code]`)

- ✅ Page wires `StockDetail`, `TimeframeSelector`, `WatchlistButton`, `CandlestickChart`, plus `useStockDetail` / `useStockHistory`.
- (Looks complete on paper — verify rendering quality manually if treating this as "done".)

#### 2c. Watchlist Widget

- ✅ `WatchlistWidget` exists at [../src/components/dashboard/WatchlistWidget.tsx](../src/components/dashboard/WatchlistWidget.tsx) (doc placed it under `stocks/`, but functionally fine).
- ✅ `useWatchlistStore` Zustand+localStorage store implemented.

### 3. Portfolio Tracker (`/portfolio`)

- ⚠️ [../src/app/(dashboard)/portfolio/page.tsx](<../src/app/(dashboard)/portfolio/page.tsx>) renders **only `SummaryCard`**; `Holdings`, `AllocationChart`, `PerformanceVsIhsg` are commented out.
- ❌ Components missing: `HoldingsTable.tsx`, `AddHoldingForm.tsx`, `UnrealizedPnL.tsx`, and the `PortfolioSummary.tsx` from the doc (only `SummaryCard.tsx` exists in [../src/components/portfolios/](../src/components/portfolios/) — note the dir is `portfolios/` plural, doc says `portfolio/`).
- ❌ Charts missing: `AllocationPieChart.tsx`, `BenchmarkComparisonChart.tsx`.
- ⚠️ [../src/hooks/usePortfolio.ts](../src/hooks/usePortfolio.ts) has `usePortfolio`, `useAddHolding`, `useDeleteHolding` — **`useUpdateHolding` is missing** (the MSW PUT handler exists but is unused).

### 4. Risk Profile & Settings (`/settings`)

- ❌ [../src/app/(dashboard)/settings/page.tsx](<../src/app/(dashboard)/settings/page.tsx>) is a **"Coming soon" stub**.
- ❌ Components missing: `RiskScoreResult.tsx`, `StressTestCard.tsx`, `GoalBasedForm.tsx`.
- ❌ Hook missing: **`src/hooks/useRiskProfile.ts`** (`useRiskProfile`, `useSaveRiskProfile`).
- ❌ `src/lib/risk-scoring.ts` missing (also blocks section 1b — same file).
- ⚠️ MSW handler `risk-profile.ts` exists, but `src/mocks/data/risk-profiles.json` is **missing** (state lives in-memory only).

### 5. Recommendations (`/recommendations`)

- ✅ Page exists and wires filter + list + signal/sector state.
- ⚠️ Naming drift only: `RecommendationsList.tsx` (doc: `RecommendationList.tsx`), and `FilterBar.tsx` is split into `RecommendationFilter.tsx` + `SectorFilterRecommendations.tsx`.
- ✅ MSW handler filters by signal/sector and sorts by score desc as documented.

### 6. AI Chat (`/chat`)

- ❌ [../src/app/(dashboard)/chat/page.tsx](<../src/app/(dashboard)/chat/page.tsx>) is a **"Coming soon" stub**.
- ❌ **`src/app/api/chat/route.ts` missing** — directory exists but is empty. No Vercel AI SDK streaming endpoint.
- ❌ Components missing: `ChatWindow.tsx`, `ChatMessage.tsx`, `ChatInput.tsx` (entire `src/components/chat/` directory absent).
- ⚠️ `@ai-sdk/google` and `ai` are installed in [../package.json](../package.json), but unused.
- ⚠️ Env var `GOOGLE_GENERATIVE_AI_API_KEY` not present in `.env.local`.

### 7. Dashboard (`/dashboard`)

- ✅ Page exists at [../src/app/(dashboard)/dashboard/page.tsx](<../src/app/(dashboard)/dashboard/page.tsx>) and renders 4 widgets.
- ⚠️ Component naming drift (functionality may be there): `PortfolioWidget` (doc: `PortfolioSummaryCard`), `RecommendationWidget` (doc: `TopRecommendationCard`), `MarketOverview` (doc: `MarketOverviewCard`).
- ⚠️ Dashboard relies on the **dev-shim `useAuth` Zustand store**, not the real Better Auth session — won't reflect actual login status until wired up.

### 8. Landing Page (`/`)

- ✅ [../src/app/page.tsx](../src/app/page.tsx) exists with hero + CTA + auth-aware routing.

---

## Cross-cutting items (not in any one section)

| Missing                                                                          | Where it bites                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| `src/middleware.ts`                                                              | All protected routes (every page except `/`, `/login`)           |
| `src/lib/risk-scoring.ts`                                                        | Sections 1b (questionnaire) and 4 (settings stress test + goals) |
| `src/hooks/useRiskProfile.ts`                                                    | Sections 1b and 4                                                |
| `src/app/api/chat/route.ts`                                                      | Section 6                                                        |
| `src/components/chat/*` (3 files)                                                | Section 6                                                        |
| `src/components/risk-profile/{RiskScoreResult,StressTestCard,GoalBasedForm}.tsx` | Sections 1b, 4                                                   |
| `src/components/portfolio/{HoldingsTable,AddHoldingForm,UnrealizedPnL}.tsx`      | Section 3                                                        |
| `src/components/charts/{AllocationPieChart,BenchmarkComparisonChart}.tsx`        | Section 3                                                        |
| `src/components/stocks/StockSearch.tsx`                                          | Section 2a                                                       |
| `useUpdateHolding` mutation in `usePortfolio.ts`                                 | Section 3 (edit holding)                                         | \*\*\*\* |
| Better Auth `redirect to /onboarding` callback                                   | Section 1a                                                       |
| `src/mocks/data/risk-profiles.json`                                              | Risk profile persists only in memory between MSW worker restarts |

---

## Suggested priority

1. **Unblock the questionnaire flow** — `lib/risk-scoring.ts` + flesh out `QuestionnaireForm.tsx` + add `useRiskProfile` hook. This unlocks both `/onboard` and `/settings`.
2. **Settings page** — `RiskScoreResult`, `StressTestCard`, `GoalBasedForm`. Reuses #1.
3. **Portfolio page** — `HoldingsTable`, `AddHoldingForm`, `AllocationPieChart`, `BenchmarkComparisonChart`, plus `useUpdateHolding`.
4. **Chat** — `api/chat/route.ts` + 3 chat components + add `GOOGLE_GENERATIVE_AI_API_KEY`.
5. **Auth hardening** — `middleware.ts` + Better Auth onboarding redirect callback. (Lower urgency in dev because the dev-shim `useAuth` masks the issue, but required before shipping.)

## How to re-verify

- Run `npm run dev` and visit `/chat`, `/settings`, `/onboard` → if any still render placeholder/empty content, that section is still incomplete.
- `find src -name "risk-scoring.ts" -o -name "middleware.ts" -o -name "useRiskProfile.ts"` from `frontend/` — empty output means those files are still missing.
- `ls src/app/api/chat` from `frontend/` — empty means the chat route handler still isn't there.
