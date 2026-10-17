import type { MatchEntity } from '@/shared/types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const METHODS = { exact: 'normalized exact match', fuzzy: 'fuzzy text match', author: 'same author' } as const;

type MatchCompareProps = {
	submitted: string;
	/** A match as the public quote page has it, or as the review queues do (which also match by author). */
	match: Omit<MatchEntity, 'method'> & { method: keyof typeof METHODS };
	onDismiss?: () => void;
	onMarkDuplicate?: () => void;
	/** Its own two answers; off where a decision panel already offers them. */
	actions?: boolean;
	busy?: boolean;
	className?: string;
};

/** qotm_kit MatchCompare: a submission beside the quote it may duplicate, with the method and score. */
function MatchCompare({
	submitted,
	match: m,
	onDismiss,
	onMarkDuplicate,
	actions = true,
	busy = false,
	className
}: MatchCompareProps) {
	const col = 'rounded-field border border-border bg-background px-4 py-3.5';
	const label = 'mb-2 flex items-center gap-2 font-mono text-[12px]/[1.6] tracking-[0.12em] text-stone-600 uppercase';
	const text = 'm-0 mb-1.5 font-display text-[17px]/[1.4] font-medium';
	return (
		<section
			aria-label="Possible match"
			className={cn(
				'box-border flex flex-col gap-4 rounded-card border border-border bg-card px-card-x py-card-y',
				className
			)}
		>
			<div className="flex flex-wrap items-center gap-3">
				<span className="inline-flex items-center gap-1.5 rounded-pill border border-transparent bg-clay-100 px-[9px] py-px font-mono text-[11px]/[18px] tracking-[0.12em] whitespace-nowrap text-clay-700 uppercase">
					<span aria-hidden="true" className="text-[12px] tracking-normal">
						?
					</span>
					possible match
				</span>
				<span className="font-mono text-[13px]/[1.6] text-muted-foreground">
					{METHODS[m.method]}
					{m.score != null ? ` · ${Math.round(m.score * 100)}% similar` : ''}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
				<div className={col}>
					<div className={label}>Submitted</div>
					<p className={text}>“{submitted}”</p>
				</div>
				<div className={col}>
					<div className={label}>
						Existing {m.match ? <code className="text-[12px] tracking-normal normal-case">{m.match.id}</code> : null}
					</div>
					<p className={text}>“{m.match?.text ?? ''}”</p>
					{m.match?.author ? (
						<div className="font-mono text-[13px]/[1.6] text-ink">
							<span aria-hidden="true" className="text-clay-600">
								—
							</span>{' '}
							{m.match.author}
						</div>
					) : null}
				</div>
			</div>
			{actions ? (
				<div className="flex flex-wrap gap-2.5">
					<Button variant="outline" size="sm" disabled={busy} onClick={onDismiss}>
						Not a duplicate
					</Button>
					<Button size="sm" disabled={busy} onClick={onMarkDuplicate}>
						Mark duplicate
					</Button>
				</div>
			) : null}
		</section>
	);
}

export { MatchCompare };
export type { MatchCompareProps };
