import { createAuthClient } from 'better-auth/react';
import { adminClient, deviceAuthorizationClient, magicLinkClient } from 'better-auth/client/plugins';

function makeClient(baseURL: string) {
	// Sign-in is by magic link or OAuth only; there are no passwords
	// (BUILD-PLAN §9). The admin plugin adds `authClient.admin.*`; the backend
	// enforces the caller's role on every one. The device plugin approves a
	// terminal's `qotm login` (`authClient.device.*`).
	return createAuthClient({ baseURL, plugins: [magicLinkClient(), adminClient(), deviceAuthorizationClient()] });
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
