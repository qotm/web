import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { Button, Eyebrow, Field, Pagination, QuoteCard, Select, Tabs, TopicTag } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useQuoteFeedQuery, useTopicsQuery, type FeedArgs } from '../api';
import { useQuoteActions } from '../use-quote-actions';

export type FeedName = 'discover' | 'latest' | 'curated';

const PAGE = 10;
const TYPES = [
	{ value: '', label: 'All quotes' },
	{ value: 'canonical', label: 'Canonical' },
	{ value: 'original', label: 'Declared originals' }
] as const;

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

type FeedLayoutProps = {
	feed: FeedName;
	eyebrow: string;
	title: string;
	intro: ReactNode;
	/** The feed's own note at the foot of the side column. */
	note: ReactNode;
};

const TABS = (['discover', 'latest', 'curated'] as const).map((id) => ({ id, label: id, to: paths[id] }));

/**
 * The three feeds' shared layout (artboards Discover, Latest, Curated): the
 * heading, the feed tabs, quote cards loading more by cursor, and the side
 * column's topic filter, type select and the feed's note. Filters live in
 * the URL (?topic=, ?type=).
 */
export function FeedLayout({ feed, eyebrow, title, intro, note }: FeedLayoutProps) {
	const [params, setParams] = useSearchParams();
	const topic = params.get('topic') ?? '';
	const type = (params.get('type') ?? '') as '' | 'canonical' | 'original';
	const filters = `${feed}|${topic}|${type}`;
	// The cursors loaded so far, reset when the filters change.
	const [pages, setPages] = useState<{ key: string; cursors: (string | undefined)[] }>({
		key: filters,
		cursors: [undefined]
	});
	const cursors = pages.key === filters ? pages.cursors : [undefined];
	const { data: topics } = useTopicsQuery();
	const { data: firstPage } = useQuoteFeedQuery({
		feed,
		topic: topic || undefined,
		type: type || undefined,
		limit: PAGE
	});

	const set = (key: string, value: string) => {
		const next = new URLSearchParams(params);
		if (value) next.set(key, value);
		else next.delete(key);
		setParams(next, { replace: true });
	};
	const filtered = Boolean(topic || type);

	return (
		<div className="grid grid-cols-[minmax(0,1fr)_240px] gap-12 pt-10 pb-12 narrow:grid-cols-1 narrow:gap-page">
			<div className="flex min-w-0 flex-col gap-grid">
				<div>
					<Eyebrow>{eyebrow}</Eyebrow>
					<h1 className="m-0 mb-2.5 text-h1">{title}</h1>
					<p className="m-0 text-muted-foreground">{intro}</p>
				</div>
				<Tabs
					label="Feeds"
					items={TABS.map((t) => ({ ...t, to: `${t.to}${params.size ? `?${params}` : ''}` }))}
					active={feed}
				/>
				{firstPage && firstPage.list.length === 0 ? (
					<Empty
						title={filtered ? 'No quotes match these filters.' : 'No quotes here yet.'}
						description={filtered ? 'Try another topic or type.' : undefined}
						action={
							filtered ? (
								<Button variant="outline" size="sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
									Clear filters
								</Button>
							) : undefined
						}
					/>
				) : (
					cursors.map((cursor, i) => (
						<FeedPage
							key={cursor ?? 'first'}
							args={{ feed, topic: topic || undefined, type: type || undefined, limit: PAGE, cursor }}
							first={i === 0}
							last={i === cursors.length - 1}
							onMore={(next) => setPages({ key: filters, cursors: [...cursors, next] })}
						/>
					))
				)}
			</div>
			<aside className="flex flex-col gap-card-y">
				<div>
					<div
						id="feed-topics"
						className="mb-2.5 font-mono text-[12px]/[1.6] tracking-[0.14em] text-muted-foreground uppercase"
					>
						Topics
					</div>
					<nav aria-labelledby="feed-topics" className="flex flex-wrap gap-2">
						{(topics?.list ?? []).map((t) => {
							const on = topic === t.slug;
							const next = new URLSearchParams(params);
							if (on) next.delete('topic');
							else next.set('topic', t.slug);
							return (
								<TopicTag key={t.slug} slug={t.slug} to={`?${next}`} selected={on} replace>
									{t.name}
								</TopicTag>
							);
						})}
					</nav>
				</div>
				<Field label="Type" htmlFor="feed-type">
					<Select
						id="feed-type"
						size="sm"
						value={type}
						onChange={(e) => set('type', e.target.value)}
						options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
					/>
				</Field>
				{note}
			</aside>
		</div>
	);
}
