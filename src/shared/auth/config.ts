import { initAuthClient } from './client';
import { configureRedirects } from './redirect';

/**
 * One-shot auth wiring, called once at startup (before rendering).
 *
 * There is no `authAppUrl` here, unlike the multi-app build of this stack: the
 * auth screens are routes in this bundle, so login is a path within the same
 * origin. `trustedOrigins` therefore defaults to this app's own origin — the
 * complete answer unless you deliberately hand off to another host.
 */
export function configureAuth(options: {
	/** Backend Better Auth base URL (e.g. https://api.example.com/auth). */
	authApiBaseUrl: string;
	/** Route the login screen is mounted at. Defaults to `/login`. */
	loginPath?: string;
	/** Origins allowed as a post-login redirect target. Defaults to this origin. */
	trustedOrigins?: string[];
	/** Where a login with no `?redirect=` lands. */
	defaultRedirect?: string;
}): void {
	initAuthClient(options.authApiBaseUrl);
	configureRedirects({
		loginPath: options.loginPath,
		trustedOrigins: options.trustedOrigins,
		defaultRedirect: options.defaultRedirect
	});
}
