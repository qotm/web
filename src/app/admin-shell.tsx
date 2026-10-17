import { Link, Navigate, Outlet, useMatches } from 'react-router';
import { COUNTS_POLL_MS, useAdminCountsQuery } from '@/features/admin/api';
import { useMeQuery } from '@/features/account/api';
import { useAuth } from '@/shared/auth';
import { ErrorBoundary } from '@/shared/layouts';
import { Avatar, ConsoleMenu, SideNav, SiteHeader, StatusBadge, TextLink, cn } from '@/shared/ui';
import { ADMIN_BASE, adminPaths, paths } from '@/lib/paths';
import { ADMIN_SECTIONS, REVIEW_PAGES, canOpen, rolesOf, type AdminPage } from './nav';

/** The page a route belongs to: `handle: { admin: 'verification' }`. */
function useAdminPage() {
	return useMatches()
		.map((m) => (m.handle as { admin?: AdminPage } | undefined)?.admin)
		.filter(Boolean)
		.at(-1);
}

/** The role the header shows: the highest the session holds (the superuser reads as admin). */
function shownRole(role?: string | null) {
	const roles = rolesOf(role);
	for (const r of ['superuser', 'admin', 'moderator', 'verifier'])
		if (roles.includes(r)) return r === 'superuser' ? 'admin' : r;
	return 'member';
}

/**
 * The console: the admin header (view site, the role badge, the avatar) over
 * the sidebar and the page, at 1180. The sidebar lists only the pages the
 * role may open, with live queue sizes. Under 1024 it folds into the Console
 * menu, a bar above the page, so a tablet's page gets the full width; the
 * review queues fold it at every width, for the list and the item side by side.
 */
export function AdminShell() {
	const { user } = useAuth();
	const { data: me } = useMeQuery();
	const role = me?.role ?? user?.role;
	const { data: counts } = useAdminCountsQuery(undefined, { pollingInterval: COUNTS_POLL_MS });
	const active = useAdminPage();
	const review = Boolean(active && REVIEW_PAGES.includes(active));
	const sections = ADMIN_SECTIONS.map((s) => ({
		title: s.title,
		items: s.items
			.filter((it) => canOpen(it.id, role))
			.map((it) => {
				const count = it.count ? counts?.[it.count] : undefined;
				return {
					id: it.id,
					label: it.label,
					to: adminPaths[it.id],
					count,
					attention: Boolean(it.attention && count)
				};
			})
	})).filter((s) => s.items.length);
	return (
		<ErrorBoundary>
			<div className="flex min-h-screen flex-col bg-background">
				<SiteHeader items={[{ id: 'admin', label: 'admin', to: ADMIN_BASE }]} active="" wide collapse={false}>
					<TextLink to={paths.home} variant="quiet" mono className="tap whitespace-nowrap">
						view site
					</TextLink>
					<StatusBadge status={shownRole(role)} />
					<Link to={me ? paths.profile(me.handle) : paths.home} aria-label="Your profile" className="tap border-0">
						<Avatar name={me?.name ?? user?.name} handle={me?.handle} src={me?.image ?? user?.image} />
					</Link>
				</SiteHeader>
				<div className="flex-1">
					<div
						className={cn(
							'mx-auto box-content grid max-w-site-wide grid-cols-[240px_minmax(0,1fr)] gap-10 px-page pt-page pb-14',
							'max-lg:grid-cols-1 max-lg:gap-card-y',
							// The review queues fill the window (ReviewQueue), over a short foot.
							review && 'grid-cols-1 gap-card-y lg:pb-6'
						)}
					>
						{review ? null : (
							<SideNav aria-label="Console" sections={sections} active={active} className="max-lg:hidden" />
						)}
						{/* Under 1024 (a tablet or a phone) the sidebar is one bar that opens the console's sections. */}
						<ConsoleMenu sections={sections} active={active} className={review ? 'lg:w-[340px]' : 'lg:hidden'} />
						<main className="min-w-0">
							<Outlet />
						</main>
					</div>
				</div>
			</div>
		</ErrorBoundary>
	);
}

/** `/admin`: the dashboard for those who may read it, else the first page the role may open. */
export function AdminIndex({ dashboard }: { dashboard: React.ReactNode }) {
	const { user } = useAuth();
	if (canOpen('dashboard', user?.role)) return <>{dashboard}</>;
	const first = ADMIN_SECTIONS.flatMap((s) => s.items).find((it) => canOpen(it.id, user?.role));
	return first ? <Navigate to={adminPaths[first.id]} replace /> : null;
}
