import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Empty } from '@/shared/layouts';
import { Button, Eyebrow, Field, Select, Tabs, TopicTag } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useTopicsQuery } from '../api';
import { QuoteList } from './quote-list';

export type FeedName = 'discover' | 'latest' | 'curated';

const TYPES = [
	{ value: '', label: 'All quotes' },
	{ value: 'canonical', label: 'Canonical' },
	{ value: 'original', label: 'Declared originals' }
] as const;

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
	const { data: topics } = useTopicsQuery();

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
				<QuoteList
					args={{ feed, topic: topic || undefined, type: type || undefined }}
					empty={
						<Empty
							title={filtered ? 'No quotes match these filters.' : 'No quotes here yet.'}
							description={filtered ? 'Try another topic or type.' : undefined}
							action={
								filtered ? (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setParams(new URLSearchParams(), { replace: true })}
									>
										Clear filters
									</Button>
								) : undefined
							}
						/>
					}
				/>
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
