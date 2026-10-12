import * as React from 'react';
import { cn } from '../../lib/utils';
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
	empty?: React.ReactNode;
	dense?: boolean;
	/** The table's accessible name. */
	label?: string;
	className?: string;
};

const cell = (value: unknown) =>
	typeof value === 'number' ? value.toLocaleString('en-US') : (value as React.ReactNode);

/** qotm_kit DataTable: the admin console's tables, scrolling inside their own box. */
function DataTable<T>({
	columns,
	rows,
	rowKey,
	selectable = false,
	selected,
	onSelect,
	onRowClick,
	rowLabel,
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
	return (
		<div className={cn('overflow-x-auto rounded-card border border-border bg-card', className)}>
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
							return (
								<tr
									key={k}
									aria-selected={selectable ? on : undefined}
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
	);
}

export { DataTable };
export type { DataTableProps, Column };
