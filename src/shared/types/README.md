# @/shared/types

Generated TypeScript types + Zod schemas from the backend OpenAPI document.
Imported by the API layer and by feature code, so a stale copy here shows up as
a type error at build time rather than as a surprise at runtime.

## Usage

```ts
import type { UserEntity, GetUsersResponse } from '@/shared/types';
import { zUserEntity } from '@/shared/types/api/zod.gen';
```

## Regenerating

Requires the backend's docs credentials in `.env` (see `.env.example`).

```bash
yarn gen
```

That fetches `openapi.json` from the running backend and runs
`@hey-api/openapi-ts` over it, rewriting `src/shared/types/api/*`.
**Commit the regenerated files** — they are the contract the app compiles
against.

`api/*` ships as an empty placeholder so a freshly scaffolded app
typechecks before the backend exists. The first `gen` replaces it.
