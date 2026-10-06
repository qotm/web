const env = import.meta.env;

/** Backend base URL. Better Auth lives at `${API_URL}/auth`. */
export const API_URL = env.VITE_APP_API_URL as string;

/**
 * This app's own origin, read from the browser rather than from a build-time
 * variable.
 *
 * One deployment means one origin, so there is nothing a `VITE_APP_URL` could
 * add here and plenty it could get wrong: Vite inlines env at build time, so a
 * stale value baked into an image sends every verification link to the previous
 * environment — and that failure is invisible until a user clicks one.
 *
 * The only place an absolute URL is genuinely needed is a link that lands in an
 * email, and by then the browser has already told us where we are.
 */
export const APP_ORIGIN = window.location.origin;

/** OpenObserve browser monitoring (see @/shared/telemetry); unset keeps it off. */
export const TELEMETRY = {
	url: env.VITE_OPENOBSERVE_URL as string | undefined,
	org: env.VITE_OPENOBSERVE_ORG as string | undefined,
	clientToken: env.VITE_OPENOBSERVE_CLIENT_TOKEN as string | undefined,
	environment: env.MODE
};
