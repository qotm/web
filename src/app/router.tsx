import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { ProtectedRoute, signOut, useAuth } from '@/shared/auth';
import { RoleRoute } from '@/shared/auth';
import { AppShell, AppShellSkeleton, ErrorBoundary, MarketingLayout, NotFound, RouteFallback } from '@/shared/layouts';
import { Forbidden } from '@/shared/layouts';
import { appPath } from '@/lib/paths';
import { ADMIN_BASE } from '@/lib/paths';
import { NAV_ITEMS } from './nav';
import { ADMIN_NAV_ITEMS } from './nav';
import { HomeRoute } from '@/routes/home';

/**
 * Everything but the first page is lazy, so the initial download is the shell
 * plus one route. The auth screens are lazy too: a logged-in user should never
 * pay for the login form, and a logged-out one never pays for the app.
 */
const SettingsRoute = lazy(() => import('@/routes/settings').then((m) => ({ default: m.SettingsRoute })));
const TermsRoute = lazy(() => import('@/routes/legal/terms').then((m) => ({ default: m.TermsRoute })));
const PrivacyRoute = lazy(() => import('@/routes/legal/privacy').then((m) => ({ default: m.PrivacyRoute })));
const LoginRoute = lazy(() => import('@/routes/auth/login').then((m) => ({ default: m.LoginRoute })));
const SignupRoute = lazy(() => import('@/routes/auth/signup').then((m) => ({ default: m.SignupRoute })));
const ForgotPasswordRoute = lazy(() =>
	import('@/routes/auth/forgot-password').then((m) => ({ default: m.ForgotPasswordRoute }))
);
const ResetPasswordRoute = lazy(() =>
	import('@/routes/auth/reset-password').then((m) => ({ default: m.ResetPasswordRoute }))
);
const VerifyEmailRoute = lazy(() =>
	import('@/routes/auth/verify-email').then((m) => ({ default: m.VerifyEmailRoute }))
);
const VerifiedRoute = lazy(() => import('@/routes/auth/verified').then((m) => ({ default: m.VerifiedRoute })));
const AdminHomeRoute = lazy(() => import('@/routes/admin/home').then((m) => ({ default: m.AdminHomeRoute })));

const lazyRoute = (element: ReactNode) => <Suspense fallback={<RouteFallback />}>{element}</Suspense>;

/**
 * The shell reads the session itself rather than taking it as a prop —
 * `ProtectedRoute` has already established the user is authenticated by the time
 * this renders.
 *
 * `ErrorBoundary` wraps the shell rather than being passed as the route's
 * `errorElement`: it is a plain React error boundary taking `children`, so it
 * catches render errors anywhere below, including inside a lazy chunk.
 */
function Shell() {
	const { user } = useAuth();
	return (
		<ErrorBoundary>
			<AppShell nav={NAV_ITEMS} user={user ?? {}} onSignOut={() => void signOut()} />
		</ErrorBoundary>
	);
}

function AdminShell() {
	const { user } = useAuth();
	return (
		<ErrorBoundary>
			<AppShell nav={ADMIN_NAV_ITEMS} user={user ?? {}} onSignOut={() => void signOut()} />
		</ErrorBoundary>
	);
}

export const router = createBrowserRouter([
	// Legal pages ship whether or not the marketing site does: the signup consent
	// gate links to them, so they have to resolve either way.
	{
		element: (
			<ErrorBoundary>
				<MarketingLayout />
			</ErrorBoundary>
		),
		children: [
			{ path: 'terms', element: lazyRoute(<TermsRoute />) },
			{ path: 'privacy', element: lazyRoute(<PrivacyRoute />) }
		]
	},
	// Public, and deliberately flat: these paths are baked into verification and
	// password-reset emails that are already in people's inboxes, so moving one
	// breaks links that have already been sent.
	{ path: '/login', element: lazyRoute(<LoginRoute />) },
	{ path: '/signup', element: lazyRoute(<SignupRoute />) },
	{ path: '/forgot-password', element: lazyRoute(<ForgotPasswordRoute />) },
	{ path: '/reset-password', element: lazyRoute(<ResetPasswordRoute />) },
	{ path: '/verify-email', element: lazyRoute(<VerifyEmailRoute />) },
	{ path: '/verified', element: lazyRoute(<VerifiedRoute />) },
	{
		// `/app` with the marketing site, `/` without it. Children stay relative so
		// they follow it either way.
		path: appPath(),
		// `fallback` is required and must not be blank: the session round trip takes
		// most of a second on a cold load, and rendering nothing for that long reads
		// as a broken app.
		element: (
			<ProtectedRoute fallback={<AppShellSkeleton />}>
				<Shell />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <HomeRoute /> },
			{ path: 'settings', element: lazyRoute(<SettingsRoute />) }
		]
	},
	{
		path: ADMIN_BASE,
		// The role gate is UI, not security: it decides what to render from the
		// session the browser holds. Every endpoint behind it enforces the same
		// role server-side, or the console is an honour system.
		element: (
			<RoleRoute allow={['admin', 'superuser']} fallback={<AppShellSkeleton />} forbidden={<Forbidden />}>
				<AdminShell />
			</RoleRoute>
		),
		children: [{ index: true, element: lazyRoute(<AdminHomeRoute />) }]
	},
	{ path: '*', element: <NotFound /> }
]);
