# Granary — PRD & Architecture

> Personal IDX stock portfolio tracker. Browser-only data, Yahoo Finance for market quotes. Successor to the StockIDX scaffolding in this repo (legacy auth/onboard/settings/recommendations/dashboard removed).

## 1. Goals

- Replace the user's spreadsheet workflow for tracking IDX (`.JK`) stock activity: purchases, sales, dividends, current portfolio.
- Show real-time-ish market data and portfolio performance vs IHSG (`^JKSE`).
- Full local-first: all user data lives in the browser. CSV import/export for backup and migration.
- Single-user, no auth.

## 2. Out of scope (deferred — see [future-enhancements.md](future-enhancements.md))

- AI chat (provider selection + BYO API key) — architecture chosen, build deferred.
- Brokerage fees, IDX 0.1% final sell tax.
- Trailing stop.
- Multi-currency, non-IDX markets.
- Onboarding wizard, settings page, login, watchlist alerts.

## 3. Tech stack

| Layer          | Choice                                                                          | Notes                                                          |
| -------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19)                                               | Already configured. SSR not used; route handlers proxy Yahoo.  |
| Styling        | Tailwind v4 + shadcn/ui (`new-york`, `neutral`)                                 | Existing config kept.                                          |
| Server state   | TanStack Query (30s `refetchInterval` for prices)                               | Existing `Providers` setup kept.                               |
| Client state   | Zustand + `persist` middleware → localStorage                                   | Replaces MSW-backed mocks.                                     |
| Forms          | `react-hook-form` + `zod`                                                       | Kept.                                                          |
| Charts         | `recharts` (existing in `src/components/charts/`)                               | Donut for allocation, line for TWR vs IHSG.                    |
| Market data    | `yahoo-finance2` server-only via `/api/stocks/*` route handlers                 | Existing handlers kept.                                        |
| CSV            | `papaparse` (parse + unparse)                                                   | New dep.                                                       |
| Date utilities | `date-fns`                                                                      | New dep, used for TWR window math + Asia/Jakarta date parsing. |
| Theming        | `next-themes` (system default, fallback `dark`)                                 | Existing.                                                      |
| Toasts         | `sonner`                                                                        | Existing.                                                      |
| AI (deferred)  | `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, OpenCode community SDK | Lazy-loaded.                                                   |
| Deployment     | Self-host on Sumopod (VPS)                                                      | See [deploy-sumopod.md](deploy-sumopod.md).                    |

### Drops

- `better-auth`, `better-sqlite3` — no auth.
- `msw` and all of `src/mocks/` — no mocks.
- `IDX_STOCKS` and `SECTORS` constants in `lib/constants.ts` — Yahoo on-demand for symbol metadata.
- Files removed: `src/app/(dashboard)/{login,onboard,settings,chat,recommendations,dashboard}/`, `src/app/api/{auth,users,chat}/`, `src/components/{recommendations,risk-profile}/`, `src/lib/{auth,auth-client,risk-scoring}.ts`, `src/hooks/{useAuth,useRiskProfile}.ts`, MSW worker file `public/mockServiceWorker.js`.

## 4. Routing

5 nav entries (BottomNav on mobile, header on wider widths). All icons + labels.

| Route            | Purpose                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/`              | Redirect to `/portfolio`.                                                                                               |
| `/portfolio`     | Default landing. Summary + allocation chart + TWR-vs-IHSG + holdings table.                                             |
| `/purchases`     | Purchase history. Filter by issuer, sort by date desc default.                                                          |
| `/sales`         | Sales history. Filter by issuer, sort by sale date desc default.                                                        |
| `/dividends`     | Dividend history. Filter by issuer, sort by receipt date desc default.                                                  |
| `/watchlist`     | Search-driven watchlist. Yahoo search filtered to `.JK` results.                                                        |
| `/stocks/[code]` | Stock detail (chart, timeframe, watchlist add). Deep-link only — not in nav. Reached from holdings/watchlist row click. |

## 5. Data model

### 5.1 Records (source of truth)

Three transactional record types stored in localStorage. Portfolio is derived.

```ts
type UUID = string // crypto.randomUUID()

interface Purchase {
  id: UUID
  date: string // ISO YYYY-MM-DD
  code: string // e.g. "BBCA"
  price: number // IDR per share
  lots: number // 1 lot = 100 shares
}

interface Sale {
  id: UUID
  date: string // ISO sale date
  code: string
  price: number // sell price IDR per share
  lots: number
  costBasis: number // wavg-at-sale, auto-filled, user-editable
}

interface Dividend {
  id: UUID
  date: string // ISO receipt date
  code: string
  dps: number // dividend per share, IDR
}

interface WatchlistItem {
  code: string // primary key
  addedAt: string // ISO timestamp
}
```

### 5.2 Derivation rules

For any timestamp `t`, position state for stock `S`:

