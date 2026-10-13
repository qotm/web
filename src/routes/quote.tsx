import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { loginRedirect, useAuth } from '@/shared/auth';
import { PageSkeleton, StateScreen } from '@/shared/layouts';
import type { QuoteEntity } from '@/shared/types';
import {
	ActionBar,
	Attribution,
	Breadcrumbs,
	Button,
	Card,
	CommandBlock,
	Eyebrow,
	LifecycleSteps,
	Notice,
	PageMeta,
	ProvenancePanel,
	QuoteBlock,
	QuoteCard,
	ShareCard,
	StatusBadge,
	TextLink,
	glyph,
	lifecycleOf,
	type QuoteAction
} from '@/shared/ui';
import { paths } from '@/lib/paths';
import { NOT_INDEXED } from '@/shared/ui/meta/indexing';
import { useAuthorQuery, useQuoteQuery, useRelatedQuotesQuery } from '@/features/quotes/api';
import { ReportDialog } from '@/features/quotes/components/report-dialog';
import { ShareDialog } from '@/features/quotes/components/share-dialog';
import { useQuoteActions } from '@/features/quotes/use-quote-actions';

type Dialogs = 'share' | 'report' | null;

/** The badges above the quote: verification, then where it stands. */
function badgesOf(q: QuoteEntity): string[] {
	if (q.type === 'original') {
		const community = ['PUBLISHED', 'COMMUNITY_DISCOVERY', 'CURATION_CANDIDATE'].includes(q.status);
		return ['ORIGINAL', q.status, ...(community ? ['COMMUNITY'] : [])];
	}
	if (q.type === 'private') return ['PRIVATE'];
	return [...new Set([...(q.verifiedAt && q.status !== 'VERIFIED' ? ['VERIFIED'] : []), q.status])];
}

const authorName = (q: QuoteEntity) => q.author?.name ?? q.attribution ?? 'Unknown';
const surname = (name: string) => name.split(/\s+/).at(-1) ?? name;

function RelatedQuotes({ q }: { q: QuoteEntity }) {
	const { data } = useRelatedQuotesQuery(q.id);
	const act = useQuoteActions();
	if (!data?.list.length) return null;
	const topic = q.topics[0];
	return (
		<section className="mt-14 border-t border-border py-section">
			<Eyebrow>{topic ? `Also on ${topic.name}` : 'Read next'}</Eyebrow>
			<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
				{data.list.slice(0, 4).map((r) => (
					<QuoteCard key={r.id} quote={r} variant="compact" onAction={act(r.id)} />
				))}
			</div>
		</section>
	);
}

function MoreFromAuthor({ slug, name }: { slug: string; name: string }) {
	const { data } = useAuthorQuery(slug);
	return (
		<Card tone="wash" label={`More from ${surname(name)}`}>
			{/* clay-700: clay-600 on the wash is 4.41:1, short of 4.5. */}
			<TextLink to={paths.author(slug)} className="text-clay-700">
				{data ? `${data.tabs.all} quotes, ${data.tabs.curated} curated` : 'All their quotes'} {glyph('→')}
			</TextLink>
		</Card>
	);
}

/**
 * A quote (artboards Quote and QuoteOriginal, with the Share and Report
 * dialogs): badges, the quote, its actions, provenance and the road to the
 * CLI. A withdrawn quote keeps its record, under a notice, without actions.
 */
