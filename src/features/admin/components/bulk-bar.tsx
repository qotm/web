import * as React from 'react';
import { useBulkTopicMutation, useBulkWithdrawMutation } from '@/features/admin/api';
import { useTopicsQuery } from '@/features/quotes/api';
import type { AdminQuoteRowEntity, BulkResultEntity } from '@/shared/types';
import { Button, Dialog, Field, Input, Textarea, cn, glyph, notify } from '@/shared/ui';
import { count } from '@/lib/count';
import { refusal } from '../lib/refusal';

/** What a bulk action did, as the notice above the table says it. */
export type BulkOutcome = {
	title: string;
	/** The skipped ones and why. */
	detail?: string;
	/** Ids that stay selected (the skipped ones, to look at). */
	keep: string[];
	/** Puts a topic change back. */
	undo?: () => Promise<void>;
};

type BulkBarProps = {
	selected: AdminQuoteRowEntity[];
	onClear: () => void;
	/** Queues the CSV of these ids. */
	onExport: (ids: string[]) => void;
	exporting: boolean;
	onDone: (outcome: BulkOutcome) => void;
};

const skippedDetail = (r: BulkResultEntity) =>
	r.skipped.length ? r.skipped.map((s) => `${s.id}: ${s.reason}.`).join(' ') : undefined;

/**
 * The selection's actions (canvas "Bulk actions"): a bar pinned to the foot
 * of the window while rows are selected, with Add / Remove topic, Export CSV,
 * Copy ids and Withdraw…. A phone gets "N selected · Actions", which opens
 * the same actions as a sheet. Never verify or curate in bulk.
 */
export function BulkBar({ selected, onClear, onExport, exporting, onDone }: BulkBarProps) {
	const ids = selected.map((r) => r.id);
	const [panel, setPanel] = React.useState<'add' | 'remove' | 'sheet' | 'withdraw' | null>(null);
	const copy = () =>
		void navigator.clipboard.writeText(ids.join('\n')).then(() => notify(`Copied ${count(ids.length, 'id')}.`));

	const button =
		'tap h-[34px] cursor-pointer rounded-control border-0 bg-[#23201d] px-3 font-sans text-[14px] text-dark-foreground hover:bg-[#2e2a26]';
	return (
		<>
			<div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
				<div className="pointer-events-auto relative">
					{panel === 'add' || panel === 'remove' ? (
						<TopicPanel
							mode={panel}
							selected={selected}
							onClose={() => setPanel(null)}
							onDone={(outcome) => {
								setPanel(null);
								onDone(outcome);
							}}
						/>
					) : null}
					<div
						role="toolbar"
						aria-label="Selected quotes"
						className="flex items-center gap-1.5 rounded-card bg-dark py-2 pr-2 pl-[18px] shadow-[0_18px_40px_-18px_rgba(20,18,16,0.55)]"
					>
						<span className="pr-2.5 font-mono text-[13px] whitespace-nowrap text-dark-foreground">
							{ids.length} selected
						</span>
						<span aria-hidden="true" className="mr-1.5 h-[22px] w-px bg-dark-rule narrow:hidden" />
						<div className="flex items-center gap-1.5 narrow:hidden">
							<button type="button" className={button} onClick={() => setPanel(panel === 'add' ? null : 'add')}>
								Add topic {glyph('⌄')}
							</button>
							<button type="button" className={button} onClick={() => setPanel(panel === 'remove' ? null : 'remove')}>
								Remove topic {glyph('⌄')}
							</button>
							<button type="button" className={button} disabled={exporting} onClick={() => onExport(ids)}>
								Export CSV
							</button>
							<button type="button" className={button} onClick={copy}>
								Copy ids
							</button>
							<button
								type="button"
								className={cn(button, 'bg-clay-400 font-medium text-ink hover:bg-clay-500')}
								onClick={() => setPanel('withdraw')}
							>
								Withdraw…
							</button>
						</div>
						<button
							type="button"
							className={cn(button, 'roomy:hidden')}
							aria-haspopup="dialog"
							onClick={() => setPanel('sheet')}
						>
							Actions {glyph('⌄')}
						</button>
						<button
							type="button"
							aria-label="Clear the selection"
							className="tap flex size-[34px] cursor-pointer items-center justify-center rounded-control border-0 bg-transparent font-mono text-[14px] text-stone-400 hover:text-dark-foreground"
							onClick={onClear}
						>
							{glyph('✕')}
						</button>
					</div>
				</div>
			</div>
			{panel === 'sheet' ? (
				<ActionSheet
					count={ids.length}
					onClose={() => setPanel(null)}
					onPick={(action) => {
						if (action === 'export') {
							setPanel(null);
							onExport(ids);
						} else if (action === 'copy') {
							setPanel(null);
							copy();
						} else if (action === 'clear') {
							setPanel(null);
							onClear();
						} else setPanel(action);
					}}
				/>
			) : null}
			{panel === 'withdraw' ? (
				<WithdrawDialog
					ids={ids}
					onClose={() => setPanel(null)}
					onDone={(outcome) => {
						setPanel(null);
						onDone(outcome);
					}}
				/>
			) : null}
		</>
	);
}

