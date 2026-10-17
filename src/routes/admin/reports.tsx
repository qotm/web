import { useAdminReportsQuery, useDecideReportMutation } from '@/features/admin/api';
import { ago, waited } from '@/features/admin/lib/dashboard';
import { reportDecision } from '@/features/admin/lib/queues';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { ReviewPane, ReviewQueue, type QueueCard } from '@/features/admin/components/review-queue';
import { useQueueNav } from '@/features/admin/lib/queue-nav';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { AdminReportEntity } from '@/shared/types';
import { Button, Notice, QuoteBlock, ReviewDecision, StatusBadge, TextLink, notify } from '@/shared/ui';
import { paths } from '@/lib/paths';

const PAGE_SIZE = 10;

const refusal = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};

const reporter = (r: Pick<AdminReportEntity, 'reporter'>) => (r.reporter ? `@${r.reporter}` : 'a former member');

const DONE = {
	dismiss: (r: AdminReportEntity) => `${r.id} dismissed. ${r.quote.id} stays up.`,
	mark_disputed: (r: AdminReportEntity) => `${r.quote.id} marked disputed while you look into it.`,
	withdraw: (r: AdminReportEntity) => `${r.quote.id} withdrawn. Its open reports are resolved.`
};

const card = (r: AdminReportEntity): QueueCard => ({
	id: r.id,
	who: reporter(r),
	age: waited(r.createdAt),
	text: r.quote.text,
	by: `${r.reason} · ${r.quote.id}`,
	status: r.status
});

/** The selected report: what was reported, the quote, the release it is in, and the moderator's decision. */
function Selected({ report: r }: { report: AdminReportEntity }) {
	const nav = useQueueNav();
	const [decide, { isLoading }] = useDecideReportMutation();
	const q = r.quote;
	return (
		<ReviewPane
			label={`Report ${r.id}`}
			head={
				<>
					<StatusBadge status={r.status} />
					<span className="font-mono text-[12px] text-stone-600">
						{r.id} · {r.reason} · {reporter(r)}, {ago(r.createdAt)}
					</span>
				</>
			}
			dock={
				r.status === 'RESOLVED' ? undefined : (
					<ReviewDecision
						key={r.id}
						kind="moderation"
						compact
						busy={isLoading}
						labels={{ PUBLISHED: 'Dismiss report' }}
						noteRequired={['DISPUTED', 'WITHDRAWN']}
						onDecide={async (status, note) => {
							const body = reportDecision(status, note);
							if (!body) return;
							const res = await decide({ id: r.id, body });
							if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
							notify(DONE[body.decision](r));
							nav.advance();
						}}
					/>
				)
			}
		>
			<p className="m-0 text-[17px]/[1.5] wrap-anywhere">{r.details ? `“${r.details}”` : 'No details given.'}</p>
			<div className="flex flex-col gap-2.5 rounded-card border border-border bg-background px-card-x py-card-y">
				<div className="flex flex-wrap items-center gap-2">
					<StatusBadge status={q.status} />
					<TextLink to={paths.quote(q.id)} mono variant="quiet" className="ml-auto text-[13px]">
						{q.id}
					</TextLink>
				</div>
				<QuoteBlock size="sm" quote={q.text} author={q.author?.name ?? q.attribution ?? undefined} />
			</div>
			{r.inRelease ? (
				<Notice tone="attention" title={`This quote is in ${r.inRelease}.`}>
					Withdrawing it removes it from the next release. The record and its history stay.
				</Notice>
			) : null}
			{r.status === 'RESOLVED' ? (
				<Notice title="Resolved.">
					{r.resolvedAt ? `Decided ${ago(r.resolvedAt)}.` : 'Decided.'} The audit log has the decision and its note.
				</Notice>
			) : null}
		</ReviewPane>
	);
}

/**
 * Reports (canvas "Admin review", 2B): open reports, oldest first. The
 * selected one shows what was reported and why, the quote with its state, a
 * warning when it already shipped in a release, and the moderator's decision
 * pinned under it: dismiss (the quote stays up), mark disputed, or withdraw.
 */
export function AdminReportsRoute() {
	const { page, query, opened, pick, select, close, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminReportsQuery({ ...query(PAGE_SIZE), status: 'open' });
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<ReviewQueue
			title="Reports"
			description="Attribution, content, originality, duplication and moderation concerns."
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
					<StateScreen compact title="The reports did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				) : !list.length ? (
					<Empty title="No open reports." description="Reports members file on a quote land here." />
				) : undefined
			}
		>
			{selected ? <Selected key={selected.id} report={selected} /> : null}
		</ReviewQueue>
	);
}
