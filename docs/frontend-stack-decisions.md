# Frontend Stack Decisions

Dokumen ini berisi opsi-opsi tech stack untuk frontend beserta reasoning pemilihan.

---

## 1. Framework

### Opsi

| Option                      | Pros                                                                          | Cons                                                                              |
| --------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Next.js 15 (App Router)** | RSC, server actions, file-based routing, massive ecosystem, Vercel deployment | Opinionated, vendor lock-in ke Vercel untuk optimal DX, learning curve App Router |
| **Remix**                   | Nested routing, loader/action pattern bagus, web standards focused            | Ecosystem lebih kecil, community lebih kecil, kurang populer untuk hiring signal  |
| **Astro + React**           | Partial hydration, sangat cepat untuk content-heavy                           | Kurang cocok untuk highly interactive app seperti stock dashboard                 |
| **Vite + React (SPA)**      | Simple, cepat dev server, full kontrol                                        | Tidak ada SSR out of the box, SEO manual, no server actions                       |

### Keputusan: **Next.js 15 (App Router)**

**Reasoning:**

1. **React Server Components (RSC)** — Fitur ini sangat relevan untuk stock app. Data saham yang tidak sering berubah (profil perusahaan, laporan keuangan) bisa di-render di server tanpa mengirim JS ke client. Ini mengurangi bundle size secara signifikan.
2. **Server Actions** — Untuk form submission seperti questionnaire profil risiko, input holdings, dan CRUD watchlist, server actions menghilangkan kebutuhan membuat API route terpisah untuk operasi sederhana.
3. **File-based routing** — Struktur halaman stock app cukup predictable (`/dashboard`, `/stocks/[code]`, `/portfolio`, `/chat`), file-based routing membuat navigasi project lebih intuitif.
4. **Streaming & Suspense** — Dashboard stock yang punya banyak widget (chart, watchlist, portfolio summary) bisa di-stream satu per satu, user tidak perlu tunggu semua data ready.
5. **Middleware** — Auth protection di edge, redirect unauthenticated users, sangat berguna untuk protected routes.
6. **Ecosystem & Community** — Library paling banyak yang sudah support App Router. Dokumentasi lengkap. Kalau stuck, mudah cari solusi.
7. **Learning value** — App Router adalah paradigma baru React. Menguasainya memberikan nilai tinggi untuk karir sebagai frontend engineer.

**Kenapa bukan Remix?**
Remix bagus untuk web standards, tapi ecosystem-nya lebih kecil. Untuk app yang butuh banyak third-party library (charting, form, auth), Next.js punya dukungan yang jauh lebih luas.

**Kenapa bukan SPA (Vite)?**
App ini public-facing dan butuh SEO untuk halaman-halaman tertentu (stock detail pages). Pure SPA mempersulit SEO dan initial load performance.

---

## 2. Styling

### Opsi

| Option                               | Pros                                                                                     | Cons                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Tailwind CSS + shadcn/ui**         | Utility-first, copy-paste components (own the code), highly customizable, tree-shakeable | Verbose className, learning curve utility classes                 |
| **Tailwind CSS + Radix UI (manual)** | Full control styling, accessible primitives                                              | Harus style semua sendiri, lebih lambat development               |
| **Chakra UI**                        | Batteries included, good DX, accessible                                                  | Bundle size besar, opinionated theming, runtime CSS-in-JS         |
| **Material UI (MUI)**                | Komponen lengkap, mature                                                                 | Sangat opinionated (Google design), heavy bundle, sulit customize |
| **CSS Modules**                      | Zero runtime, scoped CSS, simple                                                         | Tidak ada component library, semua dari nol                       |

### Keputusan: **Tailwind CSS + shadcn/ui**

**Reasoning:**

