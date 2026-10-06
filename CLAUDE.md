# qotm-web

A single Vite + React 19 app generated from the stacks `react-app` template
(`stack.json` records which features it has): React Router, an RTK Query data
layer with one `baseApi`, better-auth sessions with route guards, a
shadcn-style UI kit with theme tokens, and layouts and state screens. It talks
to a NestJS API at `VITE_APP_API_URL`.

## Commands

```sh
yarn dev                 # http://localhost:3000
yarn typecheck && yarn lint && yarn format:check
yarn build               # typecheck + vite build (what CI runs, with lint and format:check)
yarn gen                 # regenerate API types from the running API's OpenAPI document
```

There is no test runner yet.

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
- Imports use `@/` for `src/` (`@/shared/ui`, `@/routes/settings`).

## Rules

- **Tokens, not literals.** Colours, radii and fonts come from the theme
  (`src/shared/ui/styles/globals.css` and `theme.css`): `bg-card`,
  `text-muted-foreground`, `border-border`, `text-primary`. No hex values or
  arbitrary colours in components. `THEME_COLORS` must equal `--background`.
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
- **Auth paths stay flat** (`/login`, `/signup`, `/reset-password`…): they are
  in emails already sent.
- **`VITE_*` is inlined at build time.** A built image is pinned to one
  environment, and nothing secret may ever be a `VITE_*` variable. Read env
  only through `src/lib/env.ts`.
- **`PageMeta` on every screen** (`title` is the page's own segment; the brand
  is appended). Admin and error pages pass `robots="noindex"`.
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

## Skills

- `add-screen`: a route with its data, states and nav entry.
- `add-component`: a UI kit component on the theme tokens.
- `add-admin-page`: a page in the role-gated console.
