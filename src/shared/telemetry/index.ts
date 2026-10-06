// @/shared/telemetry — browser monitoring (RUM) and logs, sent to OpenObserve.
//
// Page views, errors, slow resources and user actions, plus console errors as
// logs. Requests to the app's own API carry a W3C `traceparent` header, so a
// click links to the backend trace it caused. The SDK finishes starting a
// moment after init (its session store is async), so the first request or two
// of a page load (typically the session check) go out without the header.
// Off until connection settings are passed; everything here is then a no-op.
import { DefaultPrivacyLevel, openobserveRum } from '@openobserve/browser-rum';
import { openobserveLogs } from '@openobserve/browser-logs';

export interface TelemetryOptions {
	/** Service name, e.g. `qotm-web-client` — one per app. */
	service: string;
	/** OpenObserve base URL, e.g. `https://o2.example.com`. */
	url?: string;
	/** The project's organization identifier. */
	org?: string;
	/**
	 * A RUM client token (Ingestion → RUM). Write-only and built for shipping
	 * in a bundle — never the backend's ingestion token.
	 */
	clientToken?: string;
	/** `development`, `production`, … — Vite's `import.meta.env.MODE`. */
	environment?: string;
	version?: string;
	/** Backend origin(s) whose requests should carry trace headers. */
	apiUrls?: string[];
	/** Share of sessions to record for replay, 0–100. Off by default. */
	sessionReplaySampleRate?: number;
}

let started = false;

export function initTelemetry(options: TelemetryOptions): boolean {
	const { url, org, clientToken } = options;
	if (started || !url || !org || !clientToken) return false;

	// The SDK takes a bare host (no scheme) plus an explicit plain-HTTP flag.
	const { host, protocol } = new URL(url);
	const common = {
		clientToken,
		site: host,
		organizationIdentifier: org,
		insecureHTTP: protocol === 'http:',
		service: options.service,
		env: options.environment,
		version: options.version
	};

	openobserveRum.init({
		...common,
		applicationId: options.service,
		sessionSampleRate: 100,
		sessionReplaySampleRate: options.sessionReplaySampleRate ?? 0,
		defaultPrivacyLevel: DefaultPrivacyLevel.MASK_USER_INPUT,
		trackResources: true,
		trackLongTasks: true,
		trackUserInteractions: true,
		allowedTracingUrls: (options.apiUrls ?? []).filter(Boolean).map((match) => ({
			match,
			propagatorTypes: ['tracecontext' as const]
		}))
	});
	openobserveLogs.init({ ...common, forwardErrorsToLogs: true });
	started = true;
	return true;
}

/** Report a handled error — e.g. from an error boundary. */
export function reportError(error: unknown, context?: object): void {
	if (started) openobserveRum.addError(error, context);
}

/** Tie the session to a signed-in user (id only), or clear it on logout. */
export function setTelemetryUser(user: { id: string } | null): void {
	if (!started) return;
	if (user) openobserveRum.setUser({ id: user.id });
	else openobserveRum.clearUser();
}
