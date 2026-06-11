# Refresh Granary Mobile-First Finance UI

Labels: `needs-triage`
Type: `AFK`
Blocked by: None

## What to build

Refresh Granary's existing mobile-first UI into a restrained brokerage-style
finance app while preserving the current routes, localStorage persistence,
Yahoo Finance API boundaries, shadcn/Tailwind stack, Geist font, and `max-w-xl`
app shell.

This is a visual and usability refresh only. Do not change portfolio
calculations, CSV behavior, storage keys, route structure, or API behavior.

The future implementation session should treat the mockups below as visual
direction, not pixel-perfect specs. Preserve real app data flow and existing
test hooks over mockup-only details.

## Mockup references

Repo-local image copies:

- [Portfolio dashboard](./assets/granary-design-refresh/portfolio-dashboard.png)
- [Purchases and stock detail concept](./assets/granary-design-refresh/purchases-and-stock-detail.png)
- [Purchases](./assets/granary-design-refresh/purchases.png)
- [Sales](./assets/granary-design-refresh/sales.png)
- [Dividends](./assets/granary-design-refresh/dividends.png)
- [Watchlist](./assets/granary-design-refresh/watchlist.png)

Original generated image batch:

`/Users/santovincensius/.codex/generated_images/019eb21a-7fd0-7ae1-81d1-095e9a79903e`

## Design direction

- Product type: mobile-first personal IDX portfolio tracker.
- Visual language: restrained dark brokerage app, not a marketing page.
- Design dials: `DESIGN_VARIANCE 4`, `MOTION_INTENSITY 2`,
  `VISUAL_DENSITY 7`.
- Palette: graphite surfaces, subtle borders, one emerald accent, red only for
  negative values.
- Shape: consistent rounded system around the existing shadcn radius scale.
- Typography: keep Geist and strengthen number hierarchy with tabular figures.
- Motion: keep minimal. Use hover, active, and state transitions only.

## Acceptance criteria

- [ ] Global design tokens use graphite finance surfaces, subtle borders, one
      emerald accent, red only for negative values, and a consistent rounded
      shape system.
- [ ] Header and bottom navigation stay compact, but bottom navigation shows
      readable icon plus short labels with a stronger active state and safe-area
      padding.
- [ ] Portfolio summary prioritizes total market value, net gain, compact
      metrics, performance, allocation, and holdings in that order.
- [ ] Holdings, purchases, sales, dividends, and watchlist use mobile row-card
      or compact-list layouts instead of requiring horizontal table scrolling
      on narrow screens.
- [ ] Wider screens may keep sortable table behavior where it is useful.
- [ ] Stock detail metrics are grouped into compact metric tiles below the
      chart instead of a long divider list.
- [ ] Visible copy is cleaned up: no long dash characters, concise labels, and
      no unnecessary Bahasa and English mixing.
- [ ] Existing routes, test ids, form behavior, persistence keys, and Yahoo
      route-handler boundaries are preserved.
- [ ] Updated or added tests cover bottom nav labels, empty states, mobile data
      rows, and stock detail metric tiles.
- [ ] `npm run lint`, `npm run tsc`, and focused Vitest tests pass.

## Implementation notes for future Codex session

- Stay inside existing conventions: `@/components/ui`, `lucide-react`,
  Tailwind v4 tokens in `src/app/globals.css`, Zustand stores, and TanStack
  Query hooks.
- Do not introduce Motion, GSAP, new icon packs, another design system, or
  backend changes.
- Prefer small reusable domain UI helpers only when they remove real
  duplication, such as `MetricTile`, `ValueChangeChip`, `MobileDataRow`, or
  `SectionPanel`.
- Keep generated mockup logos and exact sample content out of implementation
  unless the app already has matching real data. The implementation should use
  existing symbols, metadata, and persisted user data.
- Preserve accessibility wins: visible labels, focus states, touch targets,
  contrast, and keyboard-operable controls.

## Suggested verification

- Run `npm run lint`.
- Run `npm run tsc`.
- Run focused Vitest tests for updated layout, portfolio, transaction,
  watchlist, and stock-detail components.
- Manually verify dark mode, light mode, `390px` mobile width, centered desktop
  shell, bottom safe-area spacing, chart sizing, and long stock names.
