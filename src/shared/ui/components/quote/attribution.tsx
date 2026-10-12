import * as React from 'react';
import { Link } from 'react-router';
import { paths } from '@/lib/paths';
import { cn } from '../../lib/utils';

type AttributionProps = {
	type?: 'canonical' | 'original' | 'private';
	/** The author's name (canonical), or the owner's (private, else "you"). */
	author?: React.ReactNode;
	/** The author's slug, to link their page. */
	authorSlug?: string | null;
	work?: string | null;
	year?: number | null;
	/** The submitter's handle (with or without @). `null`: a former member. */
	contributor?: string | null;
	onDark?: boolean;
	/** Drops the "submitted by" line (compact cards). */
	compact?: boolean;
	className?: string;
};

/**
 * qotm_kit Attribution: "— Author · Work, year" with "submitted by @x" below
 * for canonical quotes, "— Declared original by @x" for originals, and the
 * private line for a member's own quotes.
 */
function Attribution({
	type = 'canonical',
	author,
	authorSlug,
	work,
	year,
	contributor,
	onDark = false,
	compact = false,
	className
}: AttributionProps) {
	const handle = contributor ? (contributor.startsWith('@') ? contributor : `@${contributor}`) : null;
	const link = cn(
		'border-b no-underline transition-colors duration-[180ms]',
		onDark
			? 'border-border text-dark-foreground hover:border-dark-accent hover:text-dark-accent'
			: 'border-border text-ink hover:border-clay-600 hover:text-clay-600'
	);
	const sub = onDark ? 'text-dark-muted' : 'text-muted-foreground';
	const dash = (
		<span aria-hidden="true" className={onDark ? 'text-dark-accent' : 'text-clay-600'}>
			—
		</span>
	);
	const who = handle ? (
		<Link to={paths.profile(handle.slice(1))} className={link}>
			{handle}
		</Link>
	) : (
		'a former member'
	);
	const root = cn('font-mono text-[13px]/[1.6]', onDark ? 'text-dark-foreground' : 'text-ink', className);

	if (type === 'original')
		return (
			<div className={root}>
				{dash} Declared original by {who}
			</div>
		);
	if (type === 'private')
		return (
			<div className={root}>
				{dash} {author || 'you'} <span className={sub}>· private, only you can see this</span>
			</div>
		);
	const source = [work, year].filter(Boolean).join(', ');
	return (
		<div className={root}>
			<div>
				{dash}{' '}
				{authorSlug ? (
					<Link to={paths.author(authorSlug)} className={link}>
						{author}
					</Link>
				) : (
					author
				)}
				{source ? <span className={sub}> · {source}</span> : null}
			</div>
			{compact || contributor === undefined ? null : (
				<div className={cn('pl-5', sub)}>
					submitted by{' '}
					{handle ? (
						<Link to={paths.profile(handle.slice(1))} className={cn(link, sub)}>
							{handle}
						</Link>
					) : (
						'a former member'
					)}
				</div>
			)}
		</div>
	);
}

export { Attribution };
export type { AttributionProps };
