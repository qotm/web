import { useAdminSubmissionsQuery, useModerateSubmissionMutation } from '@/features/admin/api';
import { waited } from '@/features/admin/lib/dashboard';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { isModerated, moderation, openMatch, submitter } from '@/features/admin/lib/queues';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { QueueItemEntity } from '@/shared/types';
import {
	Button,
	DataTable,
	MatchCompare,
	Notice,
	PageMeta,
	Pagination,
	ReviewDecision,
	StatusBadge,
	TextLink,
	notify
} from '@/shared/ui';
import { adminPaths } from '@/lib/paths';

const PAGE_SIZE = 20;

/** The selected submission: its match, if any, and the moderator's decision (originals only). */
function Selected({ item }: { item: QueueItemEntity }) {
	const [moderate, { isLoading }] = useModerateSubmissionMutation();
	const match = openMatch(item);

	const decide = async (body: Parameters<typeof moderate>[0]['body'], done: string) => {
		const res = await moderate({ id: item.id, body });
		if ('error' in res) {
			const status = (res.error as { status?: number }).status;
			return notify(status === 409 ? 'Someone decided on it meanwhile.' : 'That was not saved. Try again.');
		}
		notify(done);
	};

	return (
		<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-grid narrow:grid-cols-1">
			<section aria-labelledby="h-selected" className="flex flex-col gap-stack">
				<h2 id="h-selected" className="m-0 text-h3">
					{item.id} · {item.type} by {submitter(item)}
				</h2>
				{match ? (
					<>
						<MatchCompare
							submitted={item.text}
							match={match}
							busy={isLoading || !isModerated(item)}
							onDismiss={() =>
								void decide(
									{ decision: 'publish', note: `Not a duplicate of ${match.match.id}` },
									`${item.id} published. The match is dismissed.`
								)
							}
							onMarkDuplicate={() =>
								void decide(
									{ decision: 'withdraw', note: `Duplicate of ${match.match.id}` },
									`${item.id} withdrawn as a duplicate of ${match.match.id}.`
								)
							}
						/>
						{item.type === 'original' ? (
							<Notice tone="attention" title="Declared original, but it matches a canonical quote.">
								Similarity flags a possible match for review. It doesn’t decide authorship.
							</Notice>
						) : null}
					</>
				) : (
					<blockquote className="m-0 rounded-card border border-border bg-card px-card-x py-card-y font-display text-[20px]/[1.4] font-medium">
						“{item.text}”
						{item.attribution || item.author ? (
							<footer className="mt-2 font-mono text-[13px] font-normal text-muted-foreground">
								— {item.author?.name ?? item.attribution}
							</footer>
						) : null}
					</blockquote>
				)}
			</section>
			{isModerated(item) ? (
				<ReviewDecision
					key={item.id}
					kind="moderation"
					busy={isLoading}
					noteRequired={['DISPUTED', 'WITHDRAWN']}
					onDecide={(status, note) => {
						const body = moderation(status, note);
						if (body) void decide(body, `${item.id} ${status.toLowerCase()}.`);
					}}
				/>
			) : (
				<Notice title="Canonical quotes go to verification.">
					A verifier checks the source before it is published.{' '}
					<TextLink to={adminPaths.verification}>Open the verification queue</TextLink>
				</Notice>
			)}
		</div>
	);
}

/**
 * The submissions queue (artboard AdminSubmissions): new quotes waiting for
 * their first check, oldest first. Selecting one shows its possible match
 * and, for an original the originality check held, the moderator's decision.
 */
export function AdminSubmissionsRoute() {
	const { page, pick, select, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminSubmissionsQuery({ page, limit: PAGE_SIZE });
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Submissions" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Submissions.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					New quotes waiting for their first check. Originals get an originality check; canonical quotes go to
					verification.
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
				<Empty title="Nothing waiting." description="New submissions land here for their first check." />
			) : (
				<>
					<DataTable<QueueItemEntity>
						dense
						label="Submissions"
						rows={list}
						rowKey={(q) => q.id}
						onRowClick={(q) => select(q.id)}
						rowLabel={(q) => `Review ${q.id}${q.id === selected?.id ? ' (selected)' : ''}`}
						columns={[
							{ key: 'id', label: 'id', mono: true },
							{
								key: 'text',
								label: 'quote',
								render: (q) => <span className="line-clamp-1 max-w-[340px]">{q.text}</span>
							},
							{ key: 'type', label: 'type', mono: true },
							{ key: 'by', label: 'by', mono: true, render: submitter },
							{ key: 'status', label: 'state', render: (q) => <StatusBadge status={q.status} /> },
							{ key: 'age', label: 'waiting', mono: true, align: 'right', render: (q) => waited(q.waitingSince) }
						]}
					/>
					{data.lastPage > 1 ? (
						<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={goTo} />
					) : null}
					{selected ? <Selected item={selected} /> : null}
				</>
			)}
		</div>
	);
}
