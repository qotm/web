/**
 * Where things live in the URL space.
 *
 * One deployment serves the marketing pages, the auth screens and the
 * authenticated app, so unlike a multi-app build these cannot each own `/` on
 * their own host — the split has to happen in the path, and it has to happen in
 * one place or the router, the nav and the post-login redirect will disagree.
 */

/**
 * The mount point of the authenticated app, as a path split on `/`.
 *
 * A list rather than two competing `const` declarations because a generated
 * project has to compile in *every* feature combination, and only one of two
 * declarations of the same name can survive the strip. Drop `marketing` and only
 * the leading empty segment is left, putting the app back at the root.
 *
 * The `''` is not filler: an absolute path's first segment *is* empty —
 * `'/app'.split('/')` is `['', 'app']`. It also keeps this array non-empty in
 * every build, which matters because a literal that strips down to `[\n]` is no
 * longer formatted the way Prettier wants it, and `format:check` runs in CI.
 */
const BASE_SEGMENTS: string[] = [
	'' // the leading slash
];

/** `/app` when the marketing site owns `/`; otherwise `''`. */
export const APP_BASE = BASE_SEGMENTS.join('/');

/**
 * Absolute path to a route inside the authenticated app.
 *
 *   appPath()            ->  '/app'  (or '/')
 *   appPath('settings')  ->  '/app/settings'  (or '/settings')
 *
 * Use it for anything that has to name a route from outside the router — nav
 * items, redirect targets, links in emails. Routes *inside* the app shell can
 * keep using relative paths and need none of this.
 */
export const appPath = (path = '') => `${APP_BASE}/${path}`.replace(/\/+/g, '/').replace(/(.)\/$/, '$1');

/**
 * Legal pages ship whether or not the marketing site does: the signup consent
 * gate links to them, and a consent checkbox pointing at a 404 is worse than no
 * checkbox at all.
 */
export const TERMS_PATH = '/terms';
export const PRIVACY_PATH = '/privacy';

/**
 * The admin console. A separate branch of the router rather than a route inside
 * the app shell, so the role check wraps the whole section instead of being
 * repeated per page — and so an admin-only nav never renders for anyone else.
 */
export const ADMIN_BASE = '/admin';