export function QuoteRoute() {
	const { id: raw = '' } = useParams();
	const id = raw.startsWith('q_') ? raw : `q_${raw}`;
	const { data: q, isLoading, error, refetch } = useQuoteQuery(id);
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const act = useQuoteActions();
	const [chosen, setDialog] = useState<Dialogs>(null);
	// /q/xxxx#report (a card's report action) opens the report form.
	const dialog: Dialogs = chosen ?? (location.hash === '#report' && isAuthenticated ? 'report' : null);

	if (isLoading)
		return (
			<div className="py-page">
				<PageSkeleton />
			</div>
		);
	if (error || !q) {
		const status = (error as { status?: number } | undefined)?.status;
		return (
			<div className="py-section">
				<PageMeta title="Quote not found" robots="noindex" />
				{status === 404 ? (
					<StateScreen
						compact
						code="404"
						title="No quote here."
						description="It may be private, not checked yet, or the link has a typo."
					>
						<Button asChild variant="outline">
							<Link to={paths.discover}>Discover quotes</Link>
						</Button>
					</StateScreen>
				) : (
					<StateScreen compact title="The quote did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				)}
			</div>
		);
	}

	const original = q.type === 'original';
	const withdrawn = q.status === 'WITHDRAWN';
	const name = authorName(q);
	const cite = [q.work, q.year].filter(Boolean).join(', ');
	const onAction = (action: QuoteAction, on?: boolean) => {
		if (action === 'share') return setDialog('share');
		if (action === 'report') {
			if (!isAuthenticated) return navigate(loginRedirect(`${location.pathname}#report`));
			return setDialog('report');
		}
		act(q.id)(action, on);
	};
	const crumbs = original
		? q.contributor
			? [
					{ label: `@${q.contributor.handle}`, to: paths.profile(q.contributor.handle) },
					{ label: 'quotes', to: paths.profile(q.contributor.handle, 'quotes') },
					q.id
				]
			: [q.id]
		: q.author
			? [
					{ label: 'authors', to: `${paths.search()}?type=authors` },
					{ label: q.author.slug, to: paths.author(q.author.slug) },
					q.id
				]
			: [{ label: 'quotes', to: paths.discover }, q.id];
	const report = (
		<button
			type="button"
			onClick={() => onAction('report')}
			className="tap w-fit cursor-pointer border-0 bg-transparent p-0 font-mono text-[13px] text-muted-foreground transition-colors duration-[180ms] hover:text-foreground"
		>
			{glyph('⚑')} report a problem with this quote
		</button>
	);

	return (
		<div className="pt-page pb-section">
			<PageMeta
				title={`${q.text.length > 60 ? `${q.text.slice(0, 57)}…` : q.text}`}
				description={
					original ? `“${q.text}” Declared original on qotm.` : `“${q.text}” — ${name}. Source and provenance on qotm.`
				}
				canonical={`${window.location.origin}${paths.quote(q.id)}`}
				robots={withdrawn || NOT_INDEXED.includes(q.status) ? 'noindex' : undefined}
			/>
			{/* The quote itself is the page's subject; a heading names it for assistive tech. */}
			<h1 className="sr-only">
				{original
					? `Declared original by ${q.contributor ? `@${q.contributor.handle}` : 'a former member'}`
					: `Quote by ${name}`}
			</h1>
			<Breadcrumbs items={crumbs} />
			<div className="mt-9 mb-card-y flex flex-wrap gap-3">
				{badgesOf(q).map((b) => (
					<StatusBadge key={b} status={b} />
				))}
			</div>
			{withdrawn ? (
				<Notice tone="attention" title="This quote was withdrawn." className="mb-card-y">
					It is no longer on qotm’s feeds and leaves the next dataset release. Its record and history stay here.
				</Notice>
			) : null}
			<QuoteBlock size="lg" quote={q.text} author={original ? undefined : name} cite={cite || undefined} />
			{original ? (
				<div className="mt-3.5">
					<Attribution type="original" contributor={q.contributor?.handle ?? null} />
				</div>
			) : null}
			{withdrawn ? (
				<div className="h-10" />
			) : (
				<div className={original ? 'mt-7 mb-page' : 'mt-7 mb-10'}>
					<ActionBar
						actions={original ? undefined : ['like', 'favorite', 'share', 'report']}
						counts={q.counts}
						state={q.viewer}
						onAction={onAction}
					/>
				</div>
			)}
			<div className="grid grid-cols-[1.4fr_1fr] items-start gap-card-x narrow:grid-cols-1">
				{original ? (
					<div className="flex flex-col gap-grid">
						<Notice title={`Declared original by ${q.contributor ? `@${q.contributor.handle}` : 'a former member'}.`}>
							No known matching attribution found.
						</Notice>
						<ProvenancePanel quote={q} />
					</div>
				) : (
					<ProvenancePanel quote={q} />
				)}
				<div className="flex flex-col gap-grid">
					{original ? (
						<>
							<Card label="Road to the CLI">
								<LifecycleSteps {...lifecycleOf(q)} orientation="vertical" />
							</Card>
							{q.viewer?.recommended ? (
								<Notice tone="wash" title="You recommended this.">
									A recommendation is a curation signal. A curator decides whether it joins the default collection.
								</Notice>
							) : null}
						</>
					) : (
						<>
							{q.author ? <CommandBlock caption="In your terminal" command={`qotm --author ${q.author.slug}`} /> : null}
							{withdrawn ? null : (
								<button
									type="button"
									aria-label="Share this quote"
									onClick={() => setDialog('share')}
									className="cursor-pointer rounded-terminal border-0 bg-transparent p-0"
								>
									<ShareCard quote={q.text} author={name} id={q.id} width={352} className="max-w-full" />
								</button>
							)}
							{q.author ? <MoreFromAuthor slug={q.author.slug} name={q.author.name} /> : null}
						</>
					)}
					{withdrawn ? null : report}
				</div>
			</div>
			{original || withdrawn ? null : <RelatedQuotes q={q} />}
			<ShareDialog
				open={dialog === 'share'}
				onClose={() => setDialog(null)}
				id={q.id}
				text={q.text}
				author={original ? `@${q.contributor?.handle ?? 'qotm'}` : name}
			/>
			<ReportDialog
				open={dialog === 'report'}
				onClose={() => {
					setDialog(null);
					if (location.hash) navigate({ hash: '' }, { replace: true });
				}}
				id={q.id}
			/>
		</div>
	);
}