```
buys_t   = purchases where code = S and date <= t
sales_t  = sales where code = S and date <= t

qty_t        = (Σ buys_t.lots − Σ sales_t.lots) × 100   // shares
avgCost_t    = Σ(buys_t.lots × buys_t.price × 100) / (Σ buys_t.lots × 100)
              = Σ(buys.lots × buys.price) / Σ(buys.lots)
investedValue_t = qty_t × avgCost_t
marketValue_t   = qty_t × lastPrice
unrealizedPL_t  = marketValue_t − investedValue_t
```

Realized gain (lifetime, all sales of S):

```
realizedPL = Σ over sales of S of (sale.price − sale.costBasis) × sale.lots × 100
```

Net capital change shown in portfolio summary:

```
netCapitalChange = unrealizedPL_total + realizedPL_total + Σ dividends_total
```

Dividend per row (derived):

```
qtyHeld_at_receipt = qty at div.date
totalDividend      = qtyHeld_at_receipt × div.dps
yield              = div.dps / avgCost_at_receipt
purchaseValue      = qtyHeld_at_receipt × avgCost_at_receipt
```

### 5.3 Sale entry behavior

On opening "Add sale" form for stock `S`:

1. Auto-fill `costBasis` = current `avgCost` for `S` at chosen sale date.
2. User may edit if their broker statement shows different.
3. If `lots > qty_held_at_date / 100`: soft warning `"Sale exceeds holding by N lots — proceed?"` (does not block).

### 5.4 Edit cascade

- Editing or deleting a `Purchase` retroactively reshapes derived holdings, dividend yields, sale auto-fill values.
- **Delete a Purchase**: cascade-delete dependent Sales and Dividends for that stock, with export-first prompt.
- **Edit a Purchase**: no cascade; downstream rows just recompute. Soft-warn if any derived qty goes negative.
- Sale and Dividend edits/deletes do not cascade.

## 6. Storage

- One Zustand store per record type with `persist` to localStorage.
- Key namespace: `granary:*`

| Key                 | Contents                                 |
| ------------------- | ---------------------------------------- |
| `granary:purchases` | `Purchase[]`                             |
| `granary:sales`     | `Sale[]`                                 |
| `granary:dividends` | `Dividend[]`                             |
| `granary:watchlist` | `WatchlistItem[]`                        |
| `granary:settings`  | UI prefs (theme override, sort prefs)    |
| `granary:stockMeta` | Cache of Yahoo `{code → {name, sector}}` |

No migration from legacy `stockidx-watchlist`. Fresh start.

## 7. CSV import / export

### 7.1 Bundle format (multi-section CSV)

Single file. Sections separated by blank line + section marker. Excel will not round-trip cleanly — note in UI tooltip.

```
# section: purchases
id,date,code,price,lots
abc-123,2026-01-15,BBCA,9500,5
...

# section: sales
id,date,code,price,lots,costBasis
def-456,2026-03-22,PGAS,1750,10,1620
...

# section: dividends
id,date,code,dps
ghi-789,2026-04-10,BBCA,205
...
```

- Date format in CSV: ISO `YYYY-MM-DD`.
- Watchlist excluded from import/export.

### 7.2 Import flow

1. User selects file → parse with Papa Parse, sectioned read.
2. Dialog: **Append** (default) or **Overwrite**. If Overwrite, second prompt offers "Export current data first" before proceeding.
3. Validate rows. **If any row invalid → abort entire import, show error report.** No partial imports.
4. Validation rules:
   - `id` must be a UUID; if missing or duplicate within import, generate a fresh one.
   - Required fields non-empty.
   - `price`, `lots`, `dps` numeric, `> 0`.
   - `code` matches `/^[A-Z]{4}$/` (IDX ticker) — soft check, allow length 3–5 to be safe.
   - `date` parses as ISO `YYYY-MM-DD`.

### 7.3 Export flow

- One-click "Export bundle" → builds the multi-section CSV, downloads as `granary-YYYY-MM-DD.csv`.

## 8. Pages

### 8.1 `/portfolio` (default)

Sections (top to bottom on mobile):

1. **Summary card** — top-down order:
   - Total Invested (IDR, full)
   - Total Current Value (IDR, full)
   - **Net Capital Change** (IDR + %), color-coded
   - Realized Gain (IDR)
   - Total Dividends (IDR)
2. **Allocation chart** — donut. Default view: by issuer. Toggle: issuer ↔ sector. Slices have no labels; legend lists each entry with IDR + %. Sector lookup via `granary:stockMeta` cache, falls back to "Unknown".
3. **Performance vs IHSG** — TWR line chart. Two lines: Portfolio TWR, IHSG (`^JKSE`) cumulative return. Both indexed to 100 at window start. Window selector: `1M`, `3M`, `6M`, `YTD`, `1Y`, `ALL`. Default `1Y`. ALL = since first `Purchase.date`. Daily samples (close prices from Yahoo `/api/stocks/history`).
4. **Holdings table** — sortable columns. Click row → expand inline drill-down (purchases + sales + dividends for that stock). Click code link → `/stocks/[code]`.

   | Stock Code | Lots | Avg Cost | Last Price | Invested Value | Market Value | %Δ  | Allocation % |
   | ---------- | ---- | -------- | ---------- | -------------- | ------------ | --- | ------------ |

   Default sort: Stock Code asc.

### 8.2 `/purchases`

