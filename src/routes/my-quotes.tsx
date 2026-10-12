import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { MeQuotesData } from '@/shared/types';
import { Button, Eyebrow, PageMeta, Pagination, Tabs } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useMyQuotesQuery } from '@/features/account/api';
import { MyQuoteCard } from '@/features/account/components/my-quote-card';

type Tab = NonNullable<NonNullable<MeQuotesData['query']>['tab']>;
const TABS: { id: Tab; label: string }[] = [
	{ id: 'all', label: 'all' },
	{ id: 'private', label: 'private' },
	{ id: 'review', label: 'in review' },
	{ id: 'public', label: 'public' }
];
const EMPTY: Record<Tab, { title: string; command?: string }> = {
	all: { title: 'No quotes yet. Keep one privately, or submit one for everyone.', command: 'qotm add' },
	private: { title: 'No private quotes.', command: 'qotm add' },
	review: { title: 'Nothing waiting for review.' },
	public: { title: 'None of your quotes is public yet.' }
};
const PAGE = 10;

function MyQuotesPage({
	tab,
	cursor,
	last,
	onMore
}: {
	tab: Tab;
	cursor?: string;
	last: boolean;
	onMore: (c: string) => void;
}) {
	const { data, isFetching } = useMyQuotesQuery({ tab, cursor, limit: PAGE });
	if (!data) return null;
	return (
		<>
			{data.list.map((q) => (
				<MyQuoteCard key={q.id} quote={q} />
			))}
			{last && data.nextCursor ? (
				<Pagination mode="more" loading={isFetching} onPage={() => onMore(data.nextCursor!)} />
			) : null}
		</>
	);
}

/**
 * The member's own quotes (artboard MyQuotes): all / private / in review /
 * public tabs with counts (?tab=), each quote shaped by where it is, loading
 * more by cursor.
 */
export function MyQuotesRoute() {
	const [params] = useSearchParams();
	const tab: Tab = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'all';
	const [loaded, setLoaded] = useState<{ tab: Tab; cursors: (string | undefined)[] }>({ tab, cursors: [undefined] });
	const cursors = loaded.tab === tab ? loaded.cursors : [undefined];
	const first = useMyQuotesQuery({ tab, limit: PAGE });
	const counts = first.data?.tabs;

	return (
		<div className="flex flex-col gap-card-y pt-10 pb-14">
			<PageMeta title="My quotes" robots="noindex" />
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<Eyebrow>Yours</Eyebrow>
					<h1 className="m-0 mb-2.5 text-h1">My quotes.</h1>
					<p className="m-0 text-muted-foreground">
						Private quotes and everything you’ve submitted, with where each one is.
					</p>
				</div>
				<Button asChild>
					<Link to={paths.submit}>New quote</Link>
				</Button>
			</header>
			<Tabs
				label="My quotes"
				items={TABS.map((t) => ({
					...t,
					count: counts?.[t.id],
					to: t.id === 'all' ? paths.myQuotes : `${paths.myQuotes}?tab=${t.id}`
				}))}
				active={tab}
			/>
			{first.isLoading ? (
				<PageSkeleton />
			) : first.isError ? (
				<StateScreen compact title="Your quotes did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void first.refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !first.data?.list.length ? (
				<Empty title={EMPTY[tab].title} command={EMPTY[tab].command} />
			) : (
				cursors.map((cursor, i) => (
					<MyQuotesPage
						key={cursor ?? 'first'}
						tab={tab}
						cursor={cursor}
						last={i === cursors.length - 1}
						onMore={(c) => setLoaded({ tab, cursors: [...cursors, c] })}
					/>
				))
			)}
		</div>
	);
}