1. **Own the code** — shadcn/ui bukan dependency yang di-install. Komponen di-copy ke project kita. Ini berarti kita bisa modify seenaknya tanpa fighting against library API. Untuk stock app yang butuh UI custom (chart containers, dashboard layout), ini sangat penting.
2. **Accessible by default** — shadcn/ui dibangun di atas Radix UI primitives. Dialog, dropdown, tooltip semua sudah handle keyboard navigation dan screen reader tanpa effort tambahan.
3. **Tailwind = konsistensi** — Dengan design token di `tailwind.config`, warna, spacing, dan typography konsisten di seluruh app. Penting untuk financial app yang harus terlihat professional.
4. **Performance** — Tailwind di-purge saat build, hanya CSS yang dipakai yang masuk bundle. Tidak ada runtime overhead seperti CSS-in-JS solutions.
5. **Dark mode** — Financial app hampir wajib punya dark mode (trader suka dark theme). Tailwind `dark:` prefix membuat implementasi dark mode trivial.
6. **Community & templates** — Banyak template dashboard dan financial UI yang sudah dibuat dengan Tailwind + shadcn. Bisa jadi referensi.

**Kenapa bukan Chakra/MUI?**
Keduanya adalah runtime CSS-in-JS yang menambah overhead. Untuk app dengan banyak data points (stock prices, chart), setiap byte performa penting. Selain itu, keduanya sangat opinionated — customisasi untuk look & feel financial app akan melawan design system mereka.

---

## 3. State Management

### Opsi

| Option                         | Pros                                                             | Cons                                                           |
| ------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| **Zustand**                    | Minimal API (~1KB), no provider needed, TypeScript-first         | Kurang structured untuk app besar                              |
| **Jotai**                      | Atomic state, bottom-up, bagus untuk independent pieces of state | Kurang intuitive untuk complex derived state                   |
| **Redux Toolkit (RTK)**        | Mature, predictable, great devtools, middleware                  | Boilerplate masih lebih banyak, overkill untuk kebanyakan case |
| **React Context + useReducer** | Built-in, no dependency                                          | Performance issues (re-render seluruh tree), tidak scalable    |

### Keputusan: **Zustand**

**Reasoning:**

1. **Simplicity** — Stock app punya beberapa global state yang jelas: selected stock, watchlist state, portfolio state, user preferences (theme, chart settings). Zustand handle ini dengan minimal code.
2. **No provider hell** — Tidak perlu wrap app dengan `<Provider>`. Import store, pakai. Selesai. Ini mengurangi complexity di layout files Next.js.
3. **Selective re-render** — `useStore(state => state.selectedStock)` hanya re-render komponen yang subscribe ke `selectedStock`. Untuk dashboard dengan banyak widget, ini krusial untuk performance.
4. **Middleware built-in** — `persist` middleware untuk save state ke localStorage (watchlist, preferences), `devtools` untuk debugging. Tidak perlu tambah library lain.
5. **Size** — ~1KB gzipped. Untuk public-facing app, setiap KB counts.
6. **Compatibility dengan RSC** — Zustand bekerja baik dengan Next.js App Router karena tidak butuh provider di root layout.

**Kenapa bukan Redux?**
Redux Toolkit sudah jauh lebih baik dari Redux lama, tapi untuk scope app ini, Zustand memberikan 90% kapabilitas dengan 10% boilerplate. Redux lebih masuk akal kalau ada complex middleware chains atau time-travel debugging yang critical.

**Kenapa bukan React Context?**
Context re-render semua consumer ketika value berubah. Untuk dashboard yang punya 10+ widgets, ini akan menyebabkan performance issues yang noticeable.

---

## 4. Data Fetching & Server State

### Opsi

| Option                           | Pros                                                                    | Cons                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **TanStack Query (React Query)** | Cache, background refetch, optimistic updates, infinite query, devtools | Tambahan dependency, learning curve                                                         |
| **SWR**                          | Simple, lightweight, stale-while-revalidate                             | Kurang fitur dibanding TanStack Query (no mutation tracking, no infinite query yang robust) |
| **Next.js fetch + cache**        | Built-in, no dependency, integrated dengan RSC                          | API masih evolving, kurang flexible untuk complex caching                                   |
| **tRPC**                         | End-to-end type safety, no API contract needed                          | Coupling frontend-backend, kurang cocok untuk microservices                                 |

