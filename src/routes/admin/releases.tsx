import { useState } from 'react';
import { useAdminReleasesQuery, useBuildReleasePreviewMutation, usePublishReleaseMutation } from '@/features/admin/api';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { AdminReleaseEntity } from '@/shared/types';
import {
	Button,
	Card,
	Checkbox,
	DataTable,
	Dialog,
	Notice,
	PageMeta,
	Pagination,
	ReleaseSummary,
	Spinner,
	fileSize,
	notify,
	releaseVersion,
	shortSha
} from '@/shared/ui';

const PAGE_SIZE = 10;
/** While a build or a publish runs, ask again this often. */
const BUILDING_POLL_MS = 3_000;

const n = (v: number) => v.toLocaleString('en-US');

const refusal = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};

/** The publish confirmation (artboard AdminPublish): what ships, and the reviewed-preview tick. */
function PublishDialog({
	release: r,
	open,
	onClose,
	onPublished
}: {
	release: AdminReleaseEntity;
	open: boolean;
	onClose: () => void;
	onPublished: () => void;
}) {
	const [reviewed, setReviewed] = useState(false);
	const [publish, { isLoading }] = usePublishReleaseMutation();
	const [error, setError] = useState<string | null>(null);
	const version = releaseVersion(r.version);
	const close = () => {
		setReviewed(false);
		setError(null);
		onClose();
	};
	return (
		<Dialog
			open={open}
			onClose={close}
			width={560}
			title={`Publish ${version}?`}
			description="Every qotm install picks this up on its next qotm sync. You can withdraw quotes later, but a published release can’t be changed."
			footer={
				<>
					<Button variant="quiet" onClick={close}>
						Cancel
					</Button>
					<Button
						variant="accent"
						disabled={!reviewed || isLoading}
						onClick={async () => {
							const res = await publish(r.version);
							if ('error' in res) return setError(refusal(res.error, 'It was not published. Try again.'));
							notify(`Publishing ${version}. Installs get it on their next qotm sync.`);
							onPublished();
							close();
						}}
					>
						Publish release
					</Button>
				</>
			}
		>
			{error ? <Notice tone="attention">{error}</Notice> : null}
			<div className="flex flex-col gap-2.5 rounded-card border border-border bg-background px-[18px] py-4">
				<div className="text-[15px] text-muted-foreground">
					<b className="mr-1.5 font-display text-[28px] text-ink">{n(r.eligible)}</b>eligible quotes
				</div>
				<div className="flex flex-wrap gap-grid font-mono text-[15px]">
					<span>+{n(r.added)} new</span>
					<span className="text-clay-700">~{n(r.corrected)} corrected</span>
					<span className="text-stone-600">−{n(r.withdrawn)} withdrawn</span>
				</div>
				<div className="font-mono text-[13px] text-muted-foreground">
					{[
						'qotm.sqlite',
						r.sizeBytes != null ? fileSize(r.sizeBytes) : null,
						r.sha256 ? `sha256 ${shortSha(r.sha256)}` : null,
						`schema ${r.schemaVersion}`
					]
						.filter(Boolean)
						.join(' · ')}
				</div>
			</div>
			<Checkbox
				label="I reviewed the preview build."
				checked={reviewed}
				onChange={(e) => setReviewed(e.target.checked)}
			/>
		</Dialog>
	);
}

/**
 * Dataset releases (artboard AdminReleases): the release in progress with
 * Build preview and Publish (behind the AdminPublish confirmation), what a
 * release includes and never exports, and the published releases. While a
 * build or a publish runs, the page polls until it lands.
 */
export function AdminReleasesRoute() {
	const [page, setPage] = useState(1);
	const [publishing, setPublishing] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const { data, isLoading, isError, refetch } = useAdminReleasesQuery({ page, limit: PAGE_SIZE });
	const busy = Boolean(data?.building || (publishing && data?.current?.version === publishing));
	// A second subscription to the same cache entry polls while the worker has something in hand.
	useAdminReleasesQuery({ page, limit: PAGE_SIZE }, { pollingInterval: busy ? BUILDING_POLL_MS : 0, skip: !busy });
	const [build, { isLoading: queuing }] = useBuildReleasePreviewMutation();

	const buildPreview = () =>
		void build()
			.unwrap()
			.then((job) => notify(`Building a preview of ${releaseVersion(job.release.version)}.`))
			.catch((e: unknown) => notify(refusal(e, 'The preview was not queued. Try again.')));

	const current = data?.current ?? null;
	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Dataset releases" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Dataset releases.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					qotm.sqlite and manifest.json, compiled from public, eligible content only.
				</p>
			</header>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The releases did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : (
				<>
					{busy ? (
						<Notice
							title={data.building ? 'Building the preview.' : `Publishing ${releaseVersion(publishing ?? '')}.`}
							glyph=""
							action={
								<span role="status" aria-label="Working">
									<Spinner />
								</span>
							}
						>
							{data.building
								? 'qotm.sqlite is compiled in the background; this page updates when it is ready.'
								: 'The worker uploads it and points latest at it; this page updates when it is live.'}
						</Notice>
					) : null}
					{current ? (
						<ReleaseSummary
							release={current}
							busy={busy || queuing}
							onBuildPreview={buildPreview}
							onPublish={() => setConfirming(true)}
						/>
					) : (
						<Card label="Next release">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<p className="m-0 text-[15px]">
									No release in progress. A preview build opens the next one from what is eligible now.
								</p>
								<Button variant="outline" mono disabled={busy || queuing} onClick={buildPreview}>
									Build preview
								</Button>
							</div>
						</Card>
					)}
					<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
						<Card label="Included">
							<p className="m-0 text-[15px]">
								Curated quotes, their authors, sources, topics, contributor handles and stable ids.
							</p>
						</Card>
						<Card tone="wash" label="Never exported">
							<p className="m-0 text-[15px]">
								Emails, auth data, reports, moderation records, audit logs, private quotes, drafts and internal admin
								data.
							</p>
						</Card>
					</div>
					<h2 className="m-0 mt-2 text-h3">Published</h2>
					{data.list.length ? (
						<>
							<DataTable<AdminReleaseEntity>
								dense
								label="Published releases"
								rows={data.list}
								rowKey={(r) => r.version}
								columns={[
									{ key: 'version', label: 'version', mono: true, render: (r) => releaseVersion(r.version) },
									{ key: 'eligible', label: 'quotes', align: 'right' },
									{
										key: 'changes',
										label: 'changes',
										mono: true,
										render: (r) => `+${n(r.added)} ~${n(r.corrected)} −${n(r.withdrawn)}`
									},
									{ key: 'schemaVersion', label: 'schema', mono: true },
									{
										key: 'by',
										label: 'published by',
										mono: true,
										render: (r) => (r.publishedBy ? `@${r.publishedBy.handle}` : '—')
									},
									{
										key: 'publishedAt',
										label: 'published',
										mono: true,
										render: (r) => r.publishedAt?.slice(0, 10) ?? '—'
									}
								]}
							/>
							{data.lastPage > 1 ? (
								<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
							) : null}
						</>
					) : (
						<Empty title="Nothing published yet." description="The first release ships once a preview is published." />
					)}
					{current ? (
						<PublishDialog
							release={current}
							open={confirming}
							onClose={() => setConfirming(false)}
							onPublished={() => setPublishing(current.version)}
						/>
					) : null}
				</>
			)}
		</div>
	);
}
