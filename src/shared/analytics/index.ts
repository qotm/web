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

/**
 * Every custom event and the only data it may carry. Values are fixed
 * enumerations on purpose: never a user id, quote id, handle or search text.
 */
export type AnalyticsEvents = {
	quote_reacted: { reaction: 'like' | 'favorite' | 'recommend'; on: boolean };
	quote_link_copied: { from: 'actions' | 'share_dialog' };
	share_card_opened: undefined;
	share_card_downloaded: { variant: 'quote' | 'terminal' };
	sign_in_started: { method: 'email' | 'github' | 'google' };
	quote_submitted: { type: 'canonical' | 'original' | 'private' };
	quote_reported: { reason: 'attribution' | 'content' | 'originality' | 'duplicate' | 'other' };
	search_performed: { type: 'quotes' | 'authors' | 'topics'; results: 'some' | 'none' };
	/** `command` is {@link cliCommand}'s name for it, never its arguments. */
	cli_command_copied: { command: string };
};

type EventArgs<E extends keyof AnalyticsEvents> = AnalyticsEvents[E] extends undefined ? [] : [AnalyticsEvents[E]];

type Umami = { track: (name: string, data?: object) => void | Promise<unknown> };
const umami = () => (window as Window & { umami?: Umami }).umami;

/**
 * Sends a custom event, scrubbed by the same before-send hook as page views.
 * Call it once the action has succeeded. Dropped when the tracker isn't loaded.
 */
export function track<E extends keyof AnalyticsEvents>(name: E, ...[data]: EventArgs<E>): void {
	void Promise.resolve(umami()?.track(name, data)).catch(() => undefined);
}

/** The longest {@link trackBeforeLeaving} may hold up a redirect. */
const LEAVE_TIMEOUT_MS = 1500;

/**
 * `track` before the page navigates away (an OAuth redirect): waits for the
 * deferred tracker and then the send, for at most 1.5s, and never rejects.
 * Resolves at once when analytics is off.
 */
export async function trackBeforeLeaving<E extends keyof AnalyticsEvents>(
	name: E,
	...[data]: EventArgs<E>
): Promise<void> {
	if (!window[BEFORE_SEND]) return;
	const deadline = Date.now() + LEAVE_TIMEOUT_MS;
	while (!umami() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
	const sent = Promise.resolve(umami()?.track(name, data)).catch(() => undefined);
	await Promise.race([sent, new Promise((r) => setTimeout(r, Math.max(0, deadline - Date.now())))]);
}

/**
 * A copied terminal command's name, without its arguments: `npm i -g qotm` is
 * `install`, `qotm --author dijkstra` is `--author`, `qotm sync` is `sync`.
 */
export function cliCommand(command: string): string {
	const words = command.trim().split(/\s+/);
	if (words[0] !== 'qotm') return words.includes('qotm') ? 'install' : 'other';
	return /^(-{1,2})?[a-z][a-z-]*$/.test(words[1] ?? '') ? words[1] : words.length > 1 ? 'other' : 'qotm';
}