/** Withdraw the selection: what it does, the ids, and the note every quote gets. */
function WithdrawDialog({
	ids,
	onClose,
	onDone
}: {
	ids: string[];
	onClose: () => void;
	onDone: (outcome: BulkOutcome) => void;
}) {
	const [note, setNote] = React.useState('');
	const [error, setError] = React.useState<string | null>(null);
	const [withdraw, { isLoading }] = useBulkWithdrawMutation();
	const submit = async () => {
		if (!note.trim()) return setError('Say why, for the audit log');
		const res = await withdraw({ ids, note: note.trim() });
		if ('error' in res) return setError(refusal(res.error, 'Nothing was withdrawn. Try again.'));
		const r = res.data;
		onDone({
			title: `${count(r.done.length, 'quote')} withdrawn.${r.skipped.length ? ` ${r.skipped.length} skipped.` : ''}`,
			detail: skippedDetail(r),
			keep: r.skipped.map((s) => s.id)
		});
	};
	return (
		<Dialog
			onClose={onClose}
			width={500}
			role="alertdialog"
			title={`Withdraw ${count(ids.length, 'quote')}?`}
			description="They leave the feeds and the next release; installs drop them on their next sync. Their pages, records and histories stay. Each gets its own history step and audit entry, with this note."
			footer={
				<>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="danger" disabled={isLoading} onClick={() => void submit()}>
						Withdraw {count(ids.length, 'quote')}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				<p className="m-0 font-mono text-[12px] tracking-[0.04em] break-words text-muted-foreground">
					{ids.join(' · ')}
				</p>
				<Field
					label="Note"
					htmlFor="bulk-withdraw-note"
					hint="Required, kept in the audit log"
					error={error ?? undefined}
				>
					<Textarea
						id="bulk-withdraw-note"
						rows={3}
						maxLength={1000}
						value={note}
						onChange={(e) => {
							setNote(e.target.value);
							setError(null);
						}}
					/>
				</Field>
			</div>
		</Dialog>
	);
}

/** Add a topic to the selection, or take one off: searched, with how many already have each. */
function TopicPanel({
	mode,
	selected,
	onClose,
	onDone
}: {
	mode: 'add' | 'remove';
	selected: AdminQuoteRowEntity[];
	onClose: () => void;
	onDone: (outcome: BulkOutcome) => void;
}) {
	const { data } = useTopicsQuery();
	const [change, { isLoading }] = useBulkTopicMutation();
	const [query, setQuery] = React.useState('');
	const root = React.useRef<HTMLDivElement>(null);
	const ids = selected.map((r) => r.id);
	const having = (slug: string) => selected.filter((r) => r.topics.includes(slug)).length;
	const topics = (data?.list ?? [])
		.filter((t) => (mode === 'remove' ? having(t.slug) > 0 : true))
		.filter((t) => !query.trim() || t.name.toLowerCase().includes(query.trim().toLowerCase()))
		.slice(0, 8);

	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
		const onDown = (e: MouseEvent) => {
			if (root.current && !root.current.contains(e.target as Node)) onClose();
		};
		window.addEventListener('keydown', onKey);
		document.addEventListener('mousedown', onDown);
		return () => {
			window.removeEventListener('keydown', onKey);
			document.removeEventListener('mousedown', onDown);
		};
	}, [onClose]);

	const apply = async (slug: string) => {
		const res = await change({ ids, topic: slug, action: mode });
		if ('error' in res) return notify(refusal(res.error, 'The topic was not changed. Try again.'));
		const r = res.data;
		const verb = mode === 'add' ? 'added to' : 'taken off';
		const rest = r.unchanged.length
			? `; the other ${r.unchanged.length} ${mode === 'add' ? 'had it already' : 'did not have it'}`
			: '';
		onDone({
			title: `${slug} ${verb} ${count(r.done.length, 'quote')}${rest}.${r.skipped.length ? ` ${r.skipped.length} skipped.` : ''}`,
			detail: skippedDetail(r),
			keep: r.skipped.map((s) => s.id),
			undo: r.done.length
				? async () => {
						await change({ ids: r.done, topic: slug, action: mode === 'add' ? 'remove' : 'add' });
					}
				: undefined
		});
	};

	return (
		<div
			ref={root}
			role="dialog"
			aria-label={mode === 'add' ? 'Add a topic' : 'Remove a topic'}
			className="absolute bottom-[calc(100%+8px)] left-[126px] flex w-[320px] flex-col rounded-field border border-border bg-card p-1.5 shadow-raised narrow:left-0 narrow:w-[calc(100vw-32px)]"
		>
			<p className="m-0 px-2 pt-1.5 pb-2 font-mono text-[12px] text-muted-foreground">
				{mode === 'add' ? 'Add a topic to' : 'Remove a topic from'} {count(ids.length, 'quote')}
			</p>
			<Input
				size="sm"
				autoFocus
				aria-label="Find a topic"
				placeholder="Find a topic"
				className="mx-1 mb-1.5 w-auto"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			<ul className="m-0 flex list-none flex-col p-0">
				{topics.map((t) => {
					const n = having(t.slug);
					return (
						<li key={t.slug}>
							<button
								type="button"
								disabled={isLoading}
								onClick={() => void apply(t.slug)}
								className="tap flex w-full cursor-pointer items-center justify-between gap-3 rounded-[6px] border-0 bg-transparent px-2.5 py-2 text-left font-sans text-[15px] text-foreground hover:bg-background focus-visible:bg-background"
							>
								{t.name}
								<span className="font-mono text-[12px] text-muted-foreground">
									{n === 0 ? 'none' : n === ids.length ? 'all have it' : `${n} of ${ids.length} have it`}
								</span>
							</button>
						</li>
					);
				})}
				{!topics.length ? (
					<li className="px-2.5 py-2 text-[14px] text-muted-foreground">
						{mode === 'remove' ? 'The selection has no topic by that name.' : 'No topic by that name.'}
					</li>
				) : null}
			</ul>
			<p className="m-0 mx-1 mt-1.5 border-t border-border px-1.5 pt-2 pb-0.5 text-[13px] text-muted-foreground">
				{mode === 'add'
					? 'Quotes that already have it are left as they are.'
					: 'A quote keeps its only topic: every quote needs one.'}
			</p>
		</div>
	);
}

