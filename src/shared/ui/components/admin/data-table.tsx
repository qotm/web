import * as React from 'react';
import { cn, glyph } from '../../lib/utils';
import { StatusBadge } from '../ui/status-badge';

type Column<T> = {
	key: string;
	label: React.ReactNode;
	/** Mono, meta size, stone (ids, handles, ages). */
	mono?: boolean;
	width?: number | string;
	align?: 'left' | 'right' | 'center';
	/** The cell; by default the row's value at `key` (a `status` column renders a StatusBadge). */
	render?: (row: T) => React.ReactNode;
	/**
	 * Its place when the row is a card (a container under 480px): `id` and
	 * `badge` on the top line, `end` at its far end, `title` the main line,
	 * `meta` the quiet line under it, `hide` left out. By default: a leading
	 * mono column is the id, a status/state/role column a badge, a right-aligned
	 * mono column the end, the first other column the title, the rest meta.
	 */
	card?: 'id' | 'badge' | 'end' | 'title' | 'meta' | 'hide';
};

type DataTableProps<T> = {
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	/** A checkbox per row and a select-all; controlled through `selected` / `onSelect`, or on its own. */
	selectable?: boolean;
	selected?: string[];
	onSelect?: (keys: string[]) => void;
	/** Rows become targets: click, or Enter / Space when focused. */
	onRowClick?: (row: T) => void;
	/** Names a clickable row for assistive tech ("Open q_6h2w8r"). */
	rowLabel?: (row: T) => string;
	/** The row whose detail is open beside the table (a drawer): marked, and `aria-current`. */
	activeKey?: string;
	empty?: React.ReactNode;
	dense?: boolean;
	/** The table's accessible name. */
	label?: string;
	className?: string;
};

const cell = (value: unknown) =>
	typeof value === 'number' ? value.toLocaleString('en-US') : (value as React.ReactNode);

type Role = NonNullable<Column<unknown>['card']>;
/** Each column's place on a row card (see `Column.card`). */
function cardRoles<T>(columns: Column<T>[]): Role[] {
	let title = false;
	return columns.map((c, i) => {
		if (c.card) {
			if (c.card === 'title') title = true;
			return c.card;
		}
		if (i === 0 && c.mono) return 'id';
		if (['status', 'state', 'role'].includes(c.key)) return 'badge';
		if (c.mono && c.align === 'right') return 'end';
		if (!title && !c.mono) {
			title = true;
			return 'title';
		}
		return 'meta';
	});
}

function Cell<T>({ column: c, row }: { column: Column<T>; row: T }) {
	const value = (row as Record<string, unknown>)[c.key];
	if (c.render) return <>{c.render(row)}</>;
	if (c.key === 'status' && typeof value === 'string') return <StatusBadge status={value} />;
	return <>{cell(value)}</>;
}

/**
 * The rows as cards, for a phone (the "Mobile" design, board 3): the id,
 * state and age on top, the main column as the title, the rest as one quiet
 * line, the whole card the tap target.
 */
function RowCards<T>({
	columns,
	rows,
	rowKey,
	selectable,
	sel,
	toggle,
	onRowClick,
	rowLabel,
	empty
}: {
	columns: Column<T>[];
	rows: T[];
	rowKey: (row: T) => string;
	selectable: boolean;
	sel: string[];
	toggle: (key: string) => void;
	onRowClick?: (row: T) => void;
	rowLabel?: (row: T) => string;
	empty: React.ReactNode;
}) {
	const roles = cardRoles(columns);
	const by = (role: Role) => columns.filter((_, i) => roles[i] === role);
	if (!rows.length)
		return (
			<p className="m-0 rounded-card border border-border bg-card p-page text-center font-mono text-[13px] text-muted-foreground">
				{empty}
			</p>
		);
	return (
		<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
			{rows.map((r) => {
				const k = rowKey(r);
				const on = sel.includes(k);
				const open = onRowClick ? () => onRowClick(r) : undefined;
				return (
					<li
						key={k}
						aria-label={onRowClick && rowLabel ? rowLabel(r) : undefined}
						aria-selected={selectable ? on : undefined}
						tabIndex={open ? 0 : undefined}
						onClick={open}
						onKeyDown={
							open
								? (e) => {
										if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
										e.preventDefault();
										open();
									}
								: undefined
						}
						className={cn(
							'flex flex-col gap-2 rounded-card border border-border bg-card p-4 text-[15px]/[1.4]',
							open && 'cursor-pointer hover:border-stone-400',
							on && 'border-clay-500 bg-clay-100'
						)}
					>
						{selectable || by('id').length || by('badge').length || by('end').length ? (
							<div className="flex min-h-6 flex-wrap items-center gap-2">
								{selectable ? (
									<input
										type="checkbox"
										aria-label={`Select ${k}`}
										className="tap m-0 size-4 accent-clay-500"
										checked={on}
										onClick={(e) => e.stopPropagation()}
										onChange={() => toggle(k)}
									/>
								) : null}
								{by('id').map((c) => (
									<span key={c.key} className="font-mono text-[13px] text-stone-600">
										<Cell column={c} row={r} />
									</span>
								))}
								{by('badge').map((c) => (
									<Cell key={c.key} column={c} row={r} />
								))}
								{by('end').map((c) => (
									<span key={c.key} className="ml-auto font-mono text-[13px] text-stone-600">
										<Cell column={c} row={r} />
									</span>
								))}
							</div>
						) : null}
						{by('title').map((c) => (
							<div key={c.key} className="font-medium text-ink [&_*]:max-w-none [&_*]:line-clamp-3">
								<Cell column={c} row={r} />
							</div>
						))}
						{by('meta').length || open ? (
							<div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
								{by('meta').map((c) => (
									<span key={c.key} className="inline-flex items-baseline gap-1.5 font-mono text-[12px] text-stone-600">
										<span className="tracking-[0.08em] uppercase">{c.label}</span>
										<span className="text-[13px] text-foreground">
											<Cell column={c} row={r} />
										</span>
									</span>
								))}
								{open ? (
									<span aria-hidden="true" className="ml-auto text-[14px] font-medium text-link">
										{glyph('→')}
									</span>
								) : null}
							</div>
						) : null}
					</li>
				);
			})}
		</ul>
	);
}