### Keputusan: **TanStack Query**

**Reasoning:**

1. **Background refetching** — Stock prices dan portfolio values berubah terus. TanStack Query bisa auto-refetch di background dengan `refetchInterval`, user selalu lihat data terbaru tanpa manual refresh.
2. **Cache management** — Ketika user navigasi dari stock list ke stock detail lalu back, data sudah di-cache. Tidak perlu loading lagi. `staleTime` dan `gcTime` bisa di-tune per query.
3. **Optimistic updates** — Ketika user tambah saham ke watchlist, UI langsung update tanpa tunggu server response. Kalau gagal, auto rollback. UX yang smooth untuk frequent interactions.
4. **Query invalidation** — Setelah user input holding baru, invalidate portfolio query supaya P&L recalculate. Dependency graph antar queries sangat explicit.
5. **Devtools** — Visual devtools untuk inspect semua cached queries. Sangat membantu saat debugging data staleness issues.
6. **Infinite queries** — Untuk load historical stock data atau chat history, infinite scroll pattern sudah built-in.

**Kenapa bukan SWR?**
SWR bagus untuk simple cases, tapi stock app butuh fitur advanced: mutation tracking, query invalidation chains, dan optimistic updates yang robust. TanStack Query unggul di semua area ini.

**Kenapa bukan tRPC?**
Backend kita microservices. tRPC mengasumsikan frontend dan backend dalam satu monorepo dengan shared types. Ini tidak cocok dengan arsitektur kita yang tiap service independent.

---

## 5. Charting — Stock/Financial

### Opsi

| Option                               | Pros                                                                                                      | Cons                                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Lightweight Charts (TradingView)** | Purpose-built untuk financial charts, free & open source, small bundle (~40KB), canvas-based (performant) | Kurang customizable dibanding D3, fitur terbatas dibanding TradingView full                                  |
| **TradingView Widget (embedded)**    | Full-featured, professional grade                                                                         | Tidak self-hosted, dependency ke TradingView, limited customization, branding                                |
| **D3.js**                            | Unlimited customization, SVG-based                                                                        | Harus build candlestick chart dari nol, steep learning curve, SVG kurang performant untuk banyak data points |
| **Recharts / Chart.js**              | Simple API, banyak chart types                                                                            | Tidak ada candlestick built-in, tidak didesain untuk financial data                                          |

### Keputusan: **Lightweight Charts (TradingView)**

**Reasoning:**

1. **Purpose-built** — Library ini dibuat khusus untuk financial charts. Candlestick, volume bars, area charts semua sudah ada. Tidak perlu reinvent the wheel.
2. **Performance** — Canvas-based rendering. Ketika menampilkan ribuan data points (historical stock data berbulan-bulan), canvas jauh lebih performant dibanding SVG (D3/Recharts).
3. **Bundle size** — ~40KB gzipped. Sangat kecil untuk apa yang ditawarkan. Bandingkan dengan D3 yang bisa 70KB+ dan masih harus build dari nol.
4. **Interactivity built-in** — Zoom, pan, crosshair, tooltip semua sudah ada. Untuk financial chart, interactivity ini essential dan complex untuk build sendiri.
5. **Realtime ready** — API `update()` untuk push data baru ke chart tanpa re-render seluruh chart. Perfect untuk WebSocket price updates.
6. **Free & open source** — Apache 2.0 license. Tidak ada branding watermark atau usage limits.

**Kenapa bukan TradingView Widget?**
Widget embed menampilkan branding TradingView dan membatasi customisasi. Kita mau chart yang terintegrasi seamless dengan design system kita sendiri.

