import { Link } from 'react-router';
import { paths } from '@/lib/paths';
import type { QuoteCardEntity } from '@/shared/types';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../ui/status-badge';
import { TopicTag } from '../ui/topic-tag';
import { ActionBar, type QuoteAction } from './action-bar';
import { Attribution } from './attribution';

type QuoteCardProps = {
	quote: QuoteCardEntity;
	/** `feed`: the full card. `compact`: lists and sidebars, without topics or source. */
	variant?: 'feed' | 'compact';
	showActions?: boolean;
	onAction?: (action: QuoteAction, on?: boolean) => void;
	className?: string;
};

/**
 * qotm_kit QuoteCard: status and id, the quote linking to its page, its
 * attribution, then topics and actions. Canonical and curated quotes are not
 * recommended (they are already in, or headed for, the collection).
 */
function QuoteCard({ quote: q, variant = 'feed', showActions = true, onAction, className }: QuoteCardProps) {
	const compact = variant === 'compact';
	const badges = [...(q.type === 'original' ? ['ORIGINAL'] : q.type === 'private' ? ['PRIVATE'] : []), q.status];
	// A private quote's status is PRIVATE too: show it once.
	const unique = [...new Set(badges)];
	const actions: QuoteAction[] =
		q.status === 'CURATED' || q.type === 'canonical'
			? ['like', 'favorite', 'share']
			: ['like', 'favorite', 'recommend', 'share'];
	return (
		<article
			className={cn(
				'flex flex-col rounded-card border border-border bg-card transition-colors duration-[180ms] hover:border-stone-400',
				compact ? 'gap-2 px-grid py-4' : 'gap-3 px-card-x py-card-y',
				className
			)}
		>
			{/* Badges wrap on a narrow card; the id keeps the far end of the last row. */}
			<div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1.5">
				{unique.map((b) => (
					<StatusBadge key={b} status={b} />
				))}
				<span className="ml-auto font-mono text-[12px] text-stone-600">{q.id}</span>
			</div>
			<Link
				to={paths.quote(q.id)}
				className={cn(
					'font-display font-semibold tracking-[-0.01em] text-pretty text-ink no-underline decoration-clay-200 decoration-1 underline-offset-[5px] hover:underline',
					compact ? 'text-[17px]/[1.35]' : 'text-quote-card'
				)}
			>
				“{q.text}”
			</Link>
			<Attribution
				type={q.type}
				author={q.author?.name ?? q.attribution}
				authorSlug={q.author?.slug}
				work={compact ? null : q.work}
				year={compact ? null : q.year}
				contributor={q.contributor ? q.contributor.handle : null}
				compact={compact}
			/>
			{(!compact && q.topics.length) || showActions ? (
				<div
					className={cn(
						'flex flex-wrap items-center justify-between gap-2.5',
						!compact && 'mt-1 border-t border-border pt-3'
					)}
				>
					<div className="flex flex-wrap gap-1.5">
						{compact
							? null
							: q.topics.map((t) => (
									<TopicTag key={t.slug} slug={t.slug}>
										{t.name}
									</TopicTag>
								))}
					</div>
					{showActions ? (
						<ActionBar
							size="sm"
							className="-mr-2"
							actions={actions}
							counts={q.counts}
							state={q.viewer}
							onAction={onAction}
						/>
					) : null}
				</div>
			) : null}
		</article>
	);
}

export { QuoteCard };
export type { QuoteCardProps };
