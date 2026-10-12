import { useState } from 'react';
import { useAdminCurationQuery, useCurateQuoteMutation } from '@/features/admin/api';
import { CHECKLIST, allTicked, curation, emptyChecklist, type Checklist } from '@/features/admin/lib/queues';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { QueueItemEntity } from '@/shared/types';
import {
	Attribution,
	Button,
	Card,
	Checkbox,
	DataTable,
	Notice,
	PageMeta,
	Pagination,
	QuoteBlock,
	ReviewDecision,
	StatCard,
	StatusBadge,
	notify
} from '@/shared/ui';

const PAGE_SIZE = 20;

const refusal = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};

/** The selected candidate: the quote, its community signals, the checklist and the curator's decision. */
function Selected({ item }: { item: QueueItemEntity }) {
	const [curate, { isLoading }] = useCurateQuoteMutation();
	const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);
	const original = item.type === 'original';
	return (
		<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-grid narrow:grid-cols-1">
			<div className="flex flex-col gap-grid">
				<Card aria-label={`Candidate ${item.id}`}>
					<div className="flex flex-col gap-stack">
						<div className="flex flex-wrap gap-2">
							<StatusBadge status={original ? 'ORIGINAL' : 'CANONICAL'} />
							<StatusBadge status={item.status} />
						</div>
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
				</Card>
				<div className="grid grid-cols-3 gap-3">
					<StatCard label="likes" value={item.counts.likes} />
					<StatCard label="favorites" value={item.counts.favorites} />
					<StatCard label="recommends" value={original ? item.counts.recommends : '—'} />
				</div>
				<Notice tone="wash">
					{original
						? 'Community signals made this a candidate. They don’t decide: popularity never publishes to the dataset.'
						: 'Verified, so its words and source are checked. Curating decides whether qotm users get it by default.'}
				</Notice>
			</div>
			<div className="flex flex-col gap-grid">
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
				<ReviewDecision
					kind="curation"
					busy={isLoading}
					noteRequired={['VERIFIED']}
					unavailable={allTicked(checklist) ? [] : ['CURATED']}
					onDecide={async (status, note) => {
						const body = curation(status, note, checklist);
						if (!body) return;
						const res = await curate({ id: item.id, body });
						if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
						notify(body.decision === 'curate' ? `${item.id} curated.` : `${item.id} kept out of the dataset.`);
					}}
				/>
			</div>
		</div>
	);
}

/**
 * The curation queue (artboard AdminCuration): verified quotes and community
 * candidates waiting for a curator. The selected one shows its signals
 * (shown, never decisive), the seven-item checklist, and the decision:
 * curating needs every box; keeping it out needs a note.
 */
export function AdminCurationRoute() {
	const { page, pick, select, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminCurationQuery({ page, limit: PAGE_SIZE });
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Curation queue" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Curation queue.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					Is this quote appropriate and valuable enough to distribute to qotm users by default?
				</p>
			</header>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The queue did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !list.length ? (
				<Empty title="Nothing to curate." description="Verified quotes and community candidates land here." />
			) : (
				<>
					<DataTable<QueueItemEntity>
						dense
						label="Curation queue"
						rows={list}
						rowKey={(q) => q.id}
						onRowClick={(q) => select(q.id)}
						rowLabel={(q) => `Review ${q.id}${q.id === selected?.id ? ' (selected)' : ''}`}
						columns={[
							{ key: 'id', label: 'id', mono: true },
							{
								key: 'text',
								label: 'quote',
								render: (q) => <span className="line-clamp-1 max-w-[360px]">{q.text}</span>
							},
							{ key: 'type', label: 'type', mono: true },
							{
								key: 'recommends',
								label: 'recommends',
								align: 'right',
								render: (q) => (q.type === 'original' ? q.counts.recommends : '—')
							},
							{ key: 'status', label: 'state', render: (q) => <StatusBadge status={q.status} /> }
						]}
					/>
					{data.lastPage > 1 ? (
						<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={goTo} />
					) : null}
					{selected ? <Selected key={selected.id} item={selected} /> : null}
				</>
			)}
		</div>
	);
}
