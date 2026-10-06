---
name: add-screen
description: Add a screen to this React app — the route, its data through RTK Query, loading/empty/error states, forms, page meta and its nav entry — built from the UI kit and theme tokens. Use when asked to "build the X page", "add a /things screen", "implement this design", or to turn an artboard into a working route.
---

# Add a screen

## 1. The data first

If the screen reads or writes API data, the endpoint must exist on the API.
Generate its types: run `yarn gen` against the running API (it needs
`API_DOC_URL`, `API_DOC_USER`, `API_DOC_PASSWORD` in `.env`), and commit
`src/shared/types/api/`.

Then the feature's slice, `src/features/<things>/api.ts`:

```ts
import { baseApi } from '@/shared/api';
import type { ThingEntity, PaginatedThingEntity, CreateThing } from '@/shared/types';

export const thingsApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		listThings: build.query<PaginatedThingEntity, { page?: number }>({
			query: (params) => ({ url: '/v1/things', params }),
			providesTags: ['Things']
		}),
		createThing: build.mutation<ThingEntity, CreateThing>({
			query: (body) => ({ url: '/v1/things', method: 'POST', body }),
			invalidatesTags: ['Things']
		})
	})
});

export const { useListThingsQuery, useCreateThingMutation } = thingsApi;
```

Add `'Things'` to `tagTypes` in `src/shared/api/base-api.ts`. Tags are global;
name them for the resource. Cookies and the 401 redirect are handled by the
base query; do not add auth headers.

## 2. The route

`src/routes/things.tsx`, a named export:

```tsx
import { PageMeta } from '@/shared/ui';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { useListThingsQuery } from '@/features/things/api';

export function ThingsRoute() {
	const { data, isLoading, isError, refetch } = useListThingsQuery({});

	return (
		<>
			<PageMeta title="Things" />
			<div className="space-y-6">
				<h1 className="text-2xl font-semibold">Things</h1>
				{isLoading ? (
					<PageSkeleton />
				) : isError ? (
					<StateScreen title="Couldn't load things" description="Try again in a moment." />
				) : data?.list.length ? /* the list */ null : (
					<Empty title="No things yet" description="Create one to get started." />
				)}
			</div>
		</>
	);
}
```

- Every state the design shows (loading, empty, error, each variant) gets
  built; none is left to "later".
- Compose from `@/shared/ui` components and theme utilities (`bg-card`,
  `text-muted-foreground`, `border-border`). A component the kit lacks is
  added with `add-component`, not inlined into the route.
- Forms: Formik with `toFormikValidationSchema(Schema)` (use the generated
  Zod schema from `@/shared/types/api/zod.gen` where one exists) and the
  `FormField` / `FormError` fields; a mutation's `.unwrap()` in `onSubmit`,
  `toast()` on success.
- Lay it out for phone width too.

## 3. Register it

In `src/app/router.tsx`:

```tsx
const ThingsRoute = lazy(() => import('@/routes/things').then((m) => ({ default: m.ThingsRoute })));
// …inside the protected app's children (relative path):
{ path: 'things', element: lazyRoute(<ThingsRoute />) },
```

A public screen goes outside `ProtectedRoute`; a signed-in one inside it.
Then the nav entry in `src/app/nav.tsx`:
`{ to: appPath('things'), label: 'Things', icon: <Box className="size-4" /> }`
(icons from `lucide-react`). Anything else linking to it uses `appPath()`.

## 4. Check

`yarn typecheck && yarn lint`, then `yarn dev` and walk every state against
the design, at desktop and phone width.
