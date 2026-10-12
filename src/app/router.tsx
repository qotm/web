import { Suspense, lazy, type ReactNode } from 'react';
import { Outlet, createBrowserRouter } from 'react-router';
import { ProtectedRoute, RoleRoute, signOut, useAuth } from '@/shared/auth';
import {
	AppShell,
	AppShellSkeleton,
	ErrorBoundary,
	Forbidden,
	NotFound,
	PageSkeleton,
	RouteFallback
} from '@/shared/layouts';
import { ADMIN_BASE } from '@/lib/paths';
import { ADMIN_NAV_ITEMS } from './nav';
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
const AdminHomeRoute = named(() => import('@/routes/admin/home'), 'AdminHomeRoute');
const KitRoute = named(() => import('@/routes/dev/kit'), 'KitRoute');

function AdminShell() {
	const { user } = useAuth();
	return (
		<ErrorBoundary>
			<AppShell nav={ADMIN_NAV_ITEMS} user={user ?? {}} onSignOut={() => void signOut()} />
		</ErrorBoundary>
	);
}

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
			// The account pages: a session, or /login?redirect= and back.
			{
				element: (
					<ProtectedRoute fallback={<PageSkeleton />}>
						<Outlet />
					</ProtectedRoute>
				),
				children: [
					{ path: 'favorites', element: lazyRoute(<FavoritesRoute />) },
					{ path: 'my-quotes', element: lazyRoute(<MyQuotesRoute />) },
					{ path: 'settings', element: lazyRoute(<SettingsRoute />) },
					{ path: 'submit', element: lazyRoute(<SubmitRoute />) }
				]
			},
			// `/@ada`: the profile checks for the `@` (a segment cannot carry a
			// literal prefix). Last, so every named route above wins.
			{ path: ':handle', element: lazyRoute(<ProfileRoute />) },
			{ path: ':handle/:tab', element: lazyRoute(<ProfileRoute />) }
		]
	},
	// Sign-in: an email link or OAuth, never a password. Flat on purpose.
	{ path: '/login', element: lazyRoute(<LoginRoute />) },
	{
		path: ADMIN_BASE,
		// The role gate is UI, not security: every endpoint behind it enforces
		// the same roles server-side. Staff with any review role see the console;
		// each page narrows it further (QOT-70).
		element: (
			<RoleRoute
				allow={['verifier', 'moderator', 'admin', 'superuser']}
				fallback={<AppShellSkeleton />}
				forbidden={<Forbidden />}
			>
				<AdminShell />
			</RoleRoute>
		),
		children: [{ index: true, element: lazyRoute(<AdminHomeRoute />) }]
	},
	// Dev only: the kit gallery the component tests compare with qotm_kit.
	...(import.meta.env.DEV ? [{ path: '/_kit', element: lazyRoute(<KitRoute />) }] : []),
	{ path: '*', element: <NotFound /> }
]);
