import { useState } from 'react';
import { useAdminCurationQuery, useCurateQuoteMutation } from '@/features/admin/api';
import { CHECKLIST, allTicked, curation, emptyChecklist, type Checklist } from '@/features/admin/lib/queues';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { ReviewPane, ReviewQueue, type QueueCard } from '@/features/admin/components/review-queue';
import { useQueueNav } from '@/features/admin/lib/queue-nav';
import { Signals } from '@/features/admin/components/signals';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { QueueItemEntity } from '@/shared/types';
import {
	Attribution,
	Button,
	Card,
	Checkbox,
	Notice,
	QuoteBlock,
	ReviewDecision,
	StatusBadge,
	notify
} from '@/shared/ui';

const PAGE_SIZE = 10;

const refusal = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};

const card = (q: QueueItemEntity): QueueCard => ({
	id: q.id,
	who: q.contributor ? `@${q.contributor.handle}` : undefined,
	text: q.text,
	by:
		q.type === 'original'
			? `community original · ${q.counts.recommends} recommends`
			: (q.author?.name ?? q.attribution ?? undefined),
	status: q.status
});

/** The selected candidate: the quote, its community signals, the checklist and the curator's decision. */
function Selected({ item }: { item: QueueItemEntity }) {
	const nav = useQueueNav();
	const [curate, { isLoading }] = useCurateQuoteMutation();
	const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);
	const original = item.type === 'original';
	return (
		<ReviewPane
			label={`Candidate ${item.id}`}
			head={
				<>
					<StatusBadge status={original ? 'ORIGINAL' : 'CANONICAL'} />
					<StatusBadge status={item.status} />
					<span className="font-mono text-[12px] text-stone-600">{item.id}</span>
				</>
			}
			dock={
				<ReviewDecision
					kind="curation"
					compact
					busy={isLoading}
					noteRequired={['VERIFIED']}
					unavailable={allTicked(checklist) ? [] : ['CURATED']}
					onDecide={async (status, note) => {
						const body = curation(status, note, checklist);
						if (!body) return;
						const res = await curate({ id: item.id, body });
						if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
						notify(body.decision === 'curate' ? `${item.id} curated.` : `${item.id} kept out of the dataset.`);
						nav.advance();
					}}
				/>
			}
		>
			<div className="flex flex-col gap-stack">
				<QuoteBlock size="sm" quote={item.text} />
				<Attribution
					type={original ? 'original' : 'canonical'}
					author={item.author?.name ?? item.attribution ?? undefined}
					authorSlug={item.author?.slug}
					work={item.work}
					year={item.year}
					contributor={item.contributor?.handle ?? null}
				/>
			</div>
			<Signals counts={item.counts} original={original} />
			<Notice tone="wash">
				{original
					? 'Community signals made this a candidate. They don’t decide: popularity never publishes to the dataset.'
					: 'Verified, so its words and source are checked. Curating decides whether qotm users get it by default.'}
			</Notice>
			<Card label="Curation checklist">
				<div className="flex flex-col gap-2.5" role="group" aria-label="Curation checklist">
					{CHECKLIST.map(([key, label]) => (
						<Checkbox
							key={key}
							label={label}
							checked={checklist[key]}
							onChange={(e) => setChecklist((c) => ({ ...c, [key]: e.target.checked }))}
						/>
					))}
				</div>
			</Card>
		</ReviewPane>
	);
}

/**
 * The curation queue (canvas "Admin review", 2B): verified quotes and
 * community candidates waiting for a curator. The selected one shows its
 * signals (shown, never decisive) and the seven-item checklist, with the
 * decision pinned under it: curating needs every box; keeping it out needs a
 * note.
 */
export function AdminCurationRoute() {
	const { page, query, opened, pick, select, close, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminCurationQuery(query(PAGE_SIZE));
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<ReviewQueue
			title="Curation queue"
			description="Is this quote appropriate and valuable enough to distribute to qotm users by default?"
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
					<Empty title="Nothing to curate." description="Verified quotes and community candidates land here." />
				) : undefined
			}
		>
			{selected ? <Selected key={selected.id} item={selected} /> : null}
		</ReviewQueue>
	);
}