**Kenapa bukan D3?**
D3 terlalu low-level untuk use case ini. Membuat candlestick chart yang proper dengan zoom, crosshair, dan realtime update di D3 bisa memakan waktu berminggu-minggu. Lightweight Charts memberikan semua itu out of the box.

---

## 6. Charting — General (Pie Chart, Line Chart, Bar Chart)

### Opsi

| Option                         | Pros                                                 | Cons                                                            |
| ------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------- |
| **Recharts**                   | Declarative API, React-native, composable, good docs | SVG-based (kurang performa untuk data besar), bundle agak besar |
| **Chart.js + react-chartjs-2** | Canvas-based, performant, banyak chart types         | API kurang React-idiomatic, wrapper library kadang lagging      |
| **Nivo**                       | Beautiful defaults, banyak chart types, responsive   | Bundle besar, kadang over-engineered untuk simple charts        |
| **Victory**                    | React-native support, composable                     | Kurang populer, docs kurang lengkap                             |

### Keputusan: **Recharts**

**Reasoning:**

1. **Declarative & composable** — `<PieChart><Pie data={allocation} /></PieChart>`. Sangat React-idiomatic. Mudah dibaca dan di-maintain.
2. **Use case fit** — General charts kita (asset allocation pie, P&L line, benchmark comparison) tidak punya ribuan data points. SVG-based rendering dari Recharts lebih dari cukup performant.
3. **Customizable** — Warna, label, tooltip, legend semua bisa di-customize untuk match design system kita.
4. **Responsive** — `<ResponsiveContainer>` otomatis resize chart sesuai parent container. Penting untuk dashboard layout.
5. **Lightweight** — Dibanding Nivo yang membawa banyak dependency, Recharts lebih lean untuk chart types yang kita butuhkan.

---

## 7. Form Management

### Opsi

| Option                        | Pros                                                            | Cons                                                 |
| ----------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| **React Hook Form + Zod**     | Performant (uncontrolled), minimal re-render, schema validation | Dua library terpisah                                 |
| **Formik + Yup**              | Mature, widely used                                             | Controlled inputs = more re-renders, Yup API verbose |
| **React Hook Form + Yup**     | Performant + familiar validation                                | Yup kurang type-safe dibanding Zod                   |
| **Native forms (no library)** | Zero dependency                                                 | Boilerplate untuk validation, error handling manual  |

### Keputusan: **React Hook Form + Zod**

**Reasoning:**

1. **Performance** — React Hook Form menggunakan uncontrolled inputs by default. Form questionnaire profil risiko yang punya 10+ fields tidak akan re-render setiap keystroke. Ini noticeable performance difference dibanding Formik.
2. **Zod = TypeScript-first** — Schema Zod bisa di-infer jadi TypeScript type. Define sekali, dapat validation + type. Ini menghilangkan duplikasi antara type definition dan validation logic.
3. **Server-side reuse** — Zod schema yang sama bisa dipakai di server actions Next.js untuk validasi server-side. Single source of truth untuk validation rules.
4. **Small bundle** — React Hook Form ~9KB, Zod ~13KB. Total ~22KB untuk complete form + validation solution.
5. **Use cases yang jelas:**
   - Risk profile questionnaire (multi-step form)
   - Input holdings (stock code, price, quantity validation)
   - Watchlist notes
   - Chat input

**Kenapa bukan Formik?**
Formik menggunakan controlled inputs yang menyebabkan re-render setiap keystroke. Untuk form yang complex seperti multi-step questionnaire, ini bisa terasa sluggish.

---

## 8. Authentication

### Opsi

| Option                           | Pros                                                                       | Cons                                                   |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| **NextAuth.js (Auth.js) v5**     | Built for Next.js, banyak providers, session management, database adapters | Versi 5 masih relatively new, breaking changes dari v4 |
| **Clerk**                        | Beautiful UI, hosted solution, banyak fitur (MFA, user management)         | Paid untuk scale, vendor lock-in, external dependency  |
| **Supabase Auth**                | Free tier generous, PostgreSQL integrated                                  | Coupling ke Supabase ecosystem                         |
| **Custom (jose + oauth4webapi)** | Full control, no dependency                                                | Harus handle semua edge cases sendiri, security risk   |