/**
 * qotm_kit DataTable: the admin console's tables, scrolling inside their own
 * box (with a fade on the cut edge while there is more to scroll to). In a
 * container under 480px wide the rows become cards (`RowCards`).
 */
function DataTable<T>({
	columns,
	rows,
	rowKey,
	selectable = false,
	selected,
	onSelect,
	onRowClick,
	rowLabel,
	activeKey,
	empty = 'Nothing here.',
	dense = false,
	label,
	className
}: DataTableProps<T>) {
	const [inner, setInner] = React.useState<string[]>([]);
	const sel = selected ?? inner;
	const set = (v: string[]) => {
		setInner(v);
		onSelect?.(v);
	};
	const keys = rows.map(rowKey);
	const all = rows.length > 0 && keys.every((k) => sel.includes(k));
	const some = !all && keys.some((k) => sel.includes(k));
	// The UA's checkbox margin, which the kit keeps and preflight removes.
	const box = 'm-[3px_3px_3px_4px] size-[13px] accent-clay-500';
	const th =
		'border-b border-border bg-background px-4 py-3 text-left font-mono text-[12px] font-normal tracking-[0.12em] whitespace-nowrap text-stone-600 uppercase';
	const td = cn('border-b border-border px-4 align-middle group-last/row:border-b-0', dense ? 'py-2' : 'py-3');
	const scroller = React.useRef<HTMLDivElement>(null);
	const [more, setMore] = React.useState(false);
	React.useEffect(() => {
		const el = scroller.current;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const check = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
		check();
		const observer = new ResizeObserver(check);
		observer.observe(el);
		el.addEventListener('scroll', check, { passive: true });
		return () => {
			observer.disconnect();
			el.removeEventListener('scroll', check);
		};
	}, [rows.length]);
	return (
		<div className={cn('@container', className)}>
			<div className="relative hidden @min-[480px]:block">
				<div ref={scroller} data-table-box className="overflow-x-auto rounded-card border border-border bg-card">
					<table aria-label={label} className="w-full border-collapse text-[15px]/[1.4]">
						<thead>
							<tr>
								{selectable ? (
									<th className={cn(th, 'w-5 pr-0')}>
										<input
											type="checkbox"
											aria-label="Select all"
											className={box}
											checked={all}
											ref={(el) => {
												if (el) el.indeterminate = some;
											}}
											onChange={() => set(all ? [] : keys)}
										/>
									</th>
								) : null}
								{columns.map((c) => (
									<th
										key={c.key}
										scope="col"
										className={cn(th, 'box-content')}
										style={{ width: c.width, textAlign: c.align }}
									>
										{c.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td
										colSpan={columns.length + (selectable ? 1 : 0)}
										className="p-page text-center font-mono text-[13px] text-muted-foreground"
									>
										{empty}
									</td>
								</tr>
							) : (
								rows.map((r) => {
									const k = rowKey(r);
									const on = sel.includes(k);
									const active = k === activeKey;
									return (
										<tr
											key={k}
											aria-selected={selectable ? on : undefined}
											aria-current={active ? 'true' : undefined}
											aria-label={onRowClick && rowLabel ? rowLabel(r) : undefined}
											tabIndex={onRowClick ? 0 : undefined}
											onClick={onRowClick ? () => onRowClick(r) : undefined}
											onKeyDown={
												onRowClick
													? (e) => {
															if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
															e.preventDefault();
															onRowClick(r);
														}
													: undefined
											}
											className={cn(
												'group/row [&:hover>td]:bg-background',
												on && '[&>td]:bg-clay-100 [&:hover>td]:bg-clay-100',
												active &&
													'[&>td]:bg-background [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-clay-600)]',
												onRowClick && 'cursor-pointer'
											)}
										>
											{selectable ? (
												<td className={cn(td, 'w-5 pr-0')} onClick={(e) => e.stopPropagation()}>
													<input
														type="checkbox"
														aria-label={`Select ${k}`}
														className={box}
														checked={on}
														onChange={() => set(on ? sel.filter((x) => x !== k) : [...sel, k])}
													/>
												</td>
											) : null}
											{columns.map((c) => {
												const value = (r as Record<string, unknown>)[c.key];
												return (
													<td
														key={c.key}
														className={cn(td, c.mono && 'font-mono text-[13px] text-stone-600')}
														style={{ textAlign: c.align }}
													>
														{c.render ? (
															c.render(r)
														) : c.key === 'status' && typeof value === 'string' ? (
															<StatusBadge status={value} />
														) : (
															cell(value)
														)}
													</td>
												);
											})}
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
				{more ? (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-y-px right-px w-10 rounded-r-card bg-gradient-to-l from-card to-transparent"
					/>
				) : null}
			</div>
			<div className="@min-[480px]:hidden">
				<RowCards
					columns={columns}
					rows={rows}
					rowKey={rowKey}
					selectable={selectable}
					sel={sel}
					toggle={(k) => set(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}
					onRowClick={onRowClick}
					rowLabel={rowLabel}
					empty={empty}
				/>
			</div>
		</div>
	);
}

export { DataTable };
export type { DataTableProps, Column };
