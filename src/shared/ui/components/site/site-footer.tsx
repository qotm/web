import * as React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';
import { Logo } from '../brand/logo';

type FooterLink = { id: string; label: string; to?: string; href?: string };
type FooterColumn = { title: string; links: FooterLink[] };

type SiteFooterProps = {
	columns: FooterColumn[];
	tagline?: string;
	note?: React.ReactNode;
	wide?: boolean;
	className?: string;
};

const linkClasses =
	'w-fit border-0 font-mono text-[13px]/[1.6] text-ink no-underline transition-colors duration-[180ms] hover:text-clay-600';

/** qotm_kit SiteFooter: the brand and tagline, link columns, and the licence note. */
function SiteFooter({
	columns,
	tagline = 'A thought between commands.',
	note = 'MIT · github.com/wesscoby/qotm',
	wide = false,
	className
}: SiteFooterProps) {
	return (
		<footer className={cn('border-t border-border pt-12 pb-page', className)}>
			<div
				className={cn(
					'mx-auto box-content grid grid-cols-[1fr_2fr] gap-page px-page narrow:grid-cols-1',
					wide ? 'max-w-site-wide' : 'max-w-site'
				)}
			>
				<div className="flex items-start gap-3">
					<Logo lockup="symbol" height={22} alt="" />
					<div>
						<b className="font-display text-[18px] font-semibold">qotm</b>
						<p className="mt-0.5 mb-0 font-mono text-[13px]/[1.6] text-muted-foreground">{tagline}</p>
					</div>
				</div>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-card-y">
					{columns.map((c) => (
						<div key={c.title} className="flex flex-col gap-2">
							<h4 className="m-0 mb-1 font-mono text-[12px]/[1.15] font-normal tracking-[0.14em] text-stone-600 uppercase">
								{c.title}
							</h4>
							{c.links.map((l) =>
								l.to ? (
									<Link key={l.id} to={l.to} className={linkClasses}>
										{l.label}
									</Link>
								) : (
									<a key={l.id} href={l.href} className={linkClasses} rel="noopener noreferrer">
										{l.label}
									</a>
								)
							)}
						</div>
					))}
				</div>
				<div className="col-span-full border-t border-border pt-card-y font-mono text-[13px]/[1.6] text-muted-foreground">
					{note}
				</div>
			</div>
		</footer>
	);
}

export { SiteFooter };
export type { SiteFooterProps, FooterColumn, FooterLink };
