import { cn } from '../../lib/utils';
import { Eyebrow } from '../ui/eyebrow';
import { TopicTag } from '../ui/topic-tag';
import { Stats, type Stat } from './stats';

type AuthorHeaderProps = {
	name: string;
	/** The lifespan line the API writes ("1930–2002 · computer scientist"). */
	line?: string | null;
	topics?: { slug: string; name: string }[];
	stats?: Stat[];
	className?: string;
};

/** qotm_kit AuthorHeader: "Author", the name, the lifespan line and top topics, with stats on the right. */
function AuthorHeader({ name, line, topics = [], stats = [], className }: AuthorHeaderProps) {
	return (
		<header className={cn('flex flex-wrap items-end justify-between gap-page pt-page pb-tile', className)}>
			<div className="min-w-0">
				<Eyebrow>Author</Eyebrow>
				<h1 className="m-0 text-h1">{name}</h1>
				{line ? (
					<p className="m-0 mt-2 flex flex-wrap items-center gap-2 font-mono text-[13px]/[1.6] text-muted-foreground">
						{line}
					</p>
				) : null}
				{topics.length ? (
					<div className="mt-4 flex flex-wrap gap-1.5">
						{topics.map((t) => (
							<TopicTag key={t.slug} slug={t.slug}>
								{t.name}
							</TopicTag>
						))}
					</div>
				) : null}
			</div>
			<Stats items={stats} />
		</header>
	);
}

export { AuthorHeader };
export type { AuthorHeaderProps };
