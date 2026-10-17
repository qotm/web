import { Link, useNavigate } from 'react-router';
import {
	useAdminReleasesQuery,
	useAdminStatsQuery,
	useBuildReleasePreviewMutation,
	useOldestInQueuesQuery
} from '@/features/admin/api';
import { count, queueCards, rate, waited } from '@/features/admin/lib/dashboard';
import { PageSkeleton, StateScreen } from '@/shared/layouts';
import type { AdminQueuesOldestResponse } from '@/shared/types';
import { Button, DataTable, PageMeta, ReleaseSummary, StatCard, StatusBadge, TextLink, notify } from '@/shared/ui';
import { adminPaths } from '@/lib/paths';

type Oldest = AdminQueuesOldestResponse['list'][number];

const QUEUE_LABEL: Record<Oldest['queue'], string> = {
	verification: 'Verification',
	curation: 'Curation',
	submissions: 'Originality',
	reports: 'Reports'
};

/** The longest waits worth a glance; each queue's own page has the rest. */
const OLDEST_SHOWN = 5;

const grid4 = 'grid grid-cols-4 gap-grid narrow:grid-cols-2';
const h2 = 'm-0 text-h3';

function OldestTable() {
	const { data, isLoading, isError } = useOldestInQueuesQuery();
	const navigate = useNavigate();
	if (isLoading) return <PageSkeleton />;
	if (isError || !data) return <p className="m-0 text-[15px] text-muted-foreground">The queues did not load.</p>;
	return (
		<DataTable<Oldest>
			dense
			label="Oldest in the queues"
			rows={data.list.slice(0, OLDEST_SHOWN)}
			rowKey={(r) => `${r.queue}:${r.id}`}
			onRowClick={(r) => navigate(adminPaths[r.queue])}
			rowLabel={(r) => `Open the ${QUEUE_LABEL[r.queue].toLowerCase()} queue (${r.id})`}
			empty="Nothing is waiting. Every queue is empty."
			columns={[
				{ key: 'id', label: 'id', mono: true },
				{ key: 'queue', label: 'queue', render: (r) => QUEUE_LABEL[r.queue] },
				{ key: 'state', label: 'state', render: (r) => <StatusBadge status={r.state} /> },
				{ key: 'age', label: 'waiting', mono: true, align: 'right', render: (r) => waited(r.waitingSince) }
			]}
		/>
	);
}

function DraftRelease() {
	const { data, isLoading, isError } = useAdminReleasesQuery({ limit: 1 });
	const [build, { isLoading: queuing }] = useBuildReleasePreviewMutation();
	const navigate = useNavigate();
	if (isLoading) return <PageSkeleton />;
	if (isError || !data) return <p className="m-0 text-[15px] text-muted-foreground">The release did not load.</p>;
	if (!data.current)
		return (
			<div className="flex flex-col gap-2 rounded-card border border-dashed border-border px-card-x py-card-y text-[15px] text-muted-foreground">
				No release in progress.
				<TextLink to={adminPaths.releases}>Dataset releases</TextLink>
			</div>
		);
	return (
		<ReleaseSummary
			release={data.current}
			busy={data.building || queuing}
			onBuildPreview={() =>
				void build()
					.unwrap()
					.then(() => notify('Preview queued. It builds in the background.'))
					.catch((e: { status?: number }) =>
						notify(e.status === 409 ? 'A build is already running.' : 'The preview was not queued. Try again.')
					)
			}
			onPublish={() => navigate(adminPaths.releases)}
		/>
	);
}

/**
 * The admin dashboard (artboard AdminDashboard): the four queues with their
 * notes, the oldest items waiting, the release in progress, then corpus
 * quality and community figures over the last 30 days.
 */
export function AdminDashboardRoute() {
	const { data, isLoading, isError, refetch } = useAdminStatsQuery();
	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Dashboard" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Dashboard.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					Everything that needs a person, and how the corpus is doing.
				</p>
			</header>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The dashboard did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : (
				<>
					<div className={grid4}>
						{queueCards(data.queues).map((c) => (
							<Link
								key={c.page}
								to={adminPaths[c.page]}
								aria-label={`${c.label}: ${c.value}`}
								className="border-0 text-ink no-underline"
							>
								<StatCard label={c.label} value={c.value} note={c.note} className="h-full hover:border-stone-400" />
							</Link>
						))}
					</div>
					<div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-grid narrow:grid-cols-1">
						{/* 1.5fr, not the artboard's 1.3fr: four columns with a CURATION_CANDIDATE badge need ~525px. */}
						<section aria-labelledby="h-oldest" className="flex flex-col gap-3">
							<h2 id="h-oldest" className={h2}>
								Oldest in the queues
							</h2>
							<OldestTable />
						</section>
						<DraftRelease />
					</div>
					<h2 className={`${h2} mt-2`}>Corpus quality · last 30 days</h2>
					<div className={grid4}>
						<StatCard
							label="Verification acceptance"
							value={rate(data.quality.verificationAcceptance)}
							note="verified ÷ reviewed"
						/>
						<StatCard label="Duplicate rate" value={rate(data.quality.duplicateRate)} note="of submissions" />
						<StatCard label="Curated this period" value={data.quality.curated} />
						<StatCard
							label="Useful contributions / 100 users"
							value={
								data.quality.usefulContributionsPer100Users == null
									? '—'
									: Math.round(data.quality.usefulContributionsPer100Users * 10) / 10
							}
						/>
					</div>
					<h2 className={`${h2} mt-2`}>Community and CLI</h2>
					<div className={grid4}>
						<StatCard label="Package installs" value={count(data.community.npmDownloads)} />
						<StatCard label="Dataset syncs" value={data.community.datasetSyncs} />
						<StatCard label="Registrations" value={data.community.registrations} />
						<StatCard label="Returning contributors" value={data.community.returningContributors} />
					</div>
				</>
			)}
		</div>
	);
}
