import * as React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';

type TabItem = {
	id: string;
	label: React.ReactNode;
	count?: React.ReactNode;
	/** Renders the tab as a link (a route's own tabs); otherwise a button calling `onSelect`. */
	to?: string;
};

type TabsProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
	items: TabItem[];
	active?: string;
	onSelect?: (id: string) => void;
	/** On ink. */
	dark?: boolean;
	/** Names the tab list for assistive tech. */
	label?: string;
};

/** Left and right arrows, Home and End move focus along the tabs. */
function moveFocus(e: React.KeyboardEvent<HTMLDivElement>) {
	const tabs = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')];
	const i = tabs.indexOf(document.activeElement as HTMLElement);
	if (i < 0) return;
	const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
	if (next === undefined) return;
	e.preventDefault();
	tabs[(next + tabs.length) % tabs.length].focus();
}

/** qotm_kit Tabs: mono labels with optional counts, the active one underlined in clay. */
function Tabs({ items, active, onSelect, dark = false, label, className, ...props }: TabsProps) {
	return (
		<div
			role="tablist"
			aria-label={label}
			onKeyDown={moveFocus}
			className={cn(
				'flex gap-tile overflow-x-auto border-b border-border [scrollbar-width:none]',
				// Narrow: a row that runs past the edge fades out, so it reads as more to scroll to.
				'narrow:pr-8 narrow:[mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]',
				dark && 'border-dark-rule',
				className
			)}
			{...props}
		>
			{items.map((it) => {
				const on = active === it.id;
				const classes = cn(
					'-mb-px inline-flex items-baseline gap-2 border-0 border-b border-transparent bg-transparent px-0 pt-0 pb-3 whitespace-nowrap no-underline pointer-coarse:pt-3',
					'cursor-pointer font-mono text-[13px]/[1.6] tracking-[0.02em] transition-colors duration-[180ms]',
					// As in the kit: a button tab keeps the UA's normal line height, a link inherits 1.6.
					!it.to && 'leading-[normal]',
					dark
						? 'text-stone-400 hover:text-dark-foreground aria-selected:border-dark-accent aria-selected:text-dark-foreground'
						: 'text-muted-foreground hover:text-foreground aria-selected:border-clay-500 aria-selected:text-foreground'
				);
				const inner = (
					<>
						{it.label}
						{it.count != null ? <span className="text-[12px] text-stone-600">{it.count}</span> : null}
					</>
				);
				return it.to ? (
					<Link
						key={it.id}
						to={it.to}
						role="tab"
						aria-selected={on}
						aria-current={on ? 'page' : undefined}
						className={classes}
					>
						{inner}
					</Link>
				) : (
					<button
						key={it.id}
						type="button"
						role="tab"
						aria-selected={on}
						className={classes}
						onClick={() => onSelect?.(it.id)}
					>
						{inner}
					</button>
				);
			})}
		</div>
	);
}

export { Tabs };
export type { TabsProps, TabItem };
