/**
 * Quote statuses whose pages search engines must not index yet: public, but
 * still being checked or disputed (the API's NOT_INDEXED), or withdrawn.
 * Their pages stay shareable; they are `noindex` and out of the sitemap.
 *
 * Used by the quote route's `PageMeta` and by the web server (server/meta.ts),
 * which imports it at runtime: keep this file free of imports (the Dockerfile
 * copies it).
 */
export const NOT_INDEXED: readonly string[] = ['UNDER_REVIEW', 'NEEDS_EVIDENCE', 'DISPUTED', 'WITHDRAWN'];
