import { type ReactNode, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { Menu, X } from 'lucide-react';
import { Logo, cn } from '@/shared/ui';
import { UserMenu, type ShellUser } from './user-menu';

export type NavItem = {
	label: string;
	to: string;
	icon: ReactNode;
	/** Match the route exactly (use for the index/dashboard route). */
	end?: boolean;
};

/**
 * Warm a route's chunk before the click, given its `to`. Wired to hover, keyboard
 * focus and touch-start, so it covers pointer, keyboard and mobile — a phone has
 * no hover, but `touchstart` still lands a few hundred ms before the click.
 * Optional: apps without code-split routes just leave it off.
 */
export type PreloadRoute = (to: string) => void;

export type ComingSoonItem = {
	label: string;
	icon: ReactNode;
};

type AppShellProps = {
	nav: NavItem[];
	user: ShellUser;
	onSignOut: () => void;
	/** Brand lockup at the top of the sidebar. Defaults to the Qotm Web mark. */
	brand?: ReactNode;
	/** Locked "Coming soon" nav entries shown below the main nav. */
	comingSoon?: ComingSoonItem[];
	/** Slot pinned to the bottom of the sidebar (e.g. the market ticker). */
	sidebarFooter?: ReactNode;
	/** Topbar search slot. */
	search?: ReactNode;
	/** Topbar action slot to the left of the user menu (e.g. the notification bell). */
	topbarActions?: ReactNode;
	/** Page content. Defaults to the router <Outlet /> when omitted. */
	children?: ReactNode;
	/** Warms a route's code-split chunk on nav hover/focus/touch. */
	preloadRoute?: PreloadRoute;
};

function DefaultBrand() {
	return (
		<div className="px-2">
			<Logo />
		</div>
	);
}

function Sidebar({
	nav,
	comingSoon,
	sidebarFooter,
	brand,
	onNavigate,
	preloadRoute
}: Pick<AppShellProps, 'nav' | 'comingSoon' | 'sidebarFooter' | 'brand' | 'preloadRoute'> & {
	onNavigate?: () => void;
}) {
	return (
		<div className="flex h-full flex-col p-4">
			<div className="py-2">{brand ?? <DefaultBrand />}</div>
			{/*
			 * `min-h-0` is load-bearing: a flex child defaults to `min-height: auto`,
			 * which lets it grow past its flex-basis to fit its content instead of
			 * scrolling — on a short viewport that pushed `sidebarFooter` off the
			 * bottom of the fixed-height sidebar with no way to reach it. Scrollbar
			 * is hidden (still scrollable via wheel/touch/keyboard) to match the
			 * flat, chrome-free sidebar surface — nav is short enough that a visible
			 * track would only appear briefly during scroll anyway.
			 */}
			<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				<nav className="flex flex-col gap-0.5">
					{nav.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							onClick={onNavigate}
							onPointerEnter={() => preloadRoute?.(item.to)}
							onFocus={() => preloadRoute?.(item.to)}
							onTouchStart={() => preloadRoute?.(item.to)}
							className={({ isActive }) =>
								cn(
									'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors [&_svg]:size-[18px]',
									isActive ? 'bg-accent text-accent-foreground' : 'text-body hover:bg-secondary'
								)
							}
						>
							{item.icon}
							{item.label}
						</NavLink>
					))}
				</nav>
				{comingSoon && comingSoon.length > 0 ? (
					<>
						<div className="mx-2 my-3 h-px bg-border" />
						<p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.09em] text-mute">Coming soon</p>
						<div className="flex flex-col gap-0.5">
							{comingSoon.map((item) => (
								<div
									key={item.label}
									className="flex cursor-default items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-mute [&_svg]:size-4"
								>
									<span className="flex items-center gap-3">
										{item.icon}
										{item.label}
									</span>
									<span className="rounded-full bg-accent px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em] text-accent-foreground">
										Soon
									</span>
								</div>
							))}
						</div>
					</>
				) : null}
			</div>
			{sidebarFooter ? <div className="pt-3">{sidebarFooter}</div> : null}
		</div>
	);
}

/**
 * Authenticated app shell (shared by Client + Admin): fixed sidebar at desktop,
 * a slide-in drawer on mobile, and a sticky topbar with search / actions / user
 * menu. Presentational only — nav and slots are passed in, and sign-out is
 * delegated via `onSignOut`, so it stays decoupled from the auth package.
 */
export function AppShell({
	nav,
	user,
	onSignOut,
	brand,
	comingSoon,
	sidebarFooter,
	search,
	topbarActions,
	children,
	preloadRoute
}: AppShellProps) {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
				<Sidebar
					nav={nav}
					comingSoon={comingSoon}
					sidebarFooter={sidebarFooter}
					brand={brand}
					preloadRoute={preloadRoute}
				/>
			</aside>

			{/* Mobile drawer — always mounted so it animates on both enter and exit. */}
			<div
				className={cn('fixed inset-0 z-50 lg:hidden', !mobileOpen && 'pointer-events-none')}
				aria-hidden={!mobileOpen}
				inert={!mobileOpen}
			>
				<div
					onClick={() => setMobileOpen(false)}
					aria-hidden="true"
					className={cn(
						'absolute inset-0 bg-scrim transition-opacity duration-300 ease-out motion-reduce:transition-none',
						mobileOpen ? 'opacity-100' : 'opacity-0'
					)}
				/>
				<aside
					className={cn(
						'absolute inset-y-0 left-0 w-64 border-r border-border bg-card',
						'transition-transform duration-300 ease-out motion-reduce:transition-none',
						mobileOpen ? 'translate-x-0' : '-translate-x-full'
					)}
				>
					<button
						type="button"
						onClick={() => setMobileOpen(false)}
						aria-label="Close menu"
						className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-full text-mute hover:bg-secondary"
					>
						<X className="size-5" />
					</button>
					<Sidebar
						nav={nav}
						comingSoon={comingSoon}
						sidebarFooter={sidebarFooter}
						brand={brand}
						preloadRoute={preloadRoute}
						onNavigate={() => setMobileOpen(false)}
					/>
				</aside>
			</div>

			{/* Main column */}
			<div className="flex min-h-screen flex-col lg:pl-64">
				<header className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-border bg-card px-4 py-2.5">
					<button
						type="button"
						onClick={() => setMobileOpen(true)}
						aria-label="Open menu"
						className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-secondary lg:hidden"
					>
						<Menu className="size-5" />
					</button>
					{search ?? <div className="flex-1" />}
					<div className="ml-auto flex items-center gap-2">
						{topbarActions}
						<UserMenu user={user} onSignOut={onSignOut} />
					</div>
				</header>
				<main className="flex-1">
					<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children ?? <Outlet />}</div>
				</main>
			</div>
		</div>
	);
}