type SheetAction = 'add' | 'remove' | 'export' | 'copy' | 'withdraw' | 'clear';

/** A phone's actions: a sheet from the foot of the screen. */
function ActionSheet({
	count: n,
	onClose,
	onPick
}: {
	count: number;
	onClose: () => void;
	onPick: (action: SheetAction) => void;
}) {
	const items: [SheetAction, string][] = [
		['add', 'Add a topic…'],
		['remove', 'Remove a topic…'],
		['export', 'Export CSV'],
		['copy', 'Copy ids'],
		['withdraw', 'Withdraw…']
	];
	return (
		<Dialog
			open
			onClose={onClose}
			title={`${n} selected`}
			className="narrow:-mx-8 narrow:-mb-8 narrow:max-w-none narrow:self-end narrow:rounded-b-none narrow:!w-screen"
		>
			<ul className="m-0 flex list-none flex-col p-0">
				{items.map(([action, label]) => (
					<li key={action} className="border-t border-border first:border-t-0">
						<button
							type="button"
							onClick={() => onPick(action)}
							className={cn(
								'tap w-full cursor-pointer border-0 bg-transparent px-2.5 py-[13px] text-left font-sans text-[16px]',
								action === 'withdraw' ? 'text-clay-700' : 'text-foreground'
							)}
						>
							{label}
						</button>
					</li>
				))}
			</ul>
			<Button variant="outline" className="mt-2 w-full" onClick={() => onPick('clear')}>
				Clear selection
			</Button>
		</Dialog>
	);
}
