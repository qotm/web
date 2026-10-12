import { Link, Outlet, useMatches, useNavigate } from 'react-router';
import { useMeQuery, useMyFavoritesCountQuery, useMyQuotesCountQuery } from '@/features/account/api';
import { signOut, useAuth } from '@/shared/auth';
import { ErrorBoundary } from '@/shared/layouts';
import { Avatar, Button, InstallPill, Menu, SearchField, SiteFooter, SiteHeader, cn } from '@/shared/ui';
import { ADMIN_BASE, paths } from '@/lib/paths';
import { FOOTER_COLUMNS, SITE_NAV } from './nav';

/** Roles that see the admin console (the same list the console's guard allows). */
const STAFF = ['verifier', 'moderator', 'admin', 'superuser'];
const isStaff = (role?: string | null) => (role ?? '').split(',').some((r) => STAFF.includes(r.trim()));

/** A route opts into the 1180 width with `handle: { wide: true }`. */
function useWide() {
	return useMatches().some((m) => (m.handle as { wide?: boolean } | undefined)?.wide);
}

function AccountMenu() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { data: me } = useMeQuery();
	const { data: quotes } = useMyQuotesCountQuery();
	const { data: favorites } = useMyFavoritesCountQuery();
	const handle = me?.handle;
	const role = isStaff(me?.role ?? user?.role) ? (me?.role ?? user?.role ?? 'member').split(',')[0] : 'member';
	return (
		<Menu
			label="Account"
			trigger={<Avatar name={me?.name ?? user?.name} handle={handle} src={me?.image ?? user?.image} />}
			onSelect={(id) => {
				if (id === 'out') void signOut().then(() => navigate('/'));
			}}
			items={[
				{ heading: `${handle ? `@${handle}` : (user?.email ?? '')} · ${role === 'superuser' ? 'admin' : role}` },
				...(handle ? [{ id: 'profile', label: 'Profile', to: paths.profile(handle) }] : []),
				{ id: 'mine', label: 'My quotes', to: paths.myQuotes, hint: quotes?.toLocaleString('en-US') },
				{ id: 'fav', label: 'Favorites', to: paths.favorites, hint: favorites?.toLocaleString('en-US') },
				{ id: 'settings', label: 'Settings', to: paths.settings },
				{ divider: true },
				...(isStaff(me?.role ?? user?.role) ? [{ id: 'admin', label: 'Admin', to: ADMIN_BASE }] : []),
				{ id: 'out', label: 'Sign out' }
			]}
		/>
	);
}

/**
 * The site: header, the routed page at 960 (or 1180 for `wide` routes) and
 * the footer. Signed in, the header has search, Submit and the account menu;
 * signed out, the install command and Sign in.
 */
export function SiteShell() {
	const wide = useWide();
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useAuth();
	return (
		<ErrorBoundary>
			<div className="flex min-h-screen flex-col bg-background">
				<SiteHeader items={SITE_NAV} wide={wide} menuExtra={[{ id: 'search', label: 'search', to: paths.search() }]}>
					{isLoading ? null : isAuthenticated ? (
						<>
							<SearchField
								size="sm"
								className="narrow:hidden"
								placeholder="Search quotes, authors, topics"
								onSubmit={(q) => navigate(paths.search(q))}
							/>
							<Button asChild variant="outline" size="sm">
								<Link to={paths.submit}>Submit</Link>
							</Button>
							<AccountMenu />
						</>
					) : (
						<>
							<InstallPill copyable className="narrow:hidden" />
							<Button asChild size="sm">
								<Link to={paths.login}>Sign in</Link>
							</Button>
						</>
					)}
				</SiteHeader>
				<main className="flex-1">
					{/* Content-box, as the kit's .qk-page: 960 (or 1180) of content inside the gutters. */}
					<div className={cn('mx-auto box-content px-page', wide ? 'max-w-site-wide' : 'max-w-site')}>
						<Outlet />
					</div>
				</main>
				<SiteFooter columns={FOOTER_COLUMNS} />
			</div>
		</ErrorBoundary>
	);
}
