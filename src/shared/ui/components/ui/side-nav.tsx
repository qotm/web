import * as React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';

type SideNavItem = {
	id: string;
	label: React.ReactNode;
	to?: string;
	count?: React.ReactNode;
	/** Marks the count as needing attention (a queue with work in it). */
	attention?: boolean;
};

type SideNavSection = { title?: string; items: SideNavItem[] };

type SideNavProps = Omit<React.ComponentProps<'nav'>, 'onSelect'> & {
	sections: SideNavSection[];
	active?: string;
	/** Called instead of following `to` (or for items without one). */
	onSelect?: (id: string) => void;
};

const itemClasses =
	'flex w-full items-center justify-between gap-2 rounded-control border-0 bg-transparent px-3 py-[7px] text-left font-sans text-[15px]/[1.6] text-ink no-underline transition-colors duration-[180ms] hover:bg-card hover:text-ink aria-[current=page]:bg-card aria-[current=page]:font-medium aria-[current=page]:shadow-[inset_0_0_0_1px_var(--color-border)]';

/** qotm_kit SideNav: the admin console's grouped navigation, with counts and attention markers. */
function SideNav({ sections, active, onSelect, className, ...props }: SideNavProps) {
	return (
		<nav className={cn('flex w-sidebar flex-col gap-card-y', className)} {...props}>
			{sections.map((s, i) => (
				<div key={s.title ?? i} className="flex flex-col gap-0.5">
					{s.title ? (
						<div className="px-3 pb-2 font-mono text-[12px]/[1.6] tracking-[0.14em] text-stone-600 uppercase">
							{s.title}
						</div>
					) : null}
					{s.items.map((it) => {
						const current = active === it.id ? ('page' as const) : undefined;
						const inner = (
							<>
								<span>{it.label}</span>
								{it.count != null ? (
									<span
										data-attention={it.attention || undefined}
										className={cn(
											'font-mono text-[12px] text-stone-600',
											it.attention && 'rounded-pill bg-clay-100 px-[7px] text-clay-700'
										)}
									>
										{it.count}
									</span>
								) : null}
							</>
						);
						const select = onSelect
							? (e: React.MouseEvent) => {
									e.preventDefault();
									onSelect(it.id);
								}
							: undefined;
						return it.to ? (
							<Link key={it.id} to={it.to} aria-current={current} onClick={select} className={itemClasses}>
								{inner}
							</Link>
						) : (
							<button
								key={it.id}
								type="button"
								aria-current={current}
								onClick={() => onSelect?.(it.id)}
								className={cn(itemClasses, 'cursor-pointer')}
							>
								{inner}
							</button>
						);
					})}
				</div>
			))}
		</nav>
	);
}

export { SideNav };
export type { SideNavProps, SideNavSection, SideNavItem };
