import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAdminQuotesQuery, useExportQuotesMutation, useExportStatusQuery } from '@/features/admin/api';
import { QuotePeek } from '@/features/admin/components/quote-peek';
import { stepFrom } from '@/features/admin/lib/queues';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { AdminQuoteRowEntity, AdminQuotesData } from '@/shared/types';
import {
	Button,
	DataTable,
	Notice,
	PageMeta,
	Pagination,
	SearchField,
	Select,
	Spinner,
	StatusBadge,
	TextLink,
	fileSize,
	notify,
	statusInfo
} from '@/shared/ui';
import { API_URL } from '@/lib/env';
import { paths } from '@/lib/paths';

type Filters = NonNullable<AdminQuotesData['query']>;

const PAGE_SIZE = 15;
const EXPORT_POLL_MS = 2_000;

const TYPES = [
	{ value: '', label: 'All types' },
	{ value: 'canonical', label: 'Canonical' },
	{ value: 'original', label: 'Community original' }
];

/** Every state a public quote can be in, in lifecycle order, as the kit names them. */
const STATE_KEYS: NonNullable<Filters['state']>[] = [
	'SUBMITTED',
	'UNDER_REVIEW',
	'NEEDS_EVIDENCE',
	'VERIFIED',
	'CURATION_REVIEW',
	'CURATED',
	'DATASET_RELEASE',
	'ORIGINALITY_CHECK',
	'PUBLISHED',
	'COMMUNITY_DISCOVERY',
	'CURATION_CANDIDATE',
	'DISPUTED',
	'REJECTED',
	'WITHDRAWN'
];
const STATES = [
	{ value: '', label: 'Any state' },
	...STATE_KEYS.map((s) => {
		const label = statusInfo(s).label;
		return { value: s, label: label[0].toUpperCase() + label.slice(1) };
	})
];

const n = (v: number) => v.toLocaleString('en-US');

/** A queued CSV export: its progress while the worker runs it, then the download. */
function ExportProgress({ id, onDone }: { id: string; onDone: () => void }) {
	const { data } = useExportStatusQuery(id, {
		pollingInterval: EXPORT_POLL_MS,
		skipPollingIfUnfocused: false
	});
	const state = data?.state ?? 'waiting';
	if (state === 'ready')
		return (
			<Notice
				tone="info"
				title="Your export is ready."
				action={
					<div className="flex gap-2">
						<Button asChild size="sm" variant="outline">
							<a href={`${API_URL}/v1/admin/exports/${id}/download`} download>
								Download CSV
							</a>
						</Button>
						<Button size="sm" variant="quiet" onClick={onDone}>
							Close
						</Button>
					</div>
				}
			>
				{data?.rows != null ? `${n(data.rows)} quotes` : 'The CSV'}
				{data?.bytes != null ? ` · ${fileSize(data.bytes)}` : ''}. The link works for an hour, for you only.
			</Notice>
		);
	if (state === 'failed')
		return (
			<Notice
				tone="attention"
				title="The export failed."
				action={
					<Button size="sm" variant="quiet" onClick={onDone}>
						Close
					</Button>
				}
			>
				{data?.error ?? 'Try again in a moment.'}
			</Notice>
		);
	return (
		<Notice
			title={state === 'running' ? 'Exporting…' : 'Export queued.'}
			action={
				<span role="status" aria-label="Exporting">
					<Spinner />
				</span>
			}
		>
			The CSV is written in the background with the filters you had; this updates when it is ready.
		</Notice>
	);
}

/**
 * Admin quotes (artboard AdminQuotes): every public quote, searched by text,
 * author or id and filtered by type and state, in a selectable table with
 * paging. A row opens the quote's drawer (`?peek=q_…`); its id still links to
 * the public page. Export CSV queues the filtered list and offers the file
 * when the worker has written it. Filters live in the URL.
 */
