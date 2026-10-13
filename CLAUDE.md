# qotm-web

A single Vite + React 19 app generated from the stacks `react-app` template
(`stack.json` records which features it has): React Router, an RTK Query data
layer with one `baseApi`, better-auth sessions with route guards, a
shadcn-style UI kit with theme tokens, and layouts and state screens. It talks
to a NestJS API at `VITE_APP_API_URL`.

## Commands

```sh
yarn dev                 # http://localhost:5062 (https://qotm.site through the dev tunnel)
yarn typecheck && yarn lint && yarn format:check
yarn build               # typecheck + vite build (what CI runs, with lint and format:check)
yarn test                # Vitest + Testing Library: src/**/*.test.{ts,tsx}, jsdom
yarn test:e2e            # Playwright: e2e/*.spec.ts in Chromium
yarn gen                 # regenerate API types from the running API's OpenAPI document
DIST=dist API_URL=… SITE_URL=… node server/index.ts   # what the image runs (after yarn build)
```

**The browser suite** (`playwright.config.ts`) starts its own API from the
backend's compiled build (`backend/apps/api/dist`, kept current by the dev
API's watch) with `.env.test`, on port 5160, and a web dev server pointed at it
on 5162, so the dev API (5060) and web (5062) keep running. It also builds
the app into `e2e/.dist` and runs `server/` on 5163 for the SEO checks.
`e2e/global-setup.ts` resets the test database with the backend's
`yarn test:db:seed:e2e` (test users and the design's sample content). Sign in
with `signIn(page, 'member' | 'admin')` from `e2e/fixtures.ts` (password
sign-in, on in the test environment only). Never run it alongside the
backend's e2e suite: both use the test database.

## Layout

- `src/app/`: `router.tsx` (every route), `nav.tsx` (the shell's nav),
  `providers.tsx` (store, auth, theme, meta, toasts), `store.ts`.
- `src/lib/paths.ts`: where things live in the URL space (`appPath`,
  `APP_BASE`, and `ADMIN_BASE` with the admin console). `src/lib/env.ts`: the
  only reader of `import.meta.env`.
- `src/routes/`: one file per screen, exporting a named `XRoute` component.
- `src/features/<name>/`: a feature's API slice (`api.ts`) and components
  that only it uses.
- `src/shared/`: `ui/` (the kit: components, form fields, theme, `PageMeta`),
  `api/` (`baseApi`, base query, uploads), `auth/` (session, guards,
  redirects), `layouts/` (shells, state screens), `hooks/`, `types/`
  (generated API types).
- `server/`: the web image's Node server (no dependencies; Node runs the
  TypeScript directly), which production runs. For every public page (a
  quote, author, topic, profile, home, the feeds, topics, search, legal) it
  writes the title, description, canonical URL, Open Graph / Twitter tags,
  schema.org JSON-LD (`jsonld.ts`) and plain HTML for crawlers into `#root`
  (`prerender.ts`; `createRoot` replaces it) from the API. It serves the
  og:images on this origin (`/q/:id/og.png`, `/authors/:slug/og.png`,
  `/topics/:slug/og.png`, `/og.png`, streamed from the API, which waits for
  the render), `/sitemap.xml` (an index of `/sitemaps/{pages,quotes,authors,topics}.xml`
  from `/v1/sitemap`), the RSS feeds `/feed.xml` and `/curated.xml`,
  `robots.txt`, the IndexNow key and `/healthz`. Quotes under review or
  disputed are `noindex` (`src/shared/ui/meta/indexing.ts`). It imports
  `src/lib/paths.ts`, `src/shared/ui/meta/{brand,indexing}.ts` and
  `src/features/legal/{documents,inline}.ts` (the terms and privacy policy,
  sent to crawlers in full) at runtime, so keep those free of imports; the
  Dockerfile copies them.
  Runtime env: `API_URL`, `SITE_URL`, `INDEXNOW_KEY` (optional), `PORT`,
  `DIST`. `yarn dev` (Vite) does not run it.
- Imports use `@/` for `src/` (`@/shared/ui`, `@/routes/settings`).

## Rules

- **Tokens, not literals.** Colours, radii and fonts come from the theme
  (`src/shared/ui/styles/globals.css` and `theme.css`): `bg-card`,
  `text-muted-foreground`, `border-border`, `text-primary`. No hex values or
  arbitrary colours in components. `THEME_COLOR` must equal `--background` (one theme, "Paper").
- **One `baseApi`.** Every endpoint is `baseApi.injectEndpoints(...)` in a
  feature's `api.ts`. Cache tags are one global namespace: add yours to
  `tagTypes` in `src/shared/api/base-api.ts`, with a specific name.
- **Generated types are the contract.** Request and response types come from
  `@/shared/types` (and Zod schemas from `@/shared/types/api/zod.gen`), never
  hand-written copies. Run `yarn gen` after the API changes and commit the
  output.
- **Name routes through `paths.ts`.** Anything outside the router that names a
  route (nav, redirects, links in emails) uses `appPath()`; routes inside the
  shell use relative paths. Keep `nav.tsx` in step with `router.tsx`.
- **The guards are UI, not security.** `ProtectedRoute` and `RoleRoute` decide
  what renders; the API decides what data anyone gets. Their `fallback` /
  `forbidden` props are required.
- **Sign-in is passwordless** (magic link or OAuth, BUILD-PLAN §9) and its
  paths stay flat (`/login`, `/device`).
- **`VITE_*` is inlined at build time.** A built image is pinned to one
  environment, and nothing secret may ever be a `VITE_*` variable. Read env
  only through `src/lib/env.ts`.
- **`PageMeta` on every screen** (`title` is the page's own segment; the brand
  is appended). Admin and error pages pass `robots="noindex"`.
- **Phones and tablets.** No screen may scroll sideways at 360px
  (`e2e/responsive.spec.ts` checks one screen per ticket at 360 and 768).
  Small controls carry the `tap` utility (globals.css: a 44px hit area on
  touch screens, no visual change); fields are 44px and 16px text on touch
  (`pointer-coarse:`), so iOS does not zoom. Components that must reflow by
  their own width use container queries (`@container`, `@min-[480px]:`):
  DataTable rows become cards under 480px, LifecycleSteps goes compact under
  560px. The admin sidebar is the Console menu under 1024px. The patterns are
  on the canvas's Mobile page. `AUDIT=1 yarn test:e2e e2e/mobile-audit.spec.ts`
  screenshots every screen at 390/360/768 and lists overflow, small tap
  targets and tiny text (e2e/.screenshots/audit/report.json); the screen list
  is e2e/shots.ts.
- `brand.ts` and `theme-colors.ts` stay free of React and `import.meta.env`:
  `vite.config.ts` imports them.

## Features in this project

- **Forms**: Formik with Zod (`toFormikValidationSchema(schema)`) and the
  `FormField` / `FormTextarea` / `FormDateField` / `FormError` fields from
  `@/shared/ui`, rendered inside `<Formik>`.
- **Toasts**: `toast()` from `sonner`; the `<Toaster />` is already mounted.
- **States**: `PageSkeleton` while loading, `Empty` for no data,
  `StateScreen` for errors, from `@/shared/layouts`.
- **Telemetry**: OpenObserve RUM once `VITE_OPENOBSERVE_*` are set;
  `reportError` from `@/shared/telemetry` for errors you catch.
- **Analytics**: Umami page views once `VITE_UMAMI_URL` and
  `VITE_UMAMI_WEBSITE_ID` are set (`@/shared/analytics`). Public pages report
  their path; `PRIVATE_PREFIXES` pages report the route pattern, and no page
  sends its query or hash. Custom events go through `track()`, after the action
  succeeds; each one and its data is declared in `AnalyticsEvents`, with fixed
  values only (never an id, handle or search text). The terminal components'
  copies arrive through `onTerminalCopy` (registered in `main.tsx`).

## The kit (qotm_kit)

Components in `src/shared/ui` follow qotm_kit (the design system) property
for property. `/_kit` (dev only) lays each one out as the kit's own preview
does; `e2e/kit.ts` renders the kit's preview from its real bundle
(`e2e/kit/`) and `expectMatchesKit()` compares computed styles element by
element, saving `e2e/.screenshots/kit/<Name>-kit.png` and `-web.png` for
review. A new kit component gets a `/_kit` section and an `expectMatchesKit`
test. `cn()` knows the theme's own names (text styles, radii, spacing), and
`glyph()` gives symbols text presentation.

## Skills

- `add-screen`: a route with its data, states and nav entry.
- `add-component`: a UI kit component on the theme tokens.
- `add-admin-page`: a page in the role-gated console.