### Keputusan: **NextAuth.js (Auth.js) v5**

**Reasoning:**

1. **Native Next.js integration** — Middleware support untuk protect routes di edge, `auth()` helper di server components, `useSession()` di client components. Semua pattern sudah dioptimalkan untuk Next.js App Router.
2. **Google provider built-in** — `GoogleProvider({ clientId, clientSecret })` dan selesai. OAuth flow, token refresh, semua di-handle.
3. **Database adapter** — Prisma adapter untuk simpan user data ke PostgreSQL auth service kita. Session bisa di-store di database untuk invalidation capability.
4. **Free & open source** — Tidak ada per-user pricing. Untuk public app yang bisa scale, ini penting.
5. **JWT + Session hybrid** — Bisa pakai JWT untuk stateless auth ke microservices backend, sambil tetap punya database session untuk revocation.
6. **Learning value** — Memahami OAuth flow secara detail (authorization code, PKCE, token rotation) lebih valuable daripada pakai hosted solution seperti Clerk yang abstract semuanya.

**Kenapa bukan Clerk?**
Clerk excellent untuk rapid prototyping, tapi untuk app ini tujuannya belajar. Clerk meng-abstract terlalu banyak. Selain itu, Clerk berbayar saat scale — tidak ideal untuk public app.

---

## 9. WebSocket Client

### Opsi

| Option                                  | Pros                                       | Cons                                                                    |
| --------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| **Native WebSocket + custom reconnect** | Zero dependency, full control, tiny        | Harus handle reconnect, heartbeat, buffering sendiri                    |
| **Socket.io Client**                    | Auto reconnect, fallback to polling, rooms | Bundle besar (~45KB), butuh Socket.io server (tidak standard WebSocket) |
| **Ably / Pusher (hosted)**              | Managed service, scaling handled           | Paid, vendor lock-in, external dependency                               |

### Keputusan: **Native WebSocket + custom reconnect logic**

**Reasoning:**

1. **Zero dependency** — WebSocket API sudah built-in di semua modern browsers. Tidak perlu tambah library.
2. **Backend compatibility** — Backend WebSocket server kita pakai standard `ws` library. Native WebSocket client compatible langsung tanpa protocol mismatch (Socket.io butuh Socket.io server).
3. **Custom reconnect** — Reconnect logic untuk stock app cukup simple: exponential backoff + resubscribe to stock codes. Ini ~50 lines of code, tidak worth menambah 45KB Socket.io untuk ini.
4. **Learning value** — Memahami WebSocket protocol secara raw (handshake, frames, ping/pong, close codes) lebih valuable untuk system design interview dibanding pakai abstraction.
5. **Bundle size** — Literally 0KB tambahan. Untuk public app, ini matters.

**Kenapa bukan Socket.io?**
Socket.io menambah protocol layer di atas WebSocket. Server kita harus juga pakai Socket.io server. Ini unnecessary coupling dan bloat. Native WebSocket lebih simple dan performant.

---

## Summary — Final Frontend Stack

| Layer               | Choice                   | Bundle Impact      |
| ------------------- | ------------------------ | ------------------ |
| Framework           | Next.js 15 (App Router)  | - (framework)      |
| Styling             | Tailwind CSS + shadcn/ui | ~4KB CSS (purged)  |
| State Management    | Zustand                  | ~1KB               |
| Data Fetching       | TanStack Query           | ~12KB              |
| Financial Chart     | Lightweight Charts       | ~40KB              |
| General Chart       | Recharts                 | ~30KB              |
| Form                | React Hook Form + Zod    | ~22KB              |
| Auth                | NextAuth.js v5           | ~15KB              |
| WebSocket           | Native WebSocket         | 0KB                |
| **Total estimated** |                          | **~124KB gzipped** |
