import { useState } from 'react';
import { Link } from 'react-router';
import type { MyQuoteEntity } from '@/shared/types';
import { Attribution, Button, Card, LifecycleSteps, Notice, StatusBadge, lifecycleOf } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { DeleteDialog, EditDialog, EvidenceDialog, SubmitOriginalDialog } from './my-quote-dialogs';

type Open = 'edit' | 'delete' | 'submit' | 'evidence' | null;

/** Quotes anyone may open: their own page exists for everyone. */
const PUBLIC = [
	'PUBLISHED',
	'COMMUNITY_DISCOVERY',
	'CURATION_CANDIDATE',
	'CURATION_REVIEW',
	'CURATED',
	'DATASET_RELEASE',
	'VERIFIED',
	'UNDER_REVIEW',
	'NEEDS_EVIDENCE',
	'DISPUTED'
];

/**
 * One of the member's quotes (artboard MyQuotes), shaped by where it is:
 * private (submit as original, edit, delete), needs evidence (the verifier's
 * note, add evidence), in review (its lifecycle), public (its lifecycle,
 * linking to its page).
 */
export function MyQuoteCard({ quote: q }: { quote: MyQuoteEntity }) {
	const [open, setOpen] = useState<Open>(null);
	const close = () => setOpen(null);
	const priv = q.type === 'private';
	const original = q.type === 'original';
	const text = <>“{q.text}”</>;
	const textClass = 'font-display text-[20px]/[1.35] font-semibold text-ink';

	return (
		<Card as="article" aria-label={q.text}>
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-2">
					<div className="flex flex-wrap gap-2">
						{priv ? (
							<>
								<StatusBadge status="PRIVATE" />
								<StatusBadge status="PERSONAL" />
							</>
						) : original ? (
							<>
								<StatusBadge status="ORIGINAL" />
								<StatusBadge status={q.status} />
							</>
						) : (
							<StatusBadge status={q.status} />
						)}
					</div>
					{priv ? null : <span className="font-mono text-[12px] text-stone-600">{q.id}</span>}
				</div>
				{!priv && PUBLIC.includes(q.status) ? (
					<Link
						to={paths.quote(q.id)}
						className={`${textClass} no-underline decoration-clay-200 underline-offset-[5px] hover:underline`}
					>
						{text}
					</Link>
				) : (
					<div className={textClass}>{text}</div>
				)}
				{priv ? (
					<>
						<Attribution type="private" author={q.author?.name ?? q.attribution ?? undefined} />
						<Notice tone="wash">
							Only you see it. To share it, submit it: it then goes through the community-original checks.
						</Notice>
						<div className="flex flex-wrap gap-2.5">
							<Button variant="outline" size="sm" onClick={() => setOpen('submit')}>
								Submit as original
							</Button>
							<Button variant="quiet" size="sm" onClick={() => setOpen('edit')}>
								Edit
							</Button>
							<Button variant="danger" size="sm" onClick={() => setOpen('delete')}>
								Delete
							</Button>
						</div>
					</>
				) : (
					<>
						{original ? null : (
							<Attribution
								author={q.author?.name ?? q.attribution ?? 'Unknown'}
								authorSlug={q.author?.slug}
								work={q.work}
								year={q.year}
								contributor={q.contributor?.handle ?? null}
								compact
							/>
						)}
						{['REJECTED', 'WITHDRAWN'].includes(q.status) ? null : <LifecycleSteps {...lifecycleOf(q)} />}
						{q.review && ['NEEDS_EVIDENCE', 'REJECTED', 'WITHDRAWN', 'DISPUTED'].includes(q.status) ? (
							<Notice
								tone="attention"
								title={
									q.status === 'NEEDS_EVIDENCE'
										? 'A verifier needs a primary source.'
										: q.status === 'REJECTED'
											? 'A verifier turned it down.'
											: q.status === 'DISPUTED'
												? 'It is disputed.'
												: 'A moderator withdrew it.'
								}
							>
								{q.review.by ? `@${q.review.by}: ` : ''}“{q.review.note}”
							</Notice>
						) : null}
						{q.status === 'NEEDS_EVIDENCE' ? (
							<div>
								<Button variant="outline" size="sm" onClick={() => setOpen('evidence')}>
									Add evidence
								</Button>
							</div>
						) : null}
					</>
				)}
			</div>
			{priv ? (
				<>
					<SubmitOriginalDialog quote={q} open={open === 'submit'} onClose={close} />
					<EditDialog quote={q} open={open === 'edit'} onClose={close} />
					<DeleteDialog quote={q} open={open === 'delete'} onClose={close} />
				</>
			) : null}
			{q.status === 'NEEDS_EVIDENCE' ? <EvidenceDialog quote={q} open={open === 'evidence'} onClose={close} /> : null}
		</Card>
	);
}
