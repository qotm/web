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

/** The legal pages, linked from the site footer and the sign-in screen. */
export const TERMS_PATH = '/terms';
export const PRIVACY_PATH = '/privacy';

/**
 * The admin console. A separate branch of the router rather than a route inside
 * the app shell, so the role check wraps the whole section instead of being
 * repeated per page — and so an admin-only nav never renders for anyone else.
 */
export const ADMIN_BASE = '/admin';

/**
 * Every screen's URL, built in one place (BUILD-PLAN §3). Public community
 * routes first; the account pages require a session; the console is under
 * `ADMIN_BASE`. Handles are shown with their `@`: `/@ada`.
 */
export const paths = {
	home: '/',
	discover: '/discover',
	latest: '/latest',
	curated: '/curated',
	quote: (id: string) => `/q/${id.replace(/^q_/, '')}`,
	/** A quote's link as shared: `?card=terminal` makes its og:image the terminal card. */
	sharedQuote: (id: string, card: 'quote' | 'terminal') =>
		`/q/${id.replace(/^q_/, '')}${card === 'terminal' ? '?card=terminal' : ''}`,
	author: (slug: string) => `/authors/${slug}`,
	topics: '/topics',
	topic: (slug: string) => `/topics/${slug}`,
	search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : '/search'),
	profile: (handle: string, tab?: 'quotes' | 'contributions') => `/@${handle.replace(/^@/, '')}${tab ? `/${tab}` : ''}`,
	login: '/login',
	device: '/device',
	favorites: '/favorites',
	myQuotes: '/my-quotes',
	settings: '/settings',
	submit: '/submit',
	terms: '/terms',
	privacy: '/privacy',
	admin: ADMIN_BASE
} as const;

/** The console's pages (artboards Admin*), under `ADMIN_BASE`. */
export const adminPaths = {
	dashboard: ADMIN_BASE,
	quotes: `${ADMIN_BASE}/quotes`,
	submissions: `${ADMIN_BASE}/submissions`,
	verification: `${ADMIN_BASE}/verification`,
	curation: `${ADMIN_BASE}/curation`,
	reports: `${ADMIN_BASE}/reports`,
	authors: `${ADMIN_BASE}/authors`,
	sources: `${ADMIN_BASE}/sources`,
	topics: `${ADMIN_BASE}/topics`,
	users: `${ADMIN_BASE}/users`,
	releases: `${ADMIN_BASE}/releases`,
	audit: `${ADMIN_BASE}/audit`
} as const;

/** Routes that must never be indexed: the account pages and the console. */
export const PRIVATE_PREFIXES = ['/favorites', '/my-quotes', '/settings', '/submit', '/login', '/device', ADMIN_BASE];
