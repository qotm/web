import { Link } from 'react-router';
import { paths } from '@/lib/paths';
import type { ContributionEntity } from '@/shared/types';
import { cn } from '../../lib/utils';
import { StatusBadge } from '../ui/status-badge';

const day = (iso: string) =>
	new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });

/** qotm_kit ContributionRow: one line of a profile's contributions, linking to the quote. */
function ContributionRow({ contribution: c, className }: { contribution: ContributionEntity; className?: string }) {
	return (
		<Link
			to={paths.quote(c.id)}
			className={cn(
				'flex items-center justify-between gap-grid border-0 border-b border-border px-1 py-3.5 text-ink no-underline transition-colors duration-[180ms] hover:bg-card hover:text-ink',
				className
			)}
		>
			<span className="flex min-w-0 flex-col gap-1">
				<span className="truncate font-display text-[17px]/[1.35] font-medium">“{c.text}”</span>
				<span className="font-mono text-[13px]/[1.6] text-muted-foreground">
					{c.type === 'original' ? 'declared original' : `— ${c.author ?? 'unknown'}`} · {day(c.submittedAt)}
					{c.release ? ` · shipped in ${c.release}` : ''}
				</span>
			</span>
			<StatusBadge status={c.status} />
		</Link>
	);
}

export { ContributionRow };
