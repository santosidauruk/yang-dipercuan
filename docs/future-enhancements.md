# Future Enhancements

Items deliberately out of v1 scope (see [prd.md](prd.md) §2). Each section is a self-contained mini-spec for when the work is picked up.

## 1. Brokerage fees

Indonesian brokers charge buy/sell fees (~0.15–0.25% buy, ~0.25–0.35% sell, varies per broker). Affects net cost basis and capital gain accuracy.

### Approach

Add per-transaction fee fields. User-entered, no auto-calculation.

```ts
interface Purchase {
  // ...existing fields
  fee?: number // IDR, optional
}

interface Sale {
  // ...existing fields
  fee?: number // IDR, optional
}
```

### Derivation changes

```
investedValueWithFees = Σ((buy.price × buy.lots × 100) + buy.fee)
avgCostWithFees       = investedValueWithFees / (Σ buy.lots × 100)
realizedPLNet         = Σ((sale.price × sale.lots × 100 − sale.fee) − (sale.costBasis × sale.lots × 100 + allocated_buy_fee))
```

`allocated_buy_fee` = pro-rata share of the wavg buy fee for the lots being sold. Compute it the same way `costBasis` is auto-filled today.

### UI

- Optional "Fee (IDR)" field on purchase/sale forms; defaults to 0.
- Toggle in summary card: "Show fees impact" (off by default to keep parity with v1 mental model).

### Migration

Existing records have no `fee`. Treat as `0`. No schema break.

---

## 2. IDX 0.1% final sell tax

IDX charges 0.1% final tax on every sell transaction (debited at trade settlement). Reduces net proceeds.

### Approach

When fees ship (§1 above), make tax automatic:

```ts
saleNetProceeds = sale.price × sale.lots × 100 × (1 − 0.001) − sale.fee
```

Configurable rate in `granary:settings` for forward-compatibility (regulator may change rate).

### UI

- Hidden field, applied silently.
- Show line item in expanded sale row: "Final tax (0.1%): −Rp X".

---

## 3. Trailing stop

Per-purchase stop price for risk management. Two implementation paths discussed during PRD grill:

### Option A — static field (recommended for first ship)

Add column to `Purchase`:

```ts
trailingStop?: number   // IDR per share, optional
```

UI: column in `/purchases` table. Highlight row if `lastPrice <= trailingStop`. No auto-update logic.

### Option B — true trailing (future-future)

Track high-water mark per holding via daily Yahoo close samples; stop ratchets up but never down. Requires:

- New store: `granary:trailingHighWaterMarks` keyed by code.
- Background poller updating high-water marks against latest close.
- User enters trailing % rather than absolute price.

Defer Option B until users ask for it.

---

## 4. AI chat (architecture decided, build deferred)

### Scope

Chat interface to ask questions about the user's portfolio and watchlist using their own LLM API key.

### Architecture

- **Client-side direct calls only.** No server proxy. API keys never leave the user's browser.
- **Provider picker** with lazy-loaded SDKs per choice:
  | Provider | Package |
  | ---------- | -------------------------------- |
  | OpenAI | `@ai-sdk/openai` |
  | Anthropic | `@ai-sdk/anthropic` |
  | Google | `@ai-sdk/google` |
  | OpenCode | `ai-sdk-provider-opencode-sdk` |

  Add Sumopod (and other OpenAI-compatible endpoints) later via `@ai-sdk/openai-compatible` with custom `baseURL`.

- **API key storage:** `granary:settings.aiKeys[provider]` in localStorage. Show clear warning that keys are stored in plain text in the browser.
- **Chat history persistence:** ephemeral. Cleared on tab/session close. Show one-time info notice on `/chat` first load: "Conversations are not saved. Reloading clears history."

### Context strategy — hybrid

System prompt receives a small portfolio summary plus tool definitions for drill-down.

#### System prompt summary template

```
Portfolio: {N} holdings, total value {value} IDR, invested {invested} IDR ({pct}%).
Holdings: {comma-separated stock codes}.
Top 3 by value: {code} ({value}), {code} ({value}), {code} ({value}).
Watchlist: {comma-separated stock codes}.
Recent activity: last buy {date} ({code}), last sale {date} ({code}).
Dividends YTD: {total} IDR across {N} stocks.
```

#### Tools exposed to model

| Tool                               | Returns                                        |
| ---------------------------------- | ---------------------------------------------- |
| `getHoldings()`                    | Full holdings array with derived fields.       |
| `getWatchlist()`                   | Watchlist with current prices.                 |
| `getPurchases({ code? })`          | Purchase rows, optionally filtered by code.    |
| `getSales({ code? })`              | Sale rows, optionally filtered.                |
| `getDividends({ code? })`          | Dividend rows, optionally filtered.            |
| `getStockHistory({ code, range })` | Yahoo daily closes for context on price moves. |

All tools resolve client-side from Zustand stores or `/api/stocks/*` route handlers.

### Routing

- Adds 6th nav entry `/chat`.
- BottomNav layout already supports 6 (will need verification on narrow widths).

### UI

- Provider + model dropdown in chat header.
- API key input (masked), per provider, saved on blur.
- Standard chat layout: message list + composer.
- Streaming responses via Vercel AI SDK `streamText`.

---

## 5. Other backlog

- **Watchlist alerts** — price/% change thresholds with browser notifications.
- **Multi-currency** — only relevant if user wants to track non-`.JK` stocks.
- **Mobile PWA / offline mode** — service worker + cache strategy. Records already local; only needs cached quote fallback.
- **Tax reports** — annual capital gain and dividend summaries, possibly CSV/PDF export.
- **Sample dataset toggle** — "Try with example data" for demos.
- **Per-stock detail enhancements** — fundamentals, earnings dates, dividend calendar.
