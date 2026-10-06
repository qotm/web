import { type ReactNode, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getAuthClient } from './client';
import { sessionCleared, sessionLoaded, sessionLoading, type AuthUser } from './slice';
import { AUTH_BROADCAST_CHANNEL } from './logout';
import { setTelemetryUser } from '@/shared/telemetry';

function toAuthUser(user: Record<string, unknown> | null | undefined): AuthUser | null {
	if (!user) return null;
	return {
		id: String(user.id),
		email: String(user.email ?? ''),
		name: (user.name as string | undefined) ?? null,
		image: (user.image as string | undefined) ?? null,
		role: (user.role as string | undefined) ?? null,
		emailVerified: Boolean(user.emailVerified),
		onboardingCompletedAt: (user.onboardingCompletedAt as string | undefined) ?? null
	};
}

/**
 * Bootstraps the Better Auth session and hydrates the authSlice. Must render
 * inside the Redux <Provider>. Guards read the resulting status for gating.
 * Also syncs logout across tabs via BroadcastChannel.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const dispatch = useDispatch();
	const session = getAuthClient().useSession();

	useEffect(() => {
		if (session.isPending) {
			dispatch(sessionLoading());
			return;
		}
		const user = (session.data?.user as Record<string, unknown> | undefined) ?? null;
		dispatch(sessionLoaded(toAuthUser(user)));
		setTelemetryUser(user ? { id: String(user.id) } : null);
	}, [session.isPending, session.data, dispatch]);

	useEffect(() => {
		let channel: BroadcastChannel | null = null;
		try {
			channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
			channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
				if (event.data?.type === 'logout') dispatch(sessionCleared());
			};
		} catch {
			/* BroadcastChannel unsupported — no-op */
		}
		return () => channel?.close();
	}, [dispatch]);

	return <>{children}</>;
}
