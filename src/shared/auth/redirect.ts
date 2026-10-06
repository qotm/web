// Redirect helpers with open-redirect protection.
//
// The multi-app build of this stack puts the auth screens on their own origin,
// so an unauthenticated user is bounced across hosts and back. Here they are
// routes in this same bundle, so login is a *path*, not a host — but the
// allowlist stays exactly as it was: `?redirect=` is still attacker-controllable
// and a monolith is no less vulnerable to being used as an open redirect than
// four apps were.

let loginPath = '/login';
let trustedOrigins: string[] = [];
let defaultRedirect = '/';

export function configureRedirects(options: {
	/** Route the auth screens are mounted at. */
	loginPath?: string;
	/**
	 * Origins allowed as a post-login redirect target. Defaults to this app's
	 * own origin, which is the whole answer for a single deployment; add to it
	 * only if you deliberately hand off to another host.
	 */
	trustedOrigins?: string[];
	/** Where a login with no `?redirect=` lands. */
	defaultRedirect?: string;
}): void {
	if (options.loginPath) loginPath = options.loginPath;
	trustedOrigins = (options.trustedOrigins ?? [window.location.origin]).map((origin) => origin.replace(/\/$/, ''));
	if (options.defaultRedirect) defaultRedirect = options.defaultRedirect;
}

/** Validate a redirect target against the trusted-origin allowlist. */
export function getSafeRedirect(target: string | null | undefined, fallback: string = defaultRedirect): string {
	if (!target) return fallback;
	try {
		const url = new URL(target, window.location.origin);
		if (trustedOrigins.includes(url.origin)) return url.toString();
	} catch {
		/* not a valid URL — fall through to fallback */
	}
	return fallback;
}

/**
 * The login route, carrying where the user was heading.
 *
 * Returned as a path rather than navigated to, so the caller can decide: the
 * route guard renders `<Navigate>` with it (a client-side transition), while the
 * 401 handler below does a hard load.
 */
export function loginRedirect(returnTo: string = window.location.pathname + window.location.search): string {
	const params = new URLSearchParams({ redirect: returnTo });
	return `${loginPath}?${params.toString()}`;
}

/**
 * Hard navigation to the login screen.
 *
 * This is the 401 chokepoint (`configureApi({ onUnauthorized })`), which fires
 * from outside React — there is no router context to navigate with. A full load
 * is also the right behaviour here: a 401 means the session died mid-session, so
 * discarding in-memory state is the point, not a cost.
 */
export function redirectToLogin(returnTo?: string): void {
	window.location.assign(loginRedirect(returnTo));
}
