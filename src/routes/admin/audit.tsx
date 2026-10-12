import { useState } from 'react';
import { useAdminAuditQuery, useAuditActionsQuery } from '@/features/admin/api';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { AdminAuditData, AuditEntryEntity } from '@/shared/types';
import { Button, DataTable, PageMeta, Pagination, SearchField, Select, TextLink } from '@/shared/ui';
import { paths } from '@/lib/paths';

type Action = NonNullable<NonNullable<AdminAuditData['query']>['action']>;

const PAGE_SIZE = 25;

/** "2026-09-26 18:02", in the admin's own time zone. */
const when = (iso: string) => {
	const d = new Date(iso);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** A target as a link where it has a page (a quote, a member), else its id. */
function Target({ target }: { target: AuditEntryEntity['target'] }) {
	if (target.type === 'quote')
		return (
			<TextLink to={paths.quote(target.id)} mono variant="quiet">
				{target.id}
			</TextLink>
		);
	if (target.type === 'user' && !target.id.includes(' '))
		return (
			<TextLink to={paths.profile(target.id.replace(/^@/, ''))} mono variant="quiet">
				{target.id.startsWith('@') ? target.id : `@${target.id}`}
			</TextLink>
		);
	return <>{target.id}</>;
}

/**
 * The audit log (artboard AdminAudit): who changed what, and why, newest
 * first. Search covers actor, action, target and note; the action filter
 * lists every action the API records.
 */
export function AdminAuditRoute() {
	const [search, setSearch] = useState('');
	const q = useDebouncedValue(search.trim(), 300);
	const [action, setAction] = useState<Action | ''>('');
	const [page, setPage] = useState(1);
	const { data: actions } = useAuditActionsQuery();
	const { data, isLoading, isFetching, isError, refetch } = useAdminAuditQuery(
		{ ...(q ? { q } : {}), ...(action ? { action } : {}), page, limit: PAGE_SIZE },
		// Every decision elsewhere in the console writes here: always ask again on open.
		{ refetchOnMountOrArgChange: true }
	);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Audit log" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Audit log.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					Who changed what, and why. Nothing is erased; withdrawn content keeps its history.
				</p>
			</header>
			<div className="flex flex-wrap items-end gap-3" role="search" aria-label="Filter the audit log">
				<SearchField
					size="sm"
					shortcut={null}
					placeholder="Search actor, action or target"
					aria-label="Search actor, action or target"
					className="min-w-[240px] flex-1"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
				<Select
					size="sm"
					aria-label="Action"
					options={[
						{ value: '', label: 'All actions' },
						...(actions?.list ?? []).map((a) => ({ value: a.action, label: a.label }))
					]}
					value={action}
					onChange={(e) => {
						setAction(e.target.value as Action | '');
						setPage(1);
					}}
				/>
			</div>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The audit log did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !data.list.length ? (
				<Empty
					title={q || action ? 'Nothing matches.' : 'Nothing logged yet.'}
					description={q || action ? 'Try other words, or all actions.' : 'Every decision and change lands here.'}
				/>
			) : (
				<>
					<DataTable<AuditEntryEntity>
						dense
						label="Audit log"
						className={isFetching ? 'opacity-70' : undefined}
						rows={data.list}
						rowKey={(e) => e.id}
						columns={[
							{
								key: 'at',
								label: 'when',
								mono: true,
								render: (e) => <span className="whitespace-nowrap">{when(e.at)}</span>
							},
							{ key: 'actor', label: 'actor', mono: true, render: (e) => (e.actor ? `@${e.actor.handle}` : 'qotm') },
							{ key: 'label', label: 'action' },
							{ key: 'target', label: 'target', mono: true, render: (e) => <Target target={e.target} /> },
							{ key: 'note', label: 'note', render: (e) => e.note ?? '—' }
						]}
					/>
					{data.lastPage > 1 ? (
						<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
					) : null}
				</>
			)}
		</div>
	);
}
