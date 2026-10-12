import { useState, type ReactNode } from 'react';
import { PageSkeleton, StateScreen } from '@/shared/layouts';
import { Button, Pagination, QuoteCard } from '@/shared/ui';
import { useQuoteFeedQuery, type FeedArgs } from '../api';
import { useQuoteActions } from '../use-quote-actions';

/** Cards per page: the artboards show five or so, then "load more". */
export const PAGE = 10;

/** One page of the feed: the first one's states stand for the whole list. */
function FeedPage({
	args,
	first,
	last,
	onMore
}: {
	args: FeedArgs;
	first: boolean;
	last: boolean;
	onMore: (cursor: string) => void;
}) {
	const { data, isLoading, isFetching, isError, refetch } = useQuoteFeedQuery(args);
	const act = useQuoteActions();
	if (isLoading) return first ? <PageSkeleton /> : <Pagination mode="more" loading />;
	if (isError || !data)
		return first ? (
			<StateScreen compact title="The quotes did not load." description="Check your connection and try again.">
				<Button variant="outline" onClick={() => void refetch()}>
					Try again
				</Button>
			</StateScreen>
		) : (
			<Pagination mode="more" onPage={() => void refetch()} />
		);
	return (
		<>
			{data.list.map((q) => (
				<QuoteCard key={q.id} quote={q} onAction={act(q.id)} />
			))}
			{last && data.nextCursor ? (
				<Pagination mode="more" loading={isFetching} onPage={() => onMore(data.nextCursor!)} />
			) : null}
		</>
	);
}

/**
 * A list of quote cards from GET /v1/quotes, loading more by cursor. The
 * loaded pages reset when `args` change (a filter, a tab).
 */
export function QuoteList({ args, empty }: { args: Omit<FeedArgs, 'cursor' | 'limit'>; empty: ReactNode }) {
	const key = JSON.stringify(args);
	const [pages, setPages] = useState<{ key: string; cursors: (string | undefined)[] }>({ key, cursors: [undefined] });
	const cursors = pages.key === key ? pages.cursors : [undefined];
	const { data: first } = useQuoteFeedQuery({ ...args, limit: PAGE });
	if (first && first.list.length === 0) return <>{empty}</>;
	return (
		<>
			{cursors.map((cursor, i) => (
				<FeedPage
					key={cursor ?? 'first'}
					args={{ ...args, limit: PAGE, cursor }}
					first={i === 0}
					last={i === cursors.length - 1}
					onMore={(next) => setPages({ key, cursors: [...cursors, next] })}
				/>
			))}
		</>
	);
}
