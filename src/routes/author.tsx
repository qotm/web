import { Link, useParams, useSearchParams } from 'react-router';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { AuthorHeader, Breadcrumbs, Button, CommandBlock, PageMeta, Tabs } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useAuthorQuery } from '@/features/quotes/api';
import { QuoteList } from '@/features/quotes/components/quote-list';

type Tab = 'all' | 'curated' | 'review';
const TABS: { id: Tab; label: string }[] = [
	{ id: 'all', label: 'all' },
	{ id: 'curated', label: 'curated' },
	{ id: 'review', label: 'in review' }
];
const EMPTY: Record<Tab, string> = {
	all: 'No public quotes by this author yet.',
	curated: 'None of their quotes is curated yet.',
	review: 'Nothing of theirs is being checked right now.'
};

/**
 * An author (artboard Author): the header with the lifespan line, top topics
 * and counts, all / curated / in review tabs (?tab=), their quote cards and
 * the terminal command for them.
 */
export function AuthorRoute() {
	const { slug = '' } = useParams();
	const [params] = useSearchParams();
	const tab: Tab = (['curated', 'review'] as const).find((t) => t === params.get('tab')) ?? 'all';
	const { data: author, isLoading, error, refetch } = useAuthorQuery(slug);

	if (isLoading)
		return (
			<div className="py-page">
				<PageSkeleton />
			</div>
		);
	if (error || !author) {
		const notFound = (error as { status?: number } | undefined)?.status === 404;
		return (
			<div className="py-section">
				<PageMeta title={notFound ? 'Author not found' : 'Author'} robots="noindex" />
				{notFound ? (
					<StateScreen compact code="404" title="No author here." description="Check the spelling, or search for them.">
						<Button asChild variant="outline">
							<Link to={`${paths.search()}?type=authors`}>Search authors</Link>
						</Button>
					</StateScreen>
				) : (
					<StateScreen compact title="The author did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-grid pt-page pb-14">
			<PageMeta
				title={author.name}
				description={`Quotes by ${author.name}${author.line && author.line !== '—' ? ` (${author.line})` : ''}, each with its source, on qotm.`}
				canonical={`${window.location.origin}${paths.author(author.slug)}`}
			/>
			<Breadcrumbs items={[{ label: 'authors', to: `${paths.search()}?type=authors` }, author.slug]} />
			<AuthorHeader
				name={author.name}
				line={author.line === '—' ? null : author.line}
				topics={author.topics}
				stats={[
					{ label: 'quotes', value: author.tabs.all },
					{ label: 'curated', value: author.tabs.curated }
				]}
			/>
			<Tabs
				label="Quotes by state"
				items={TABS.map((t) => ({
					...t,
					count: author.tabs[t.id],
					to: t.id === 'all' ? paths.author(author.slug) : `${paths.author(author.slug)}?tab=${t.id}`
				}))}
				active={tab}
			/>
			<QuoteList
				args={{ feed: 'latest', author: author.slug, state: tab }}
				empty={<Empty title={EMPTY[tab]} command={`qotm --author ${author.slug}`} />}
			/>
			<CommandBlock tone="light" glyph="~ >" command={`qotm --author ${author.slug}`} />
		</div>
	);
}
