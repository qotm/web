import { getAuthClient } from './client';

export const AUTH_BROADCAST_CHANNEL = 'qotm-web-auth';

/** Notify other tabs/apps of an auth event (e.g. logout) so stale UI can react. */
export function broadcastAuthEvent(type: 'login' | 'logout'): void {
	try {
		const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
		channel.postMessage({ type });
		channel.close();
	} catch {
		/* BroadcastChannel unsupported — no-op */
	}
}

/** Sign out (clears the shared-domain cookie), broadcast, then optionally redirect. */
export async function signOut(options?: { redirectTo?: string }): Promise<void> {
	await getAuthClient().signOut();
	broadcastAuthEvent('logout');
	if (options?.redirectTo) {
		window.location.assign(options.redirectTo);
	}
}
