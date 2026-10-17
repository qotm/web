import * as React from 'react';
import { Link, useLocation } from 'react-router';
import { Button, Checkbox, IconButton, PageMeta, Pagination, StatusBadge, cn, glyph } from '@/shared/ui';
import { isTyping, nextAfter, stepFrom } from '../lib/queues';
import { QueueNav, useQueueNav, type Nav } from '../lib/queue-nav';
import { useAutoNext } from '../lib/use-auto-next';

/** One queue item as the list shows it. */
export type QueueCard = {
	id: string;
	/** Who sent it in or reported it ("@ada"). */
	who?: React.ReactNode;
	/** How long it has waited ("6d"). */
	age?: React.ReactNode;
	/** The main line: the quote, or what was reported. */
	text: React.ReactNode;
	/** The quiet line under it (the author); `flag` marks something to fix ("Author not linked"). */
	by?: React.ReactNode;
	flag?: boolean;
	/** Left out where every item shares it (originality holds). */
	status?: string;
};

type ReviewQueueProps = {
	/** The page's title ("Verification queue"), its <title> and the list's name. */
	title: string;
	description: React.ReactNode;
	cards: QueueCard[];
	selectedId?: string;
	/** An item was chosen: a phone shows it instead of the list. */
	opened: boolean;
	select: (id: string) => void;
	close: () => void;
	page: number;
	pageSize: number;
	total: number;
	onPage: (page: number) => void;
	/** Shown in place of the list and the pane (loading, an error, an empty queue). */
	fallback?: React.ReactNode;
	/** The selected item's ReviewPane. */
	children?: React.ReactNode;
};

/**
 * A review queue as a split inbox (canvas "Admin review", 2B): the queue as a
 * list on the left, the selected item in a pane on the right with its
 * decision pinned under it, so nothing needs scrolling to decide. On a phone
 * the list and the item are two screens. J / K (or the pane's arrows) move
 * between items, and a decision opens the next one unless that is turned off.
 */
export function ReviewQueue({
	title,
	description,
	cards,
	selectedId,
	opened,
	select,
	close,
	page,
	pageSize,
	total,
	onPage,
	fallback,
	children
}: ReviewQueueProps) {
	const { search } = useLocation();
	const [autoNext, setAutoNext] = useAutoNext();
	const ids = cards.map((c) => c.id);
	const index = selectedId ? ids.indexOf(selectedId) : -1;
	const prev = stepFrom(ids, selectedId, -1);
	const next = stepFrom(ids, selectedId, 1);

	const nav: Nav = {
		position: index < 0 ? '' : `${(page - 1) * pageSize + index + 1} of ${total}`,
		prev,
		next,
		go: select,
		close,
		advance: () => {
			if (!autoNext || !selectedId) return;
			const to = nextAfter(ids, selectedId);
			if (to) select(to);
			else close();
		},
		autoNext,
		setAutoNext,
		selectedId
	};

	// J / K move down and up the queue, unless a field or a dialog has the keys. The
	// position moves at once, so a burst of presses steps through before React re-renders.
	const at = React.useRef({ ids, id: selectedId });
	React.useLayoutEffect(() => {
		at.current = { ids, id: selectedId };
	});
	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
			if (document.querySelector('[aria-modal="true"]')) return;
			const by = e.key === 'j' ? 1 : e.key === 'k' ? -1 : 0;
			const to = by && stepFrom(at.current.ids, at.current.id, by);
			if (!to) return;
			e.preventDefault();
			at.current = { ...at.current, id: to };
			select(to);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [select]);

	// On a desktop the split fills the window and the page stays put: the list and the item scroll.
	const root = React.useRef<HTMLDivElement>(null);
	useFillWindow(root, !fallback);
	// Keep the open item in sight in the list as J / K move.
	React.useEffect(() => {
		root.current?.querySelector('[data-selected]')?.scrollIntoView?.({ block: 'nearest' });
	}, [selectedId]);

	const href = (id: string) => {
		const p = new URLSearchParams(search);
		p.set('id', id);
		return { search: `?${p}` };
	};

	return (
		<div
			ref={root}
			className={cn(
				'grid grid-cols-[minmax(0,1fr)] items-start gap-grid lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]',
				!fallback && 'lg:h-(--review-h)'
			)}
		>
			<PageMeta title={title} robots="noindex" />
			<header className={cn('flex flex-col gap-2 lg:col-start-1', opened && 'max-lg:hidden')}>
				<h1 className="m-0 text-h1">{title}.</h1>
				<p className="m-0 text-[15px] text-muted-foreground">{description}</p>
				{cards.length ? (
					<p className="m-0 font-mono text-[12px] text-stone-600">
						{total.toLocaleString('en-US')} waiting · oldest first
						<span className="max-lg:hidden"> · J / K to move</span>
					</p>
				) : null}
			</header>
			{fallback ? (
				<div className="lg:col-span-2">{fallback}</div>
			) : (
				<>
					<div
						className={cn('flex flex-col gap-3 lg:col-start-1 lg:min-h-0 lg:self-stretch', opened && 'max-lg:hidden')}
					>
						<ul
							aria-label={title}
							className="m-0 flex list-none flex-col overflow-hidden rounded-card border border-border bg-card p-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-slim"
						>
							{cards.map((c) => {
								const on = c.id === selectedId;
								return (
									<li
										key={c.id}
										data-selected={on || undefined}
										className="shrink-0 border-b border-border last:border-b-0"
									>
										<Link
											to={href(c.id)}
											aria-label={`Review ${c.id}`}
											aria-current={on && opened ? 'true' : undefined}
											className={cn(
												'flex flex-col gap-1.5 border-l-[3px] border-transparent px-4 py-3.5 text-ink no-underline hover:bg-background',
												on && (opened ? 'border-l-clay-600 bg-background' : 'lg:border-l-clay-600 lg:bg-background')
											)}
										>
											<span className="flex items-baseline justify-between gap-3 font-mono text-[12px] text-stone-600">
												<span className="truncate">
													{c.id}
													{c.who ? <> · {c.who}</> : null}
												</span>
												{c.age ? <span className="text-ink">{c.age}</span> : null}
											</span>
											<span className={cn('line-clamp-2 text-[15px]/[1.4] wrap-anywhere', on && 'font-medium')}>
												{c.text}
											</span>
											<span className="flex items-center justify-between gap-3">
												<span
													className={cn('truncate text-[13px]', c.flag ? 'text-clay-700' : 'text-muted-foreground')}
												>
													{c.by}
												</span>
												{c.status ? <StatusBadge status={c.status} className="shrink-0" /> : null}
											</span>
										</Link>
									</li>
								);
							})}
						</ul>
						{total > pageSize ? (
							<Pagination
								compact
								page={page}
								pageSize={pageSize}
								total={total}
								onPage={onPage}
								className="shrink-0 py-0"
							/>
						) : null}
					</div>
					<div
						className={cn(
							'min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0 lg:self-stretch',
							!opened && 'max-lg:hidden'
						)}
					>
						<QueueNav.Provider value={nav}>{children}</QueueNav.Provider>
					</div>
				</>
			)}
		</div>
	);
}

