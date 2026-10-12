import { useAdminReportsQuery, useDecideReportMutation } from '@/features/admin/api';
import { ago, waited } from '@/features/admin/lib/dashboard';
import { reportDecision } from '@/features/admin/lib/queues';
import { useQueueParams } from '@/features/admin/lib/use-queue-params';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { AdminReportEntity } from '@/shared/types';
import {
	Button,
	Card,
	DataTable,
	Notice,
	PageMeta,
	Pagination,
	QuoteBlock,
	ReviewDecision,
	StatusBadge,
	TextLink,
	notify
} from '@/shared/ui';
import { paths } from '@/lib/paths';

const PAGE_SIZE = 20;

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

/** The selected report: what was reported, the quote, the release it is in, and the moderator's decision. */
function Selected({ report: r }: { report: AdminReportEntity }) {
	const [decide, { isLoading }] = useDecideReportMutation();
	const q = r.quote;
	return (
		<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-grid narrow:grid-cols-1">
			<div className="flex flex-col gap-grid">
				<Card label={`Report ${r.id} · ${r.reason}`} aria-label={`Report ${r.id}`}>
					<div className="flex flex-col gap-stack">
						<p className="m-0 text-[15px]">
							{r.details ? `“${r.details}” ` : 'No details given. '}
							<span className="font-mono text-[13px] text-muted-foreground">
								— {reporter(r)}, {ago(r.createdAt)}
							</span>
						</p>
						<div className="flex flex-col gap-2.5 border-t border-border pt-stack">
							<div className="flex flex-wrap items-center gap-2">
								<StatusBadge status={q.status} />
								<StatusBadge status={r.status} />
								<TextLink to={paths.quote(q.id)} mono variant="quiet" className="ml-auto text-[13px]">
									{q.id}
								</TextLink>
							</div>
							<QuoteBlock size="sm" quote={q.text} author={q.author?.name ?? q.attribution ?? undefined} />
						</div>
					</div>
				</Card>
				{r.inRelease ? (
					<Notice tone="attention" title={`This quote is in ${r.inRelease}.`}>
						Withdrawing it removes it from the next release. The record and its history stay.
					</Notice>
				) : null}
			</div>
			{r.status === 'RESOLVED' ? (
				<Notice title="Resolved.">
					{r.resolvedAt ? `Decided ${ago(r.resolvedAt)}.` : 'Decided.'} The audit log has the decision and its note.
				</Notice>
			) : (
				<ReviewDecision
					key={r.id}
					kind="moderation"
					busy={isLoading}
					labels={{ PUBLISHED: 'Dismiss report' }}
					noteRequired={['DISPUTED', 'WITHDRAWN']}
					onDecide={async (status, note) => {
						const body = reportDecision(status, note);
						if (!body) return;
						const res = await decide({ id: r.id, body });
						if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
						notify(DONE[body.decision](r));
					}}
				/>
			)}
		</div>
	);
}

/**
 * Reports (artboard AdminReports): open reports, oldest first. The selected
 * one shows what was reported and why, the quote with its state, a warning
 * when it already shipped in a release, and the moderator's decision:
 * dismiss (the quote stays up), mark disputed, or withdraw.
 */
export function AdminReportsRoute() {
	const { page, pick, select, goTo } = useQueueParams();
	const { data, isLoading, isError, refetch } = useAdminReportsQuery({ page, limit: PAGE_SIZE, status: 'open' });
	const list = data?.list ?? [];
	const selected = pick(list);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Reports" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Reports.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					Attribution, content, originality, duplication and moderation concerns.
				</p>
			</header>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The reports did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !list.length ? (
				<Empty title="No open reports." description="Reports members file on a quote land here." />
			) : (
				<>
					<DataTable<AdminReportEntity>
						dense
						label="Reports"
						rows={list}
						rowKey={(r) => r.id}
						onRowClick={(r) => select(r.id)}
						rowLabel={(r) => `Review ${r.id}${r.id === selected?.id ? ' (selected)' : ''}`}
						columns={[
							{ key: 'id', label: 'id', mono: true },
							{ key: 'reason', label: 'reason', mono: true },
							{ key: 'quote', label: 'quote', mono: true, render: (r) => r.quote.id },
							{ key: 'by', label: 'reported by', mono: true, render: reporter },
							{ key: 'status', label: 'state', render: (r) => <StatusBadge status={r.status} /> },
							{ key: 'age', label: 'age', mono: true, align: 'right', render: (r) => waited(r.createdAt) }
						]}
					/>
					{data.lastPage > 1 ? (
						<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={goTo} />
					) : null}
					{selected ? <Selected report={selected} /> : null}
				</>
			)}
		</div>
	);
}
