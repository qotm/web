import * as React from 'react';
import { Link } from 'react-router';
import { paths } from '@/lib/paths';
import type { QuoteEntity } from '@/shared/types';
import { cn } from '../../lib/utils';
import { CardLabel } from '../ui/card';
import { StatusBadge } from '../ui/status-badge';
import { TopicTag } from '../ui/topic-tag';

function Row({ k, children }: { k: string; children: React.ReactNode }) {
	if (children == null || children === '') return null;
	return (
		<div className="grid grid-cols-[120px_1fr] gap-4 border-t border-border py-2.5 text-[15px]/[1.5] first:border-t-0">
			<dt className="pt-px font-mono text-[13px] text-muted-foreground">{k}</dt>
			<dd className="m-0 min-w-0 [overflow-wrap:anywhere]">{children}</dd>
		</div>
	);
}

const link =
	'border-b border-clay-200 text-link no-underline transition-colors duration-[180ms] hover:border-clay-700 hover:text-clay-700';

const Handle = ({ handle }: { handle: string }) => (
	<Link to={paths.profile(handle)} className={link}>
		@{handle}
	</Link>
);

type ProvenancePanelProps = {
	quote: QuoteEntity;
	/** An original's matching result; the default is the kit's "no match" line. */
	matching?: React.ReactNode;
	className?: string;
};

/**
 * qotm_kit ProvenancePanel: where a quote comes from (author, work, year,
 * source, context, topics), or the declared-original version, then the
 * credits (submitter, verifier, releases, id) on a paper band.
 */
function ProvenancePanel({
	quote: q,
	matching = 'No known matching attribution found.',
	className
}: ProvenancePanelProps) {
	const original = q.type === 'original';
	const sourceText = q.source?.title ?? null;
	const sourceUrl = q.sourceUrl ?? q.source?.url ?? null;
	return (
		<section
			aria-label="Provenance"
			className={cn(
				'box-border flex flex-col rounded-card border border-border bg-card px-card-x py-card-y text-foreground',
				className
			)}
		>
			<div className="mb-1.5 flex items-center justify-between">
				<CardLabel className="m-0">Provenance</CardLabel>
				<StatusBadge status={q.status} />
			</div>
			<dl className="m-0">
				{original ? (
					<>
						<Row k="Author">
							Declared original by {q.contributor ? <Handle handle={q.contributor.handle} /> : 'a former member'}
						</Row>
						<Row k="Matching">{matching}</Row>
					</>
				) : (
					<>
						<Row k="Author">
							{q.author ? (
								<Link to={paths.author(q.author.slug)} className={link}>
									{q.author.name}
								</Link>
							) : (
								q.attribution
							)}
						</Row>
						<Row k="Work">{q.work}</Row>
						<Row k="Year">{q.year}</Row>
						<Row k="Source">
							{sourceUrl ? (
								<a href={sourceUrl} className={link} rel="noopener noreferrer" target="_blank">
									{sourceText ?? sourceUrl}
								</a>
							) : (
								sourceText
							)}
						</Row>
						<Row k="Context">{q.context}</Row>
					</>
				)}
				<Row k="Topics">
					{q.topics.length ? (
						<span className="flex flex-wrap gap-1.5">
							{q.topics.map((t) => (
								<TopicTag key={t.slug} slug={t.slug}>
									{t.name}
								</TopicTag>
							))}
						</span>
					) : null}
				</Row>
			</dl>
			<div className="-mx-card-x mt-2 -mb-card-y rounded-b-card border-t border-border bg-background px-card-x pt-1.5 pb-2">
				<dl className="m-0 [&_dd]:font-mono [&_dd]:text-[13px]">
					{original ? null : (
						<Row k="Submitted by">{q.contributor ? <Handle handle={q.contributor.handle} /> : 'a former member'}</Row>
					)}
					<Row k="Verified by">{q.verifier ? <Handle handle={q.verifier.handle} /> : null}</Row>
					<Row k="Verified on">{q.verifiedAt ? q.verifiedAt.slice(0, 10) : null}</Row>
					<Row k="Releases">{q.releases.length ? q.releases.join(' · ') : null}</Row>
					<Row k="Quote id">
						<code className="text-[13px]">{q.id}</code>
					</Row>
				</dl>
			</div>
		</section>
	);
}

export { ProvenancePanel };
export type { ProvenancePanelProps };
