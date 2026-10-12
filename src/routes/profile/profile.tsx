import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { Empty, NotFound, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { ProfileEntity } from '@/shared/types';
import { Button, ContributionRow, PageMeta, Pagination, ProfileHeader, QuoteCard, StatCard, Tabs } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { QuoteList } from '@/features/quotes/components/quote-list';
import { useQuoteActions } from '@/features/quotes/use-quote-actions';
import {
	useContributionStatsQuery,
	useContributionsQuery,
	useProfileFavoritesQuery,
	useProfileQuery
} from '@/features/profiles/api';

type Tab = 'quotes' | 'contributions' | 'favorites';
const PAGE = 10;

function Contributions({ handle }: { handle: string }) {
	const [params, setParams] = useSearchParams();
	const page = Math.max(1, Number(params.get('page')) || 1);
	const { data: stats } = useContributionStatsQuery(handle);
	const { data, isLoading, isError, refetch } = useContributionsQuery({ handle, page, limit: PAGE });
	return (
		<>
			<div className="grid grid-cols-4 gap-grid narrow:grid-cols-2">
				<StatCard label="submitted" value={stats?.submitted ?? '–'} />
				<StatCard label="verified" value={stats?.verified ?? '–'} />
				<StatCard label="curated" value={stats?.curated ?? '–'} />
				<StatCard label="corrections accepted" value={stats?.correctionsAccepted ?? '–'} />
			</div>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The contributions did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : data.total === 0 ? (
				<Empty
					title="No public contributions yet."
					description="Quotes they submit appear here once they are public."
				/>
			) : (
				<>
					<div>
						{data.list.map((c) => (
							<ContributionRow key={c.id} contribution={c} />
						))}
					</div>
					{data.lastPage > 1 ? (
						<Pagination
							page={data.currentPage}
							pageSize={data.pageSize}
							total={data.total}
							onPage={(p) => setParams(p === 1 ? {} : { page: String(p) })}
						/>
					) : null}
				</>
			)}
		</>
	);
}

function Favorites({ handle }: { handle: string }) {
	const { data, isLoading, isError } = useProfileFavoritesQuery(handle);
	const act = useQuoteActions();
	if (isLoading) return <PageSkeleton />;
	if (isError || !data) return <Empty title="Their favorites are private." />;
	if (!data.list.length) return <Empty title="No favorites yet." />;
	return (
		<>
			{data.list.map((q) => (
				<QuoteCard key={q.id} quote={q} onAction={act(q.id)} />
			))}
		</>
	);
}

/**
 * A member's profile (artboards Profile and Contributions): the header with
 * role, join date, bio and counts; their own quotes; their contributions
 * with stats and lifecycle states; their favorites when they made them
 * public. `/@ada`, `/@ada/contributions`; an old handle lands on the new one.
 */
export function ProfileRoute() {
	const { handle: raw = '', tab: rawTab } = useParams();
	const asked = raw.startsWith('@') ? raw.slice(1) : '';
	const { data: p, isLoading, error, refetch } = useProfileQuery(asked, { skip: !asked });
	if (!asked) return <NotFound />;
	const tab: Tab | null =
		rawTab === undefined || rawTab === 'quotes'
			? 'quotes'
			: rawTab === 'contributions'
				? 'contributions'
				: rawTab === 'favorites'
					? 'favorites'
					: null;
	if (!tab) return <NotFound />;

	if (isLoading)
		return (
			<div className="py-page">
				<PageSkeleton />
			</div>
		);
	if (error || !p) {
		const notFound = (error as { status?: number } | undefined)?.status === 404;
		return (
			<div className="py-section">
				<PageMeta title={notFound ? 'Member not found' : `@${asked}`} robots="noindex" />
				{notFound ? (
					<StateScreen
						compact
						code="404"
						title={`No member called @${asked}.`}
						description="Handles can change; check the link."
					>
						<Button asChild variant="outline">
							<Link to={paths.discover}>Discover quotes</Link>
						</Button>
					</StateScreen>
				) : (
					<StateScreen compact title="The profile did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				)}
			</div>
		);
	}
	// An old handle: the API answered with the current one.
	if (p.handle.toLowerCase() !== asked.toLowerCase())
		return <Navigate replace to={paths.profile(p.handle, rawTab as 'quotes' | 'contributions' | undefined)} />;

	return <Profile p={p} tab={tab} />;
}

function Profile({ p, tab }: { p: ProfileEntity; tab: Tab }) {
	const tabs = [
		{ id: 'quotes', label: 'quotes', count: p.stats.quotes, to: paths.profile(p.handle) },
		{
			id: 'contributions',
			label: 'contributions',
			count: p.stats.contributions,
			to: paths.profile(p.handle, 'contributions')
		},
		...(p.showFavorites ? [{ id: 'favorites', label: 'favorites', to: `${paths.profile(p.handle)}/favorites` }] : [])
	];
	return (
		<div className="flex flex-col gap-grid pt-4 pb-14">
			<PageMeta
				title={`${p.name || `@${p.handle}`} (@${p.handle})`}
				description={p.bio ?? `@${p.handle}’s quotes and contributions on qotm.`}
				canonical={`${window.location.origin}${paths.profile(p.handle)}`}
			/>
			<ProfileHeader profile={p} />
			<Tabs label="Profile" items={tabs} active={tab} />
			{tab === 'contributions' ? (
				<Contributions handle={p.handle} />
			) : tab === 'favorites' && p.showFavorites ? (
				<Favorites handle={p.handle} />
			) : tab === 'favorites' ? (
				<Empty title="Their favorites are private." />
			) : (
				<QuoteList
					args={{ feed: 'latest', contributor: p.handle, type: 'original' }}
					empty={<Empty title="No quotes of their own yet." description="Originals they publish appear here." />}
				/>
			)}
		</div>
	);
}
