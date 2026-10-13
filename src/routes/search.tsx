import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { track } from '@/shared/analytics';
import { PageSkeleton, StateScreen } from '@/shared/layouts';
import {
	Button,
	Card,
	EmptyState,
	Notice,
	PageMeta,
	Pagination,
	QuoteCard,
	SearchField,
	Tabs,
	TextLink
} from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useSearchQuery } from '@/features/quotes/api';
import { useQuoteActions } from '@/features/quotes/use-quote-actions';

type Type = 'quotes' | 'authors' | 'topics';
const TYPES: Type[] = ['quotes', 'authors', 'topics'];
const PAGE = 20;
const n = (v: number) => v.toLocaleString('en-US');

function TopicCard({ slug, name, quotes, curated }: { slug: string; name: string; quotes: number; curated: number }) {
	return (
		<Card label="Topic">
			<TextLink to={paths.topic(slug)}>{name}</TextLink>
			<p className="mt-1.5 mb-0 text-[15px] text-muted-foreground">
				{n(quotes)} quotes, {n(curated)} curated
			</p>
		</Card>
	);
}

/**
 * Search (artboard Search): the field, quotes / authors / topics tabs with
 * their counts, the results, an empty state per tab with its CLI command and
 * the offline note. The query, tab and page live in the URL (?q=, ?type=,
 * ?page=); the header's search lands here.
 */
export function SearchRoute() {
	const [params, setParams] = useSearchParams();
	const navigate = useNavigate();
	const q = (params.get('q') ?? '').trim();
	const type: Type = TYPES.find((t) => t === params.get('type')) ?? 'quotes';
	const page = Math.max(1, Number(params.get('page')) || 1);
	const act = useQuoteActions();
	const { data, isFetching, isError, refetch } = useSearchQuery({ q, type, page, limit: PAGE }, { skip: !q });
	// Topics that match, beside the quote results (as the artboard shows them).
	const { data: topicHits } = useSearchQuery(
		{ q, type: 'topics', limit: 2 },
		{ skip: !q || type !== 'quotes' || !data?.counts.topics }
	);

	const tracked = useRef('');
	useEffect(() => {
		const key = `${type}|${q}`;
		if (!data || isFetching || page !== 1 || tracked.current === key) return;
		tracked.current = key;
		track('search_performed', { type, results: data.total ? 'some' : 'none' });
	}, [data, isFetching, page, q, type]);

	const go = (next: Record<string, string | undefined>) => {
		const p = new URLSearchParams(params);
		for (const [k, v] of Object.entries(next)) {
			if (v) p.set(k, v);
			else p.delete(k);
		}
		setParams(p);
	};
	const command = `qotm search "${q}"`;
	const counts = data?.counts;

	let results: React.ReactNode;
	if (!q) {
		results = (
			<EmptyState title="Search quotes, authors and topics." command='qotm search "simplicity"'>
				Words from a quote, an author’s name or a topic all work.
			</EmptyState>
		);
	} else if (isError) {
		results = (
			<StateScreen compact title="The search did not run." description="Check your connection and try again.">
				<Button variant="outline" onClick={() => void refetch()}>
					Try again
				</Button>
			</StateScreen>
		);
	} else if (!data || (isFetching && data.q !== q)) {
		results = <PageSkeleton />;
	} else if (data.total === 0) {
		results = (
			<EmptyState command={command} title={`No ${type} match “${q}”.`}>
				{type === 'quotes'
					? 'Try fewer words, or search authors and topics.'
					: type === 'authors'
						? 'Try a surname, or search the quotes themselves.'
						: 'The topics are a fixed list: see them all on the topics page.'}
			</EmptyState>
		);
	} else {
		results = (
			<>
				{type === 'quotes' ? (
					<div className="flex flex-col gap-stack">
						{data.quotes.map((quote) => (
							<QuoteCard key={quote.id} quote={quote} variant="compact" onAction={act(quote.id)} />
						))}
					</div>
				) : type === 'authors' ? (
					<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
						{data.authors.map((a) => (
							<Card key={a.slug} label="Author">
								<TextLink to={paths.author(a.slug)}>{a.name}</TextLink>
								<p className="mt-1.5 mb-0 text-[15px] text-muted-foreground">
									{a.line && a.line !== '—' ? `${a.line} · ` : ''}
									{n(a.quotes)} quotes
								</p>
							</Card>
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
						{data.topics.map((t) => (
							<TopicCard key={t.slug} slug={t.slug} name={t.name} quotes={t.counts.quotes} curated={t.counts.curated} />
						))}
					</div>
				)}
				{data.lastPage > 1 ? (
					<Pagination
						page={data.currentPage}
						pageSize={data.pageSize}
						total={data.total}
						onPage={(p) => go({ page: String(p) })}
					/>
				) : null}
				{type === 'quotes' && topicHits?.topics.length ? (
					<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
						{topicHits.topics.map((t) => (
							<TopicCard key={t.slug} slug={t.slug} name={t.name} quotes={t.counts.quotes} curated={t.counts.curated} />
						))}
					</div>
				) : null}
			</>
		);
	}

	return (
		<div className="flex flex-col gap-card-y pt-10 pb-14">
			<PageMeta title={q ? `Search: ${q}` : 'Search'} />
			<h1 className="m-0 text-h1">Search.</h1>
			<SearchField
				key={q}
				defaultValue={q}
				shortcut={null}
				aria-label="Search"
				onSubmit={(value) =>
					navigate(`${paths.search(value.trim())}${type !== 'quotes' && value.trim() ? `&type=${type}` : ''}`)
				}
			/>
			{q ? (
				<Tabs
					label="Results"
					items={TYPES.map((t) => ({
						id: t,
						label: t,
						count: counts?.[t],
						to: `${paths.search(q)}${t === 'quotes' ? '' : `&type=${t}`}`
					}))}
					active={type}
				/>
			) : null}
			{results}
			{q ? (
				<Notice tone="dark">The same search works offline: {command}</Notice>
			) : (
				<p className="m-0 font-mono text-[13px] text-muted-foreground">
					Or browse{' '}
					<Link to={paths.topics} className="text-link">
						all topics
					</Link>
					.
				</p>
			)}
		</div>
	);
}
