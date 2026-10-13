# The built app, served by a small Node server (server/) that also writes each
# public page's tags, JSON-LD and plain HTML into index.html for crawlers, and
# serves the og:images, sitemap, RSS feeds and robots.txt.
#
#   docker build --build-arg VITE_APP_API_URL=https://api.example.com -t app .
#   docker run -e API_URL=http://api:3000 -e SITE_URL=https://example.com -p 8080:8080 app
#
# IMPORTANT: Vite inlines `VITE_*` values into the JS bundle at BUILD time, so a
# built image is pinned to one environment. These are build args, not runtime
# env — setting them in compose does nothing. Build one image per environment,
# or move to runtime config.

# ---------- deps ----------
# Manifests only, so `yarn install` re-runs solely when a dependency changes.
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
# Each stage is a fresh image, so corepack has to be enabled again here —
# without it `yarn` is the bundled 1.x and refuses the packageManager field.
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args become env vars so Vite's define step picks them up. Process env
# takes precedence over a committed .env, so a stale checked-in .env cannot leak
# into the image as long as the arg is supplied.
ARG VITE_APP_API_URL
ARG VITE_APP_SITE_URL
ARG VITE_APP_SUPPORT_EMAIL
ENV VITE_APP_API_URL=$VITE_APP_API_URL \
	VITE_APP_SITE_URL=$VITE_APP_SITE_URL \
	VITE_APP_SUPPORT_EMAIL=$VITE_APP_SUPPORT_EMAIL
# Browser monitoring. Leave unset and the bundle ships with telemetry off. The
# client token is a RUM token, write-only and meant to be public.
ARG VITE_OPENOBSERVE_URL
ARG VITE_OPENOBSERVE_ORG
ARG VITE_OPENOBSERVE_CLIENT_TOKEN
ENV VITE_OPENOBSERVE_URL=$VITE_OPENOBSERVE_URL \
	VITE_OPENOBSERVE_ORG=$VITE_OPENOBSERVE_ORG \
	VITE_OPENOBSERVE_CLIENT_TOKEN=$VITE_OPENOBSERVE_CLIENT_TOKEN
# Umami page views. Leave unset and no tracker loads. The website id is public.
ARG VITE_UMAMI_URL
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_UMAMI_URL=$VITE_UMAMI_URL \
	VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID

# Fail loudly rather than silently producing a bundle with `undefined` URLs baked
# in — that failure is invisible until the app 404s at runtime.
RUN test -n "$VITE_APP_API_URL" || (echo "ERROR: --build-arg VITE_APP_API_URL is required" && exit 1)

RUN yarn build

# ---------- runtime ----------
# No dependencies: the server is node:http, and Node runs its TypeScript
# directly (type stripping). It imports two plain modules from src/ (the URL
# map and the brand), so the routes, private prefixes and titles stay one
# definition shared with the app.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
	PORT=8080 \
	DIST=/app/dist

COPY package.json ./
COPY server ./server
COPY src/lib/paths.ts ./src/lib/paths.ts
COPY src/shared/ui/meta/brand.ts ./src/shared/ui/meta/brand.ts
COPY src/shared/ui/meta/indexing.ts ./src/shared/ui/meta/indexing.ts
COPY src/features/legal/documents.ts src/features/legal/inline.ts ./src/features/legal/
COPY --from=build /app/dist ./dist

# Runtime configuration (unlike the VITE_* values above, these are read at start):
#   API_URL          where the server reaches the API (required); og:images are
#                    streamed from it, so crawlers only ever see SITE_URL
#   SITE_URL         this site's public origin (required)
#   INDEXNOW_KEY     IndexNow's key, served at /<key>.txt (optional; the API pings)
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
	CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server/index.ts"]
