import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './hooks';
import { loginRedirect } from './redirect';

type GuardProps = {
	children?: ReactNode;
	/**
	 * Shown while the session is resolving.
	 *
	 * Required on purpose. This used to default to `null`, which meant the app
	 * rendered *nothing* for the entire session round trip — ~880 ms measured
	 * against a deployed API, and worse on mobile. Pass the shell skeleton so the
	 * frame is on screen while the session resolves; there is no correct case for
	 * gating a whole app behind a blank screen.
	 */
	fallback: ReactNode;
};

/**
 * Requires any authenticated session; otherwise sends the visitor to `/login`
 * with a `?redirect=` back to where they were.
 *
 * `<Navigate>` rather than `window.location.assign`: the login screen is a route
 * in this same bundle, so a full page load would re-download and re-boot the app
 * to render a screen it already has. `replace` keeps the guarded URL out of
 * history — without it, Back from the login screen bounces straight through the
 * guard again.
 */
export function ProtectedRoute({ children, fallback }: GuardProps) {
	const { status } = useAuth();
	const location = useLocation();

	if (status === 'loading') return <>{fallback}</>;
	if (status === 'unauthenticated') {
		return <Navigate to={loginRedirect(location.pathname + location.search)} replace />;
	}
	return <>{children ?? <Outlet />}</>;
}

type RoleRouteProps = GuardProps & {
	/** Roles allowed to view (any match). Compared against session.user.role. */
	allow: string[];
	/**
	 * Rendered when authenticated but lacking a required role (403). Required for
	 * the same reason as `fallback` — a silent blank 403 looks like a broken app.
	 */
	forbidden: ReactNode;
};

/**
 * Requires an authenticated session AND one of `allow` roles.
 * 401 (no session) -> the login screen; 403 (wrong role) -> `forbidden`.
 *
 * This is a UI affordance, not a security boundary: the role it reads comes from
 * the session the browser holds, so it decides what to *render*. Every endpoint
 * behind it must enforce the same role server-side.
 */
export function RoleRoute({ allow, children, fallback, forbidden }: RoleRouteProps) {
	const { status, user } = useAuth();
	const location = useLocation();

	if (status === 'loading') return <>{fallback}</>;
	if (status === 'unauthenticated') {
		return <Navigate to={loginRedirect(location.pathname + location.search)} replace />;
	}

	const roles = (user?.role ?? '')
		.split(',')
		.map((role) => role.trim())
		.filter(Boolean);
	if (!allow.some((role) => roles.includes(role))) return <>{forbidden}</>;

	return <>{children ?? <Outlet />}</>;
}
