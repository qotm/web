import { Suspense, lazy, type ReactNode } from 'react';
import { Outlet, createBrowserRouter } from 'react-router';
import { ProtectedRoute, RoleRoute } from '@/shared/auth';
import { AppShellSkeleton, Forbidden, NotFound, PageSkeleton, RouteFallback } from '@/shared/layouts';
import { ADMIN_BASE, adminPaths } from '@/lib/paths';
import { ADMIN_ACCESS, STAFF_ROLES, type AdminPage } from './nav';
import { AdminIndex, AdminShell } from './admin-shell';
import { SiteShell } from './site-shell';
import { LandingRoute } from '@/routes/landing';

/**
 * Every route but the landing page is lazy, so the first download is the shell
 * plus one route.
 */
const lazyRoute = (element: ReactNode) => <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
const named = <K extends string>(load: () => Promise<Record<K, () => ReactNode>>, name: K) =>
	lazy(() => load().then((m) => ({ default: m[name] })));

const DiscoverRoute = named(() => import('@/routes/feeds/discover'), 'DiscoverRoute');
const LatestRoute = named(() => import('@/routes/feeds/latest'), 'LatestRoute');
const CuratedRoute = named(() => import('@/routes/feeds/curated'), 'CuratedRoute');
const QuoteRoute = named(() => import('@/routes/quote'), 'QuoteRoute');
const AuthorRoute = named(() => import('@/routes/author'), 'AuthorRoute');
const TopicRoute = named(() => import('@/routes/topic'), 'TopicRoute');
const SearchRoute = named(() => import('@/routes/search'), 'SearchRoute');
const ProfileRoute = named(() => import('@/routes/profile/profile'), 'ProfileRoute');
const FavoritesRoute = named(() => import('@/routes/favorites'), 'FavoritesRoute');
const MyQuotesRoute = named(() => import('@/routes/my-quotes'), 'MyQuotesRoute');
const SettingsRoute = named(() => import('@/routes/settings'), 'SettingsRoute');
const SubmitRoute = named(() => import('@/routes/submit'), 'SubmitRoute');
const TermsRoute = named(() => import('@/routes/legal/terms'), 'TermsRoute');
const PrivacyRoute = named(() => import('@/routes/legal/privacy'), 'PrivacyRoute');
const LoginRoute = named(() => import('@/routes/auth/login'), 'LoginRoute');
const DeviceRoute = named(() => import('@/routes/auth/device'), 'DeviceRoute');
const AdminDashboardRoute = lazy(() =>
	import('@/routes/admin/dashboard').then((m) => ({ default: m.AdminDashboardRoute }))
);
const AdminSubmissionsRoute = lazy(() =>
	import('@/routes/admin/submissions').then((m) => ({ default: m.AdminSubmissionsRoute }))
);
const AdminVerificationRoute = lazy(() =>
	import('@/routes/admin/verification').then((m) => ({ default: m.AdminVerificationRoute }))
);
const AdminCurationRoute = lazy(() =>
	import('@/routes/admin/curation').then((m) => ({ default: m.AdminCurationRoute }))
);
const AdminPlaceholderRoute = lazy(() =>
	import('@/routes/admin/placeholder').then((m) => ({ default: m.AdminPlaceholderRoute }))
);
const KitRoute = named(() => import('@/routes/dev/kit'), 'KitRoute');

/** A console page behind its own role gate (the API enforces the same). */
const adminPage = (page: AdminPage, title: string, element?: ReactNode) => ({
	path: adminPaths[page].slice(ADMIN_BASE.length + 1),
	handle: { admin: page },
	element: (
		<RoleRoute allow={ADMIN_ACCESS[page]} fallback={<PageSkeleton />} forbidden={<Forbidden homeHref={ADMIN_BASE} />}>
			{lazyRoute(element ?? <AdminPlaceholderRoute title={title} />)}
		</RoleRoute>
	)
});

export const router = createBrowserRouter([
	{
		element: <SiteShell />,
		children: [
			// Public: anyone, signed in or not, and indexable.
			{ index: true, element: <LandingRoute /> },
			// The feeds and the topic index run at the wide (1180) width.
			{ path: 'discover', element: lazyRoute(<DiscoverRoute />), handle: { wide: true } },
			{ path: 'latest', element: lazyRoute(<LatestRoute />), handle: { wide: true } },
			{ path: 'curated', element: lazyRoute(<CuratedRoute />), handle: { wide: true } },
			{ path: 'q/:id', element: lazyRoute(<QuoteRoute />) },
			{ path: 'authors/:slug', element: lazyRoute(<AuthorRoute />) },
			{ path: 'topics', element: lazyRoute(<TopicRoute />) },
			{ path: 'topics/:slug', element: lazyRoute(<TopicRoute />) },
			{ path: 'search', element: lazyRoute(<SearchRoute />) },
			{ path: 'terms', element: lazyRoute(<TermsRoute />) },
			{ path: 'privacy', element: lazyRoute(<PrivacyRoute />) },
			// Sign-in: an email link or OAuth, never a password. Flat paths.
			{ path: 'login', element: lazyRoute(<LoginRoute />) },
			// The account pages: a session, or /login?redirect= and back.
			{
				element: (
					<ProtectedRoute fallback={<PageSkeleton />}>
						<Outlet />
					</ProtectedRoute>
				),
				children: [
					{ path: 'favorites', element: lazyRoute(<FavoritesRoute />), handle: { wide: 'page' } },
					{ path: 'my-quotes', element: lazyRoute(<MyQuotesRoute />) },
					{ path: 'settings', element: lazyRoute(<SettingsRoute />), handle: { wide: 'page' } },
					{ path: 'submit', element: lazyRoute(<SubmitRoute />) },
					// `qotm login` opens /device?user_code=: approving needs a session.
					{ path: 'device', element: lazyRoute(<DeviceRoute />) }
				]
			},
			// `/@ada`: the profile checks for the `@` (a segment cannot carry a
			// literal prefix). Last, so every named route above wins.
			{ path: ':handle', element: lazyRoute(<ProfileRoute />) },
			{ path: ':handle/:tab', element: lazyRoute(<ProfileRoute />) }
		]
	},
	{
		path: ADMIN_BASE,
		// The role gate is UI, not security: every endpoint behind it enforces
		// the same roles server-side. Staff with any review role see the console;
		// each page narrows it further (QOT-70).
		element: (
			<RoleRoute allow={STAFF_ROLES} fallback={<AppShellSkeleton />} forbidden={<Forbidden />}>
				<AdminShell />
			</RoleRoute>
		),
		children: [
			{
				index: true,
				handle: { admin: 'dashboard' },
				element: <AdminIndex dashboard={lazyRoute(<AdminDashboardRoute />)} />
			},
			adminPage('quotes', 'Quotes'),
			adminPage('submissions', 'Submissions', <AdminSubmissionsRoute />),
			adminPage('verification', 'Verification queue', <AdminVerificationRoute />),
			adminPage('curation', 'Curation queue', <AdminCurationRoute />),
			adminPage('reports', 'Reports'),
			adminPage('authors', 'Authors'),
			adminPage('sources', 'Sources'),
			adminPage('topics', 'Topics'),
			adminPage('users', 'Users'),
			adminPage('releases', 'Dataset releases'),
			adminPage('audit', 'Audit logs')
		]
	},
	// Dev only: the kit gallery the component tests compare with qotm_kit.
	...(import.meta.env.DEV ? [{ path: '/_kit', element: lazyRoute(<KitRoute />) }] : []),
	{ path: '*', element: <NotFound /> }
]);
