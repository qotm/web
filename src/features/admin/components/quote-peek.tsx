import * as React from 'react';
import { Link } from 'react-router';
import { useAdminQuoteQuery, useAdminReportsQuery, useNominateQuoteMutation } from '@/features/admin/api';
import { PageSkeleton, StateScreen } from '@/shared/layouts';
import { Button, IconButton, Notice, ProvenancePanel, QuoteBlock, StatusBadge, TextLink, notify } from '@/shared/ui';
import { adminPaths, paths } from '@/lib/paths';
import { isTyping, waitsIn } from '../lib/queues';
import { refusal } from '../lib/refusal';
import { CorrectDialog } from './correct-dialog';
import { Signals } from './signals';

const QUEUE_ACTION = {
	submissions: 'Open in originality holds',
	verification: 'Open in verification queue',
	curation: 'Open in curation queue'
} as const;

type QuotePeekProps = {
	id: string;
	/** "2 of 25", on the table's page. */
	position: string;
	prev: string | null;
	next: string | null;
	onGo: (id: string) => void;
	onClose: () => void;
};

/**
 * A quote's admin facts beside the quotes table (canvas "Admin review", 1b):
 * its state and provenance, an open report, its signals and releases, the
 * latest history, and quick actions. Deciding happens in the queue it waits
 * in, which the main action opens. The table stays usable beside it; ↑ ↓ or
 * J / K step through the page, Esc closes. A phone gets it full screen.
 */
export function QuotePeek({ id, position, prev, next, onGo, onClose }: QuotePeekProps) {
	const { data: quote, isLoading, isError, refetch } = useAdminQuoteQuery(id);
	const { data: reports } = useAdminReportsQuery({ status: 'open', quote: id, limit: 5 });
	const [correcting, setCorrecting] = React.useState(false);
	const panel = React.useRef<HTMLElement>(null);
	const body = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		panel.current?.focus({ preventScroll: true });
	}, []);
	React.useEffect(() => {
		body.current?.scrollTo?.({ top: 0 });
	}, [id]);
	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
			if (document.querySelector('[aria-modal="true"]')) return;
			if (e.key === 'Escape') return onClose();
			const to = e.key === 'j' ? next : e.key === 'k' ? prev : null;
			if (!to) return;
			e.preventDefault();
			onGo(to);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [next, prev, onGo, onClose]);

	const report = reports?.list[0];
	const queue = quote ? waitsIn(quote) : null;
	const action = report
		? { to: `${adminPaths.reports}?id=${report.id}`, label: 'Review report' }
		: queue
			? { to: `${adminPaths[queue]}?id=${id}`, label: QUEUE_ACTION[queue] }
			: null;
	const history = quote ? quote.history.toReversed().slice(0, 3) : [];
	// A published original not yet in curation: a curator may put it forward.
	const nominable =
		!action && quote?.type === 'original' && ['PUBLISHED', 'COMMUNITY_DISCOVERY'].includes(quote.status);
	const [nominate, { isLoading: nominating }] = useNominateQuoteMutation();

	return (
		<aside
			ref={panel}
			role="dialog"
			aria-modal="false"
			aria-label={`Quote ${id}`}
			tabIndex={-1}
			className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-border bg-card shadow-raised outline-none lg:w-[560px]"
		>
			<div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
				<IconButton glyph="↑" label="Previous quote" size="sm" disabled={!prev} onClick={() => prev && onGo(prev)} />
				<IconButton glyph="↓" label="Next quote" size="sm" disabled={!next} onClick={() => next && onGo(next)} />
				<span className="ml-1 font-mono text-[12px] whitespace-nowrap text-stone-600">
					{position}
					{position ? <span className="max-sm:hidden"> on this page</span> : null}
				</span>
				<TextLink to={paths.quote(id)} mono variant="quiet" className="ml-auto text-[13px] whitespace-nowrap">
					public page ↗
				</TextLink>
				<IconButton glyph="✕" label="Close" variant="ghost" size="sm" onClick={onClose} />
			</div>
			<div
				ref={body}
				className="flex min-h-0 flex-1 flex-col gap-grid overflow-y-auto overscroll-contain scrollbar-slim px-card-x py-card-y"
			>
				{isLoading ? (
					<PageSkeleton />
				) : isError || !quote ? (
					<StateScreen compact title="This quote did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void refetch()}>
							Try again
						</Button>
					</StateScreen>
				) : (
					<>
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge status={quote.status} />
							<span className="font-mono text-[12px] text-stone-600">
								{quote.id} · {quote.type}
								{quote.contributor ? ` · by @${quote.contributor.handle}` : ''}
								{quote.verifier ? ` · verified by @${quote.verifier.handle}` : ''}
							</span>
						</div>
						<QuoteBlock
							size="sm"
							quote={quote.text}
							author={quote.author?.name ?? quote.attribution ?? undefined}
							cite={[quote.source?.title ?? quote.work, quote.year].filter(Boolean).join(', ') || undefined}
						/>
						{report ? (
							<Notice
								tone="attention"
								title={`${reports.total} open report${reports.total === 1 ? '' : 's'} · ${report.reason}`}
							>
								{report.details ? `“${report.details}”` : 'No details given.'}
							</Notice>
						) : null}
						<ProvenancePanel quote={quote} />
						<Signals
							counts={quote.counts}
							original={quote.type === 'original'}
							more={[{ label: 'releases', value: quote.releases.join(', ') || 'none yet' }]}
						/>
						<section aria-labelledby="h-peek-history" className="flex flex-col gap-2">
							<div className="flex items-baseline justify-between gap-3">
								<h3
									id="h-peek-history"
									className="m-0 font-mono text-[12px]/[1.6] font-normal tracking-[0.14em] text-stone-600 uppercase"
								>
									History
								</h3>
								<TextLink to={`${adminPaths.audit}?q=${quote.id}`} mono variant="quiet" className="text-[12px]">
									all in the audit log →
								</TextLink>
							</div>
							<ul className="m-0 flex list-none flex-col gap-2 p-0">
								{history.map((h) => (
									<li key={h.at} className="flex flex-col gap-1 text-[15px]/[1.45]">
										<span className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-stone-600">
											<StatusBadge status={h.status} />
											{h.by ? `@${h.by.handle}` : 'qotm'} · {h.at.slice(0, 10)}
										</span>
										{h.note ? <span className="wrap-anywhere">{h.note}</span> : null}
									</li>
								))}
							</ul>
						</section>
						<CorrectDialog
							quote={quote}
							title="Correct the quote"
							open={correcting}
							onClose={() => setCorrecting(false)}
						/>
					</>
				)}
			</div>
			<div className="flex flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-3">
				<Button size="sm" variant="outline" disabled={!quote} onClick={() => setCorrecting(true)}>
					Correct…
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => void navigator.clipboard.writeText(id).then(() => notify(`Copied ${id}.`))}
				>
					Copy id
				</Button>
				{action ? (
					<Button asChild size="sm" className="ml-auto">
						<Link to={action.to}>{action.label} →</Link>
					</Button>
				) : nominable ? (
					<Button
						size="sm"
						className="ml-auto"
						disabled={nominating}
						onClick={async () => {
							const res = await nominate({ id, body: {} });
							if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
							notify(`${id} is a curation candidate.`);
						}}
					>
						Nominate for curation
					</Button>
				) : null}
			</div>
		</aside>
	);
}
