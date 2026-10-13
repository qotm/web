// @/shared/analytics — anonymous, cookieless page views via Umami.
//
// Public pages are reported by their real path (which quotes, authors and
// topics people read is the point). Account and console pages are reported by
// their route pattern, and no page sends its query string or hash: magic-link
// and device codes ride in the query. Off until a host and website id are set.
import { matchRoutes, type RouteObject } from 'react-router';
import { PRIVATE_PREFIXES } from '@/lib/paths';

/** Umami's tracker calls the global of this name before every send. */
const BEFORE_SEND = '__qotmUmamiBeforeSend';

type UmamiPayload = {
	url?: string;
	referrer?: string;
	title?: string;
	[key: string]: unknown;
};

declare global {
	interface Window {
		__qotmUmamiBeforeSend?: (type: string, payload: UmamiPayload) => UmamiPayload;
	}
}

const isPrivate = (pathname: string) =>
	PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * The matched route's pattern (`/admin/quotes/:id`), never the real ids. A
 * path no route matches reports as `/*`.
 */
export function routePattern(routes: RouteObject[], pathname: string): string {
	const matches = matchRoutes(routes, pathname);
	if (!matches) return '/*';
	const segments = matches.flatMap(({ route }) => (route.path ?? '').split('/')).filter(Boolean);
	return `/${segments.join('/')}`;
}

/** A same-origin path as it may be reported: the path itself, or its pattern on a private page. */
function reportedPath(routes: RouteObject[], url: string): string {
	const { pathname } = new URL(url, window.location.origin);
	return isPrivate(pathname) ? routePattern(routes, pathname) : pathname;
}

/**
 * Rewrites what Umami is about to send: `url` loses its query and hash (and
 * becomes a pattern on a private page, which also loses its title); a
 * same-origin `referrer` gets the same treatment, an external one is cut to
 * its origin.
 */
export function sanitizePayload(routes: RouteObject[], payload: UmamiPayload): UmamiPayload {
	const next: UmamiPayload = { ...payload };

	if (typeof payload.url === 'string') {
		next.url = reportedPath(routes, payload.url);
		if (next.url !== new URL(payload.url, window.location.origin).pathname) delete next.title;
	}
	if (typeof payload.referrer === 'string' && payload.referrer) {
		const ref = payload.referrer;
		if (ref.startsWith('/')) {
			next.referrer = reportedPath(routes, ref);
		} else {
			try {
				next.referrer = new URL(ref).origin;
			} catch {
				delete next.referrer;
			}
		}
	}
	return next;
}

export type AnalyticsConfig = {
	/** Umami instance origin, e.g. `https://umami.example.com`. */
	host: string | undefined;
	/** This site's Umami website id. */
	websiteId: string | undefined;
	/** The app's route tree — `router.routes`. */
	routes: RouteObject[];
};

/**
 * Loads the Umami tracker once. A no-op unless both `host` and `websiteId` are
 * set, so dev and any build without them make no request at all.
 */
export function startAnalytics({ host, websiteId, routes }: AnalyticsConfig): void {
	if (!host || !websiteId || window[BEFORE_SEND]) return;

	window[BEFORE_SEND] = (_type, payload) => sanitizePayload(routes, payload);

	const script = document.createElement('script');
	script.defer = true;
	script.src = `${host.replace(/\/$/, '')}/script.js`;
	script.dataset.websiteId = websiteId;
	script.dataset.beforeSend = BEFORE_SEND;
	// Query/hash-only changes (search terms, tabs) are not new page views.
	script.dataset.excludeSearch = 'true';
	script.dataset.excludeHash = 'true';
	document.head.appendChild(script);
}