- Add button (top-right) opens form: Date, Code (Yahoo lookup autocomplete), Price, Lots.
- Filter: by Code (multi-select).
- Sort: Date desc default; toggleable to Code.
- Row columns: Date | Code | Price | Lots | Last Price | %Δ | Invested Value | Actions (Edit / Delete).
- Per-row Delete: simple confirm. Bulk Delete All: prompts export-first (cascades to dependent sales/dividends per §5.4).

### 8.3 `/sales`

- Add button → form: Date, Code (only codes with open holdings), Price, Lots, Cost Basis (auto-filled, editable).
- Filter: by Code. Sort: Sale Date desc default; toggle Code.
- Row columns: First-Buy Date | Sale Date | Code | Cost Basis | Lots | Purchase Value | Sell Price | Sell Value | %Δ | Capital Gain | Actions.
- Same per-row + bulk delete behavior.

### 8.4 `/dividends`

- Add button → form: Receipt Date, Code, DPS.
- Filter: by Code. Sort: Receipt Date desc default; toggle by Yield % or Total Dividend.
- Row columns: Receipt Date | Code | Avg Cost (at date) | Lots Held | Purchase Value | DPS | Yield % | Total Dividend | Actions.

### 8.5 `/watchlist`

- Search input (Yahoo `/api/stocks/search?q=...&suffix=.JK`) → autocomplete dropdown of `.JK` results.
- Selecting a result adds to watchlist.
- Watchlist rows: Code | Name | Last Price | %Δ today | Remove.
- Click row → `/stocks/[code]`.

### 8.6 `/stocks/[code]`

Existing implementation kept (StockDetail, TimeframeSelector, CandlestickChart, watchlist add button). Verify it works with on-demand Yahoo lookups (no `IDX_STOCKS` dependency).

## 9. Cross-cutting

### 9.1 Number formatting

- Tables: compact (`formatCompactNumber` → `1.5M IDR`).
- Summary cards + tooltips + edit forms: full precision (`formatCurrency`).

### 9.2 Date formatting

- Display: `DD/MM/YYYY` (Indonesian).
- Storage and CSV: ISO `YYYY-MM-DD`.
- Time zone: Asia/Jakarta. Records are calendar dates only; no time-of-day.

### 9.3 Theme

- `next-themes` `defaultTheme="system"`. If system preference cannot be determined, fall back to `dark`. User toggle in header persists override.

### 9.4 Refresh

- TanStack Query `refetchInterval: 30_000` for stock prices.
- Pause when tab hidden (TanStack default behavior with `refetchOnWindowFocus: true`).

### 9.5 Empty state

- First-run: opens an onboarding modal explaining "Import CSV bundle" vs "Add transactions manually". Modal can be dismissed; never reappears (flag in `granary:settings`).

### 9.6 Stock metadata

- Yahoo `quoteSummary.assetProfile` for sector + name. Cache hits in `granary:stockMeta`. On first encounter of a new code (via add-purchase form, watchlist add, etc.), fetch + cache. Sector unknown → label "Unknown".
- Yahoo `search()` for ticker lookup. Filter results to those ending `.JK`.

### 9.7 Validation

- All forms use `zod` schemas matching the type definitions in §5.1.
- Sale `lots > heldLots` → soft warn (per §5.3).
- Cascade delete preview: "This will also delete N sales and M dividends" before confirming.

## 10. Implementation phasing

Disposal is hybrid (per Q34 grill answer):

### Phase 0 — Cleanup PR

- Delete: `(dashboard)/{login,onboard,settings,chat,recommendations,dashboard}`, `api/{auth,users,chat}`, `components/{recommendations,risk-profile}`, `lib/{auth,auth-client,risk-scoring}.ts`, `mocks/`, `useAuth`, `useRiskProfile`, `IDX_STOCKS`, `SECTORS`, `public/mockServiceWorker.js`.
- Drop deps: `better-auth`, `better-sqlite3`, `msw`.
- Remove MSW initialization in `Providers`.
- Rename brand to "Granary" in metadata, `package.json`, page titles.
- Replace stale docs with this PRD set.

### Phase 1 — Data layer

- `papaparse`, `date-fns` deps.
- Zustand stores: `usePurchases`, `useSales`, `useDividends`, `useWatchlist` (new key namespace).
- `lib/portfolio.ts` derivation utilities (qty, avg cost, realized PL, dividend joins).
- `lib/csv.ts` multi-section bundle parser/serializer.

### Phase 2 — Pages

- `/portfolio` summary + allocation chart + holdings table (no TWR yet).
- `/purchases`, `/sales`, `/dividends` with add/edit/delete + CSV bundle import/export shared component.

### Phase 3 — Charts

- TWR vs IHSG with daily-close fetch loop. Allocation toggle (issuer/sector).

### Phase 4 — Watchlist

- Yahoo search component (`.JK` filter), watchlist page + store.

### Phase 5 — Polish

- Onboarding modal, theme toggle in header, drill-down accordion on holdings, soft-warn dialogs, cascade-delete preview.

### Phase 6 — Deferred

- AI chat (see future-enhancements).
