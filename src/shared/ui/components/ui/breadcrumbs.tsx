import * as React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';

type Crumb = string | { label: React.ReactNode; to?: string };

/** qotm_kit Breadcrumbs: mono trail, slash separated; the last item is the current page. */
function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
	return (
		<nav
			aria-label="Breadcrumb"
			className={cn('flex flex-wrap gap-2 font-mono text-[13px]/[1.6] text-muted-foreground', className)}
		>
			{items.map((raw, i) => {
				const it = typeof raw === 'string' ? { label: raw } : raw;
				const last = i === items.length - 1;
				return (
					<span key={i} className="inline-flex gap-2">
						{last || !it.to ? (
							<span aria-current={last ? 'page' : undefined} className={cn(last && 'text-ink')}>
								{it.label}
							</span>
						) : (
							<Link
								to={it.to}
								className="tap text-muted-foreground no-underline transition-colors duration-[180ms] hover:text-ink"
							>
								{it.label}
							</Link>
						)}
						{last ? null : (
							<span aria-hidden="true" className="text-stone-400">
								/
							</span>
						)}
					</span>
				);
			})}
		</nav>
	);
}

export { Breadcrumbs };
export type { Crumb };