/** Under 480px of room the page scrolls after all, rather than squeeze the item. */
const MIN_HEIGHT = 480;

/**
 * Sizes the split to the window on a desktop (`--review-h`: from where it
 * starts to the window's foot, less the shell's 24px foot), so the page does
 * not scroll and nothing moves as the list or the item does.
 */
function useFillWindow(ref: React.RefObject<HTMLElement | null>, on: boolean) {
	React.useLayoutEffect(() => {
		const el = ref.current;
		if (!on || !el) return;
		const fit = () => {
			const top = el.getBoundingClientRect().top + window.scrollY;
			el.style.setProperty('--review-h', `${Math.max(MIN_HEIGHT, window.innerHeight - top - 24)}px`);
		};
		fit();
		window.addEventListener('resize', fit);
		return () => window.removeEventListener('resize', fit);
	}, [ref, on]);
}

type ReviewPaneProps = {
	/** The pane's accessible name ("Submission q_5k0q2j"). */
	label: string;
	/** The state and the one-line facts above the item. */
	head: React.ReactNode;
	/** The decision, pinned under the item. */
	dock?: React.ReactNode;
	children: React.ReactNode;
};

/**
 * The selected item: its head with the queue position and arrows, the item
 * scrolling on its own, and the decision pinned at the foot, where a phone's
 * thumb reaches it.
 */
export function ReviewPane({ label, head, dock, children }: ReviewPaneProps) {
	const nav = useQueueNav();
	const body = React.useRef<HTMLDivElement>(null);

	// Another item: back to its top (the pane's own scroll, or a phone's page).
	React.useEffect(() => {
		body.current?.scrollTo?.({ top: 0 });
		if (typeof window.matchMedia === 'function' && !window.matchMedia('(min-width: 1024px)').matches)
			window.scrollTo?.({ top: 0 });
	}, [nav.selectedId]);

	return (
		<section
			aria-label={label}
			className="flex flex-col rounded-card border border-border bg-card lg:h-full lg:overflow-hidden"
		>
			<div className="sticky top-0 z-10 flex items-center gap-3 rounded-t-card border-b border-border bg-card px-4 py-2.5 lg:static">
				<Button variant="quiet" size="sm" className="tap -ml-2 lg:hidden" onClick={nav.close}>
					{glyph('←')} Queue
				</Button>
				<div className="flex min-w-0 flex-wrap items-center gap-2 max-lg:hidden">{head}</div>
				<div className="ml-auto flex shrink-0 items-center gap-2">
					<span className="font-mono text-[12px] whitespace-nowrap text-stone-600">{nav.position}</span>
					<IconButton
						glyph="↑"
						label="Previous"
						size="sm"
						disabled={!nav.prev}
						onClick={() => nav.prev && nav.go(nav.prev)}
					/>
					<IconButton
						glyph="↓"
						label="Next"
						size="sm"
						disabled={!nav.next}
						onClick={() => nav.next && nav.go(nav.next)}
					/>
				</div>
			</div>
			<div
				ref={body}
				className="flex flex-col gap-grid px-card-x py-card-y lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:scrollbar-slim"
			>
				<div className="flex flex-wrap items-center gap-2 lg:hidden">{head}</div>
				{children}
			</div>
			{dock ? (
				<div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-card border-t border-border bg-background px-card-x py-4 lg:static">
					{dock}
					{/* A phone keeps the setting without spending a row of the dock on it. */}
					<Checkbox
						label="Open the next one after a decision"
						checked={nav.autoNext}
						onChange={(e) => nav.setAutoNext(e.target.checked)}
						className="text-[14px] max-lg:hidden"
					/>
				</div>
			) : null}
		</section>
	);
}
