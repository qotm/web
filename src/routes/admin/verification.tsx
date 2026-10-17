import { useState } from 'react';
import { useAdminQuoteQuery, useAdminVerificationQuery, useVerifyQuoteMutation } from '@/features/admin/api';
import { CorrectDialog } from '@/features/admin/components/correct-dialog';
import { ReviewPane, ReviewQueue, type QueueCard } from '@/features/admin/components/review-queue';
import { useQueueNav } from '@/features/admin/lib/queue-nav';
import { ago, waited } from '@/features/admin/lib/dashboard';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { notesOf, submitter, verification } from '@/features/admin/lib/queues';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { QueueItemEntity } from '@/shared/types';
import { Button, Notice, ProvenancePanel, QuoteBlock, ReviewDecision, StatusBadge, notify } from '@/shared/ui';
import { refusal } from '@/features/admin/lib/refusal';

const PAGE_SIZE = 10;

/** The API's own words for a refusal it explains ("Link the author before verifying…"). */
const card = (q: QueueItemEntity): QueueCard => ({
	id: q.id,
	who: submitter(q),
	age: waited(q.waitingSince),
	text: q.text,
	by: q.author?.name ?? (q.attribution ? `${q.attribution} · not linked` : 'Author not linked'),
	flag: !q.author,
	status: q.status
});

/** The selected quote: the submission, its provenance, notes, and the verifier's decision. */
function Selected({ item }: { item: QueueItemEntity }) {
	const nav = useQueueNav();
	const { data: quote, isLoading, isError, refetch } = useAdminQuoteQuery(item.id);
	const [verify, { isLoading: deciding }] = useVerifyQuoteMutation();
	const [correcting, setCorrecting] = useState(false);

	const head = (
		<>
			<StatusBadge status={quote?.status ?? item.status} />
			<span className="font-mono text-[12px] text-stone-600">
				{item.id} · submitted by {submitter(item)} · {ago(item.waitingSince)}
			</span>
		</>
	);
	if (isLoading)
		return (
			<ReviewPane label={`Submission ${item.id}`} head={head}>
				<PageSkeleton />
			</ReviewPane>
		);
	if (isError || !quote)
		return (
			<ReviewPane label={`Submission ${item.id}`} head={head}>
				<StateScreen compact title="This quote did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			</ReviewPane>
		);

	const notes = notesOf(quote);
	const cite = [quote.source?.title ?? quote.work, quote.year].filter(Boolean).join(', ');
	return (
		<ReviewPane
			label={`Submission ${quote.id}`}
			head={head}
			dock={
				<ReviewDecision
					key={quote.id}
					kind="verification"
					compact
					busy={deciding}
					noteRequired={['NEEDS_EVIDENCE', 'REJECTED']}
					onDecide={async (status, note) => {
						const body = verification(status, note);
						if (!body) return;
						const res = await verify({ id: quote.id, body });
						if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
						notify(
							{
								verify: `${quote.id} verified.`,
								needs_evidence: `Evidence requested for ${quote.id}.`,
								reject: `${quote.id} rejected.`
							}[body.decision]
						);
						nav.advance();
					}}
				/>
			}
		>
			<QuoteBlock
				size="sm"
				quote={quote.text}
				author={quote.author?.name ?? quote.attribution ?? undefined}
				cite={cite || undefined}
			/>
			<ProvenancePanel quote={quote} />
			{!quote.author ? (
				<Notice
					tone="attention"
					title="Link the author before verifying."
					action={
						<Button size="sm" variant="outline" onClick={() => setCorrecting(true)}>
							Link author
						</Button>
					}
				>
					Submitted as “{quote.attribution ?? 'unknown'}”. A verified quote is credited to an author record.
				</Notice>
			) : null}
			<Notice
				title="Check the wording against the source."
				action={
					<Button size="sm" variant="outline" onClick={() => setCorrecting(true)}>
						Correct wording
					</Button>
				}
			>
				If it differs, correct the text before verifying: the old wording is kept as a correction.
			</Notice>
			{notes.length ? (
				<section aria-labelledby="h-notes" className="flex flex-col gap-2">
					<h3
						id="h-notes"
						className="m-0 font-mono text-[12px]/[1.6] font-normal tracking-[0.14em] text-stone-600 uppercase"
					>
						Notes
					</h3>
					<ul className="m-0 flex list-none flex-col gap-2 p-0">
						{notes.map((h) => (
							<li
								key={h.at}
								className="rounded-field border border-border bg-background px-4 py-3 text-[15px] wrap-anywhere"
							>
								<div className="mb-1 flex flex-wrap items-center gap-2 font-mono text-[12px] text-stone-600">
									<StatusBadge status={h.status} />
									{h.by ? `@${h.by.handle}` : 'qotm'} · {h.at.slice(0, 10)}
								</div>
								{h.note}
							</li>
						))}
					</ul>
				</section>
			) : null}
			<CorrectDialog quote={quote} open={correcting} onClose={() => setCorrecting(false)} />
		</ReviewPane>
	);
}

/**
 * The verification queue (canvas "Admin review", 2B): canonical quotes
 * waiting for a verifier, oldest first. The selected one shows the
 * submission, its provenance and notes, a prompt to correct its wording or
 * link its author, and the verification decision pinned under it.
 */
export function AdminVerificationRoute() {
	const { page, query, opened, pick, select, close, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminVerificationQuery(query(PAGE_SIZE));
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<ReviewQueue
			title="Verification queue"
			description="Did this person actually say or write these words, and is there sufficient evidence?"
			cards={list.map(card)}
			selectedId={selected?.id}
			opened={opened && Boolean(selected)}
			select={select}
			close={close}
			page={data?.currentPage ?? page}
			pageSize={PAGE_SIZE}
			total={data?.total ?? 0}
			onPage={goTo}
			fallback={
				isLoading ? (
					<PageSkeleton />
				) : isError || !data ? (
					<StateScreen compact title="The queue did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				) : !list.length ? (
					<Empty title="Nothing to verify." description="Canonical quotes land here once they are submitted." />
				) : undefined
			}
		>
			{selected ? <Selected key={selected.id} item={selected} /> : null}
		</ReviewQueue>
	);
}
