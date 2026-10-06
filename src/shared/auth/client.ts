import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

function makeClient(baseURL: string) {
	// The admin plugin adds `authClient.admin.*` (list/ban/unban/setRole). The
	// methods are always present but the backend enforces the caller's role, so
	// including them here is harmless for non-admin apps.
	return createAuthClient({ baseURL, plugins: [adminClient()] });
}

let client: ReturnType<typeof makeClient> | null = null;

/** Initialize the Better Auth client singleton (idempotent). */
export function initAuthClient(baseURL: string) {
	client ??= makeClient(baseURL);
	return client;
}

/** The Better Auth client. Throws if not initialized (call configureAuth first). */
export function getAuthClient() {
	if (!client) {
		throw new Error('Auth client not initialized. Call configureAuth({ authApiBaseUrl, ... }) at app startup.');
	}
	return client;
}

export type AuthClient = ReturnType<typeof makeClient>;
