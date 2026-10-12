import * as React from 'react';
import { Link, NavLink } from 'react-router';
import { cn, glyph } from '../../lib/utils';
import { Logo } from '../brand/logo';
import { Menu } from '../ui/menu';

type SiteNavItem = { id: string; label: string; to: string };

type SiteHeaderProps = {
	items: SiteNavItem[];
	/** The nav item to mark current; by default the one whose route matches. */
	active?: string;
	/** 1180 (feeds, admin-like pages) instead of 960. */
	wide?: boolean;
	/** The right side: search, Submit, the avatar menu or Sign in. */
	children?: React.ReactNode;
	/** Extra items for the narrow-screen menu, after the nav (search, the install command). */
	menuExtra?: { id: string; label: string; to: string }[];
	/** Fold the nav into a menu at 760 (the default); off where other navigation covers it (the console's sidebar). */
	collapse?: boolean;
	className?: string;
};

const navLink =
	'border-0 border-b border-transparent py-1 font-mono text-[13px]/[1.6] text-muted-foreground no-underline transition-colors duration-[180ms] hover:text-ink aria-[current=page]:border-clay-500 aria-[current=page]:text-ink';

/**
 * qotm_kit SiteHeader: the brand, the primary nav (mono, the current page
 * underlined in clay) and the right-hand actions. At 760px and below the nav
 * folds into a menu, as the kit hides it there.
 */
function SiteHeader({
	items,
	active,
	wide = false,
	children,
	menuExtra = [],
	collapse = true,
	className
}: SiteHeaderProps) {
	return (
		<header className={cn('border-b border-border bg-background', className)}>
			<div
				className={cn(
					'mx-auto box-content flex h-header items-center gap-tile px-page',
					wide ? 'max-w-site-wide' : 'max-w-site'
				)}
			>
				<Link to="/" aria-label="qotm home" className="inline-flex items-center gap-2.5 border-0 text-ink no-underline">
					<Logo lockup="symbol" height={24} alt="" />
					<b className="font-display text-[20px] font-semibold tracking-[-0.01em]">qotm</b>
				</Link>
				<nav aria-label="Primary" className="flex items-center gap-card-y narrow:hidden">
					{items.map((it) =>
						active !== undefined ? (
							<Link key={it.id} to={it.to} aria-current={active === it.id ? 'page' : undefined} className={navLink}>
								{it.label}
							</Link>
						) : (
							<NavLink key={it.id} to={it.to} className={navLink}>
								{it.label}
							</NavLink>
						)
					)}
				</nav>
				<div className="ml-auto flex items-center gap-3">
					{children}
					{collapse ? (
						<div className="roomy:hidden">
							<Menu
								label="Menu"
								trigger={
									<span className="inline-flex h-control-sm items-center gap-1.5 rounded-control border border-border px-3 font-mono text-[13px] text-ink">
										menu <span aria-hidden="true">{glyph('⌄')}</span>
									</span>
								}
								items={[...items, ...menuExtra].map((it) => ({ id: it.id, label: it.label, to: it.to }))}
							/>
						</div>
					) : null}
				</div>
			</div>
		</header>
	);
}

export { SiteHeader };
export type { SiteHeaderProps, SiteNavItem };
