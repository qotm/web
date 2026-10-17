# qotm web

The website at [qotm.dev](https://qotm.dev): read, share and submit
considered programming quotes, and the console where the community verifies
and curates them. The API it talks to is
[qotm/backend](https://github.com/qotm/backend); the terminal client is
[qotm/cli](https://github.com/qotm/cli) (`npm i -g qotm`).

Vite and React 19, React Router, RTK Query, better-auth sessions, and a UI kit
built from the qotm design system. In production a small Node server
(`server/`, no dependencies) serves the build and writes each public page's
title, Open Graph tags, JSON-LD and crawlable HTML, plus the sitemap, RSS
feeds and og:images.

## Running it

Requires Node.js 24, Yarn 4 (through Corepack) and the backend running
locally.

```sh
yarn install
cp .env.example .env            # VITE_APP_API_URL points at the API
yarn dev                        # http://localhost:5062
```

```sh
yarn typecheck && yarn lint && yarn format:check
yarn test                       # Vitest and Testing Library
yarn test:e2e                   # Playwright, against its own API and test database
yarn build
DIST=dist API_URL=… SITE_URL=… node server/index.ts   # what the image runs
```

## License

The code is MIT. Quote texts and citations drawn from
[Wikiquote](https://en.wikiquote.org) remain under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), with
attribution to Wikiquote's contributors through each quote's source; facts
from Wikidata are CC0. Members' originals are theirs, shared under the terms
at [qotm.dev/terms](https://qotm.dev/terms).
