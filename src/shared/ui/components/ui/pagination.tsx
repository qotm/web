import { cn, glyph } from '../../lib/utils';
import { Button } from './button';

type PaginationProps = {
	/** 1-based. */
	page?: number;
	pageSize?: number;
	total?: number;
	onPage?: (page: number) => void;
	/** `pages`: range and prev / next. `more`: one "load more" button, for feeds. */
	mode?: 'pages' | 'more';
	loading?: boolean;
	className?: string;
};

const n = (v: number) => v.toLocaleString('en-US');

const pagerButton =
	'cursor-pointer rounded-control border border-border bg-transparent px-3 py-[5px] font-mono text-[13px]/[1.6] text-ink transition-colors duration-[180ms] enabled:hover:border-foreground disabled:cursor-not-allowed disabled:text-stone-400';

/** qotm_kit Pagination: "26–50 of 12,631" with prev / next, or "load more". */
function Pagination({
	page = 1,
	pageSize = 25,
	total = 0,
	onPage,
	mode = 'pages',
	loading = false,
	className
}: PaginationProps) {
	if (mode === 'more')
		return (
			<div className={cn('flex items-center justify-center py-stack', className)}>
				<Button variant="outline" mono disabled={loading} onClick={() => onPage?.(page + 1)}>
					{loading ? 'loading…' : 'load more'}
				</Button>
			</div>
		);
	const from = total ? (page - 1) * pageSize + 1 : 0;
	const to = Math.min(total, page * pageSize);
	const last = Math.max(1, Math.ceil(total / pageSize));
	return (
		<nav
			aria-label="Pagination"
			className={cn(
				'flex items-center justify-between gap-4 py-stack font-mono text-[13px]/[1.6] text-muted-foreground',
				className
			)}
		>
			<span>
				{n(from)}–{n(to)} of {n(total)}
			</span>
			<span className="flex items-center gap-stack">
				<button type="button" className={pagerButton} disabled={page <= 1} onClick={() => onPage?.(page - 1)}>
					{glyph('←')} prev
				</button>
				<span>
					{page} / {last}
				</span>
				<button type="button" className={pagerButton} disabled={page >= last} onClick={() => onPage?.(page + 1)}>
					next {glyph('→')}
				</button>
			</span>
		</nav>
	);
}

export { Pagination };
export type { PaginationProps };