export function AdminQuotesRoute() {
	const [params, setParams] = useSearchParams();
	const [search, setSearch] = useState(params.get('q') ?? '');
	const q = useDebouncedValue(search.trim(), 300);
	const type = (params.get('type') ?? '') as Filters['type'] | '';
	const state = (params.get('state') ?? '') as Filters['state'] | '';
	const page = Math.max(1, Number(params.get('page')) || 1);
	const filters: Filters = {
		...(q ? { q } : {}),
		...(type ? { type } : {}),
		...(state ? { state } : {})
	};
	const { data, isLoading, isFetching, isError, refetch } = useAdminQuotesQuery({ ...filters, page, limit: PAGE_SIZE });
	const [selected, setSelected] = useState<string[]>([]);
	const [exporting, setExporting] = useState<string | null>(null);
	const [startExport, { isLoading: queuing }] = useExportQuotesMutation();
	const peek = params.get('peek');
	const ids = data?.list.map((r) => r.id) ?? [];
	const setPeek = (id: string | null) =>
		setParams(
			(p) => {
				if (id) p.set('peek', id);
				else p.delete('peek');
				return p;
			},
			{ replace: true }
		);

	const set = (next: Record<string, string>) =>
		setParams(
			(p) => {
				for (const [k, v] of Object.entries(next))
					if (v) p.set(k, v);
					else p.delete(k);
				if (!('page' in next)) p.delete('page');
				return p;
			},
			{ replace: true }
		);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Quotes" robots="noindex" />
			<header className="flex flex-wrap items-end justify-between gap-6">
				<div>
					<h1 className="m-0 text-h1">Quotes.</h1>
					<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
						{data
							? `${n(data.counts.public)} public quotes. ${n(data.counts.eligible)} are eligible for the next release.`
							: 'Every public quote, in any state.'}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					disabled={queuing || Boolean(exporting)}
					onClick={() =>
						void startExport(filters)
							.unwrap()
							.then((job) => setExporting(job.id))
							.catch(() => notify('The export was not queued. Try again.'))
					}
				>
					Export CSV
				</Button>
			</header>
			{exporting ? <ExportProgress id={exporting} onDone={() => setExporting(null)} /> : null}
			<div className="flex flex-wrap items-end gap-3" role="search" aria-label="Filter quotes">
				<SearchField
					size="sm"
					shortcut={null}
					placeholder="Search text, author or id"
					aria-label="Search quotes"
					className="min-w-[240px] flex-1"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						if (params.get('page')) set({ page: '' });
					}}
					onSubmit={(v) => set({ q: v.trim() })}
				/>
				<Select
					size="sm"
					aria-label="Type"
					options={TYPES}
					value={type}
					onChange={(e) => set({ type: e.target.value })}
				/>
				<Select
					size="sm"
					aria-label="State"
					options={STATES}
					value={state}
					onChange={(e) => set({ state: e.target.value })}
				/>
			</div>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The quotes did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !data.list.length ? (
				<Empty title="No quotes match." description="Try other words, or clear the type and state." />
			) : (
				<>
					{selected.length ? (
						<div className="flex flex-wrap items-center gap-3 font-mono text-[13px] text-muted-foreground">
							{selected.length} selected
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									void navigator.clipboard
										.writeText(selected.join('\n'))
										.then(() => notify(`Copied ${selected.length} ids.`))
								}
							>
								Copy ids
							</Button>
							<Button size="sm" variant="quiet" onClick={() => setSelected([])}>
								Clear
							</Button>
						</div>
					) : null}
					<DataTable<AdminQuoteRowEntity>
						label="Quotes"
						className={isFetching ? 'opacity-70' : undefined}
						rows={data.list}
						rowKey={(r) => r.id}
						onRowClick={(r) => setPeek(r.id)}
						rowLabel={(r) => `Open ${r.id}`}
						activeKey={peek ?? undefined}
						selectable
						selected={selected}
						onSelect={setSelected}
						columns={[
							{
								key: 'id',
								label: 'id',
								mono: true,
								render: (r) => (
									<TextLink to={paths.quote(r.id)} mono variant="quiet" onClick={(e) => e.stopPropagation()}>
										{r.id}
									</TextLink>
								)
							},
							{
								key: 'text',
								label: 'quote',
								render: (r) => <span className="line-clamp-1 min-w-[130px]">{r.text}</span>
							},
							{
								key: 'author',
								label: 'author',
								render: (r) => (
									<span className="block max-w-[120px] truncate" title={r.author ?? undefined}>
										{r.author ?? '—'}
									</span>
								)
							},
							{ key: 'type', label: 'type', mono: true },
							{ key: 'status', label: 'state', render: (r) => <StatusBadge status={r.status} /> },
							{ key: 'lastRelease', label: 'last release', mono: true, render: (r) => r.lastRelease ?? '—' }
						]}
					/>
					<Pagination
						page={page}
						pageSize={data.pageSize}
						total={data.total}
						onPage={(p) => set({ page: String(p) })}
					/>
				</>
			)}
			{peek ? (
				<QuotePeek
					key="peek"
					id={peek}
					position={ids.includes(peek) ? `${ids.indexOf(peek) + 1} of ${ids.length}` : ''}
					prev={stepFrom(ids, peek, -1)}
					next={stepFrom(ids, peek, 1)}
					onGo={setPeek}
					onClose={() => setPeek(null)}
				/>
			) : null}
		</div>
	);
}
