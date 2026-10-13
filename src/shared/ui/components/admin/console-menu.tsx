import * as React from 'react';
import { Link } from 'react-router';
import { cn, glyph } from '../../lib/utils';

type ConsoleItem = { id: string; label: string; to: string; count?: React.ReactNode; attention?: boolean };
type ConsoleSection = { title?: string; items: ConsoleItem[] };

type ConsoleMenuProps = {
	sections: ConsoleSection[];
	active?: string;
	className?: string;
};

function Count({ item }: { item: ConsoleItem }) {
	if (item.count == null) return null;
	return (
		<span
			data-attention={item.attention || undefined}
			className={cn(
				'ml-auto font-mono text-[12px] text-stone-600',
				item.attention && 'rounded-pill bg-clay-100 px-[7px] text-clay-700'
			)}
		>
			{item.count}
		</span>
	);
}

/**
 * The console's navigation on a phone (the "Mobile" design, boards 2a/2b):
 * one bar naming the current page and its count; open, a sheet with the
 * untitled and first titled sections (the dashboard and the queues, where the
 * daily work is) as full rows and the rest as chips. Esc, a tap outside or a
 * choice closes it.
 */
function ConsoleMenu({ sections, active, className }: ConsoleMenuProps) {
	const [open, setOpen] = React.useState(false);
	const id = React.useId();
	const items = sections.flatMap((s) => s.items);
	const current = items.find((it) => it.id === active) ?? items[0];
	const rowSections = sections.slice(0, sections.findIndex((s) => s.title) + 1 || sections.length);
	const chipSections = sections.slice(rowSections.length);

	React.useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	const close = () => setOpen(false);
	return (
		<nav aria-label="Console" className={cn('relative', className)}>
			<button
				type="button"
				aria-expanded={open}
				aria-controls={id}
				onClick={() => setOpen((o) => !o)}
				className={cn(
					'flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-field border bg-card px-3.5 text-left',
					open ? 'border-foreground' : 'border-border'
				)}
			>
				<span className="font-mono text-[11px] tracking-[0.12em] text-stone-600 uppercase">Console</span>
				<span className="truncate text-[15px] font-medium text-ink">{current?.label}</span>
				{current ? <Count item={current} /> : null}
				<span
					aria-hidden="true"
					className={cn('font-mono text-[14px] text-stone-600', current?.count == null && 'ml-auto')}
				>
					{glyph(open ? '⌃' : '⌄')}
				</span>
			</button>
			{open ? (
				<>
					<div aria-hidden="true" className="fixed inset-0 z-30 bg-scrim" onClick={close} />
					<div
						id={id}
						className="absolute inset-x-0 top-[calc(100%+8px)] z-40 flex max-h-[70svh] flex-col overflow-y-auto rounded-card border border-border bg-card p-1.5 shadow-raised"
					>
						{rowSections.map((s, i) => (
							<div key={s.title ?? i} className="flex flex-col">
								{s.title ? (
									<p className="m-0 px-3 pt-2.5 pb-1 font-mono text-[11px] tracking-[0.14em] text-stone-600 uppercase">
										{s.title}
									</p>
								) : null}
								{s.items.map((it) => (
									<Link
										key={it.id}
										to={it.to}
										onClick={close}
										aria-current={it.id === active ? 'page' : undefined}
										className="flex h-11 items-center rounded-[10px] px-3 text-[15px] text-ink no-underline aria-[current=page]:bg-background aria-[current=page]:font-medium"
									>
										{it.label}
										<Count item={it} />
									</Link>
								))}
							</div>
						))}
						{chipSections.length ? (
							<>
								<p className="m-0 px-3 pt-2.5 pb-1 font-mono text-[11px] tracking-[0.14em] text-stone-600 uppercase">
									{chipSections.map((s) => s.title).join(' · ')}
								</p>
								<div className="flex flex-wrap gap-1.5 p-1.5">
									{chipSections
										.flatMap((s) => s.items)
										.map((it) => (
											<Link
												key={it.id}
												to={it.to}
												onClick={close}
												aria-current={it.id === active ? 'page' : undefined}
												className="inline-flex h-11 items-center rounded-pill border border-border px-3.5 text-[14px] text-ink no-underline aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
											>
												{it.label}
											</Link>
										))}
								</div>
							</>
						) : null}
					</div>
				</>
			) : null}
		</nav>
	);
}

export { ConsoleMenu };
export type { ConsoleMenuProps, ConsoleSection };
