import type { AdminReleaseEntity } from '@/shared/types';
import { fileSize } from '../../lib/format';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Eyebrow } from '../ui/eyebrow';

const STATE = {
	DRAFT: ['draft', 'border-dashed border-border text-stone-600'],
	PREVIEW: ['preview built', 'border-stone-400 bg-card text-ink'],
	PUBLISHED: ['published', 'border-transparent bg-ink text-paper']
} as const;

/** "9f3c2a…7e1b": enough of a digest to compare by eye. */
const shortSha = (sha: string) => (sha.length > 12 ? `${sha.slice(0, 6)}…${sha.slice(-4)}` : sha);

type ReleaseSummaryProps = {
	release: Pick<
		AdminReleaseEntity,
		'version' | 'state' | 'eligible' | 'added' | 'corrected' | 'withdrawn' | 'sizeBytes' | 'sha256' | 'publishedAt'
	>;
	onBuildPreview?: () => void;
	onPublish?: () => void;
	/** Disables both actions while a job runs. */
	busy?: boolean;
	className?: string;
};

/**
 * qotm_kit ReleaseSummary: a dataset release, its eligible count and the diff
 * since the last one, its artifact, and Build preview / Publish until it is
 * published (Publish needs a preview).
 */
function ReleaseSummary({ release: r, onBuildPreview, onPublish, busy = false, className }: ReleaseSummaryProps) {
	const [label, tone] = STATE[r.state];
	const n = (v: number) => v.toLocaleString('en-US');
	const meta = [
		r.sizeBytes != null ? ['size', fileSize(r.sizeBytes)] : null,
		r.sha256 ? ['sha256', shortSha(r.sha256)] : null,
		r.publishedAt ? ['published', r.publishedAt.slice(0, 10)] : null
	].filter((m): m is [string, string] => m !== null);
	const version = r.version.startsWith('v') ? r.version : `v${r.version}`;
	return (
		<section
			aria-label={`Dataset ${version}`}
			className={cn(
				'box-border flex flex-col gap-stack rounded-card border border-border bg-card px-card-x py-card-y',
				className
			)}
		>
			<div className="flex items-start justify-between">
				<div>
					<Eyebrow className="mb-1.5">Dataset release</Eyebrow>
					<h3 className="m-0 font-mono text-[22px]/[1.15] font-medium tracking-normal">{version}</h3>
				</div>
				<span
					className={cn(
						'inline-flex items-center gap-1.5 rounded-pill border px-[9px] py-px font-mono text-[11px]/[18px] tracking-[0.12em] whitespace-nowrap uppercase',
						tone
					)}
				>
					{label}
				</span>
			</div>
			<div className="text-[15px]/[1.6] text-muted-foreground">
				<b className="mr-1.5 font-display text-[32px] font-semibold tracking-[-0.01em] text-ink">{n(r.eligible)}</b>{' '}
				eligible quotes
			</div>
			<div aria-label="Changes since the last release" className="flex flex-wrap gap-grid font-mono text-[15px]/[1.6]">
				<span className="text-ink">+{n(r.added)} new</span>
				<span className="text-clay-700">~{n(r.corrected)} corrected</span>
				<span className="text-stone-600">−{n(r.withdrawn)} withdrawn</span>
			</div>
			{meta.length ? (
				<dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5 border-y border-border py-3 font-mono text-[13px]/[1.6]">
					{meta.map(([k, v]) => (
						<div key={k}>
							<dt className="text-stone-600">{k}</dt>
							<dd
								className="m-0 overflow-hidden text-ellipsis"
								title={k === 'sha256' ? (r.sha256 ?? undefined) : undefined}
							>
								{v}
							</dd>
						</div>
					))}
				</dl>
			) : null}
			{r.state !== 'PUBLISHED' ? (
				<div className="flex flex-wrap gap-2.5">
					<Button variant="outline" mono disabled={busy} onClick={onBuildPreview}>
						Build preview
					</Button>
					<Button variant="accent" disabled={busy || r.state !== 'PREVIEW'} onClick={onPublish}>
						Publish
					</Button>
				</div>
			) : null}
		</section>
	);
}

export { ReleaseSummary };
export type { ReleaseSummaryProps };
