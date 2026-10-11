import * as React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';

type MenuItem =
	| { heading: React.ReactNode }
	| { divider: true }
	| {
			id: string;
			label: React.ReactNode;
			/** Right-aligned mono hint: a count, a shortcut. */
			hint?: React.ReactNode;
			danger?: boolean;
			/** An in-app route; otherwise the item calls onSelect. */
			to?: string;
	  };

type MenuProps = {
	/** What opens it: an avatar, a ⋯ button. Rendered inside the toggle button. */
	trigger: React.ReactNode;
	/** The toggle's accessible name. */
	label: string;
	items: MenuItem[];
	onSelect?: (id: string) => void;
	align?: 'start' | 'end';
	defaultOpen?: boolean;
	className?: string;
};

const itemClasses =
	'flex justify-between gap-4 rounded-[6px] border-0 px-2.5 py-2 text-left font-sans text-[15px]/[1.6] text-foreground no-underline outline-none hover:bg-background focus-visible:bg-background';

/**
 * qotm_kit Menu: a panel of actions under a trigger, with headings, hints, a
 * divider and danger items. Arrow keys move between items; Escape, a pick or
 * a click outside closes it and returns focus to the trigger.
 */
function Menu({ trigger, label, items, onSelect, align = 'end', defaultOpen = false, className }: MenuProps) {
	const [open, setOpen] = React.useState(defaultOpen);
	const root = React.useRef<HTMLDivElement>(null);
	const toggle = React.useRef<HTMLButtonElement>(null);
	const panelId = React.useId();

	const close = React.useCallback((refocus: boolean) => {
		setOpen(false);
		if (refocus) toggle.current?.focus();
	}, []);

	React.useEffect(() => {
		if (!open) return;
		const onDown = (event: MouseEvent) => {
			if (root.current && !root.current.contains(event.target as Node)) close(false);
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close(true);
		};
		document.addEventListener('mousedown', onDown);
		window.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			window.removeEventListener('keydown', onKey);
		};
	}, [open, close]);

	const move = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const all = [...(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
		const at = all.indexOf(document.activeElement as HTMLElement);
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? all.length - 1
					: (at + (event.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length;
		all[next]?.focus();
	};

	return (
		<div ref={root} className={cn('relative inline-block', className)}>
			<button
				ref={toggle}
				type="button"
				aria-label={label}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={open ? panelId : undefined}
				onClick={() => setOpen(!open)}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown' && !open) {
						event.preventDefault();
						setOpen(true);
						requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
					}
				}}
				className="inline-flex cursor-pointer rounded-full border-0 bg-transparent p-0"
			>
				{trigger}
			</button>
			{open ? (
				<div
					id={panelId}
					role="menu"
					aria-label={label}
					onKeyDown={move}
					className={cn(
						'absolute top-[calc(100%+6px)] z-40 box-border flex min-w-[220px] flex-col rounded-field border border-border bg-card p-1.5 shadow-raised',
						align === 'end' ? 'right-0' : 'left-0'
					)}
				>
					{items.map((item, index) => {
						if ('divider' in item) return <div key={index} role="separator" className="mx-1 my-1.5 h-px bg-border" />;
						if ('heading' in item) {
							return (
								<div key={index} className="px-2.5 pt-2 pb-1 font-mono text-[13px]/[1.6] text-stone-600">
									{item.heading}
								</div>
							);
						}
						const content = (
							<>
								<span>{item.label}</span>
								{item.hint != null ? (
									<span className="font-mono text-[12px]/[1.6] text-stone-600">{item.hint}</span>
								) : null}
							</>
						);
						const classes = cn(itemClasses, item.danger && 'text-clay-700');
						const pick = () => {
							close(true);
							onSelect?.(item.id);
						};
						return item.to ? (
							<Link key={item.id} role="menuitem" to={item.to} className={classes} onClick={pick}>
								{content}
							</Link>
						) : (
							<button
								key={item.id}
								type="button"
								role="menuitem"
								className={cn(classes, 'cursor-pointer bg-transparent')}
								onClick={pick}
							>
								{content}
							</button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}

export { Menu };
export type { MenuItem, MenuProps };
