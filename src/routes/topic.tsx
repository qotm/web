import { Link, useParams, useSearchParams } from 'react-router';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { TopicEntity } from '@/shared/types';
import { Button, Card, CommandBlock, Eyebrow, PageMeta, Skeleton, Tabs, TopicTag } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useTopicQuery, useTopicsQuery } from '@/features/quotes/api';
import { QuoteList } from '@/features/quotes/components/quote-list';

type Tab = 'curated' | 'all';
const n = (v: number) => v.toLocaleString('en-US');
const title = (name: string) => `${name[0].toUpperCase()}${name.slice(1)}`;

/** Every topic as a pill, the current one on (artboard Topic's strip). */
function TopicStrip({ current }: { current?: string }) {
	const { data } = useTopicsQuery();
	return (
		<nav aria-label="All topics" className="flex flex-wrap gap-2">
			{data
				? data.list.map((t) => (
						<TopicTag key={t.slug} slug={t.slug} selected={t.slug === current}>
							{t.name}
						</TopicTag>
					))
				: Array.from({ length: 15 }).map((_, i) => <Skeleton key={i} block width={96} height={26} />)}
		</nav>
	);
}

/** /topics: the taxonomy, each topic with its description and counts. */
function TopicIndex() {
	const { data, isLoading, isError, refetch } = useTopicsQuery();
	return (
		<>
			<PageMeta title="Topics" description="The topics qotm's quotes are filed under, each with its own feed." />
			<header className="pt-page pb-2">
				<Eyebrow>Topics</Eyebrow>
				<h1 className="m-0 mb-2.5 text-h1">Topics.</h1>
				<p className="m-0 text-muted-foreground">A fixed list, picked by hand. Every quote sits under one to three.</p>
			</header>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The topics did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : (
				<div className="grid grid-cols-3 gap-grid narrow:grid-cols-1">
					{data.list.map((t: TopicEntity) => (
						<Card key={t.slug} as="article" interactive className="relative">
							<h2 className="m-0 mb-1.5 text-h3">
								<Link to={paths.topic(t.slug)} className="text-ink no-underline after:absolute after:inset-0">
									{title(t.name)}
								</Link>
							</h2>
							{t.description ? <p className="m-0 mb-2 text-[15px] text-muted-foreground">{t.description}</p> : null}
							<p className="m-0 font-mono text-[13px] text-muted-foreground">
								{n(t.counts.quotes)} quotes · {n(t.counts.curated)} curated
							</p>
						</Card>
					))}
				</div>
			)}
		</>
	);
}

/**
 * A topic (artboard Topic): the all-topics strip with this one on, the
 * header with its counts and `qotm --topic`, and curated / all tabs (?tab=).
 * /topics without a slug lists the taxonomy.
 */
export function TopicRoute() {
	const { slug } = useParams();
	const [params] = useSearchParams();
	const tab: Tab = params.get('tab') === 'all' ? 'all' : 'curated';
	const { data: topic, isLoading, error, refetch } = useTopicQuery(slug ?? '', { skip: !slug });

	let body: React.ReactNode;
	if (!slug) body = <TopicIndex />;
	else if (isLoading) body = <PageSkeleton />;
	else if (error || !topic) {
		const notFound = (error as { status?: number } | undefined)?.status === 404;
		body = (
			<>
				<PageMeta title={notFound ? 'Topic not found' : 'Topic'} robots="noindex" />
				{notFound ? (
					<StateScreen
						compact
						code="404"
						title="No topic by that name."
						description="The topics are a fixed list: pick one above."
					>
						<Button asChild variant="outline">
							<Link to={paths.topics}>All topics</Link>
						</Button>
					</StateScreen>
				) : (
					<StateScreen compact title="The topic did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				)}
			</>
		);
	} else {
		body = (
			<>
				<PageMeta
					title={title(topic.name)}
					description={`Quotes on ${topic.name}, each with its source: ${n(topic.counts.quotes)} on qotm, ${n(topic.counts.curated)} in the CLI dataset.`}
					canonical={`${window.location.origin}${paths.topic(topic.slug)}`}
				/>
				<header className="flex flex-wrap items-end justify-between gap-page pt-page pb-2 narrow:flex-col narrow:items-stretch">
					<div>
						<Eyebrow>Topic</Eyebrow>
						<h1 className="m-0 mb-2.5 text-h1">{title(topic.name)}.</h1>
						<p className="m-0 text-muted-foreground">
							{topic.description ? `${topic.description} ` : ''}
							{n(topic.counts.quotes)} quotes, {n(topic.counts.curated)} curated.
						</p>
					</div>
					<CommandBlock command={`qotm --topic ${topic.slug}`} />
				</header>
				<Tabs
					label="Quotes by state"
					items={[
						{ id: 'curated', label: 'curated', count: topic.counts.curated, to: paths.topic(topic.slug) },
						{ id: 'all', label: 'all', count: topic.counts.quotes, to: `${paths.topic(topic.slug)}?tab=all` }
					]}
					active={tab}
				/>
				<QuoteList
					args={{ feed: 'latest', topic: topic.slug, state: tab }}
					empty={
						<Empty
							title={tab === 'curated' ? `Nothing on ${topic.name} is curated yet.` : `No quotes on ${topic.name} yet.`}
							command={`qotm --topic ${topic.slug}`}
						/>
					}
				/>
			</>
		);
	}

	return (
		<div className="flex flex-col gap-grid pt-page pb-14">
			<TopicStrip current={slug} />
			{body}
		</div>
	);
}
