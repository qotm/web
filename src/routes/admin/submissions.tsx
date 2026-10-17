import { useAdminSubmissionsQuery, useModerateSubmissionMutation } from '@/features/admin/api';
import { ReviewPane, ReviewQueue, type QueueCard } from '@/features/admin/components/review-queue';
import { useQueueNav } from '@/features/admin/lib/queue-nav';
import { ago, waited } from '@/features/admin/lib/dashboard';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { moderation, openMatch, submitter } from '@/features/admin/lib/queues';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { QueueItemEntity } from '@/shared/types';
import { Button, MatchCompare, Notice, QuoteBlock, ReviewDecision, StatusBadge, notify } from '@/shared/ui';

const PAGE_SIZE = 10;

const card = (q: QueueItemEntity): QueueCard => {
	const match = openMatch(q);
	return {
		id: q.id,
		who: submitter(q),
		age: waited(q.waitingSince),
		text: q.text,
		by: match ? `possible match · ${Math.round(match.score * 100)}%` : 'checking for a match',
		flag: Boolean(match)
	};
};

/** The selected hold: the original beside its possible match, and the moderator's answer. */
function Selected({ item }: { item: QueueItemEntity }) {
	const nav = useQueueNav();
	const [moderate, { isLoading }] = useModerateSubmissionMutation();
	const match = openMatch(item);
	const author = match?.match.author;

	const decide = async (body: Parameters<typeof moderate>[0]['body'], done: string) => {
		const res = await moderate({ id: item.id, body });
		if ('error' in res) {
			const status = (res.error as { status?: number }).status;
			return notify(status === 409 ? 'Someone decided on it meanwhile.' : 'That was not saved. Try again.');
		}
		notify(done);
		nav.advance();
	};

	return (
		<ReviewPane
			label={`Submission ${item.id}`}
			head={
				<>
					<StatusBadge status={item.status} />
					<span className="font-mono text-[12px] text-stone-600">
						{item.id} · original by {submitter(item)} · held {ago(item.waitingSince)}
					</span>
				</>
			}
			dock={
				<ReviewDecision
					key={item.id}
					kind="moderation"
					compact
					busy={isLoading}
					question={author ? `Is this ${submitter(item)}’s own line, or ${author}’s?` : undefined}
					// With a match, its id is the note: publishing dismisses it, withdrawing names the duplicate.
					noteRequired={match ? ['DISPUTED'] : ['DISPUTED', 'WITHDRAWN']}
					labels={
						match
							? { PUBLISHED: 'Not a duplicate — publish', DISPUTED: 'Dispute', WITHDRAWN: 'Duplicate — withdraw' }
							: undefined
					}
					onDecide={(status, note) => {
						const fallback = match
							? { PUBLISHED: `Not a duplicate of ${match.match.id}`, WITHDRAWN: `Duplicate of ${match.match.id}` }[
									status as 'PUBLISHED' | 'WITHDRAWN'
								]
							: undefined;
						const body = moderation(status, note || fallback || '');
						if (body) void decide(body, `${item.id} ${status.toLowerCase()}.`);
					}}
				/>
			}
		>
			{match ? (
				<MatchCompare submitted={item.text} match={match} actions={false} />
			) : (
				<QuoteBlock size="sm" quote={item.text} author={submitter(item)} />
			)}
			<Notice title="Why it’s held">
				Community originals publish on their own unless the originality check finds a similar known quote; this one
				waits for your answer. Similarity flags a possible match. It doesn’t decide authorship.
			</Notice>
		</ReviewPane>
	);
}

/**
 * Originality holds (canvas "Admin review", board 3): community originals the
 * originality check held because they look like a known quote, oldest first.
 * Canonical quotes wait in the verification queue, not here.
 */
export function AdminSubmissionsRoute() {
	const { page, query, opened, pick, select, close, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminSubmissionsQuery(query(PAGE_SIZE));
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<ReviewQueue
			title="Originality holds"
			description="Community originals that look like a known quote. They publish once you answer."
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
					<Empty title="Nothing held." description="Originals that look like a known quote wait here for an answer." />
				) : undefined
			}
		>
			{selected ? <Selected key={selected.id} item={selected} /> : null}
		</ReviewQueue>
	);
}
