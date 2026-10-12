import * as React from 'react';
import { cn, glyph } from '../../lib/utils';

type QuoteAction = 'like' | 'favorite' | 'recommend' | 'share' | 'report';
type Counts = { likes?: number; favorites?: number; recommends?: number };
type ActionState = { liked?: boolean; favorited?: boolean; recommended?: boolean };

type Toggle = { word: string; glyphs: [string, string]; count: keyof Counts; on: keyof ActionState; meaning: string };
type Plain = { word: string; glyphs: [string, string]; meaning: string };

/** Each action's word, its glyph off and on, and (for the toggles) its count and state. */
const ACTIONS: Record<QuoteAction, Toggle | Plain> = {
	like: { word: 'like', glyphs: ['♡', '♥'], count: 'likes', on: 'liked', meaning: 'I enjoyed this quote' },
	favorite: {
		word: 'favorite',
		glyphs: ['☆', '★'],
		count: 'favorites',
		on: 'favorited',
		meaning: 'Save to my library'
	},
	recommend: {
		word: 'recommend',
		glyphs: ['↑', '↑'],
		count: 'recommends',
		on: 'recommended',
		meaning: 'Consider for the default collection'
	},
	share: { word: 'share', glyphs: ['↗', '↗'], meaning: 'share' },
	report: { word: 'report', glyphs: ['⚑', '⚑'], meaning: 'report' }
};

const isToggle = (a: Toggle | Plain): a is Toggle => 'on' in a;

type ActionBarProps = {
	actions?: QuoteAction[];
	counts?: Counts;
	state?: ActionState;
	/**
	 * Called with the action and, for a toggle, whether it is now on. The bar
	 * flips the toggle and its count straight away; new `state` / `counts`
	 * props (the server's answer, or a rollback) replace them.
	 */
	onAction?: (action: QuoteAction, on?: boolean) => void;
	/** `sm` (cards): glyph and count. `md` (the quote page): with words and borders. */
	size?: 'sm' | 'md';
	onDark?: boolean;
	className?: string;
};

/** qotm_kit ActionBar: like, favorite and recommend as toggle buttons with counts, then share and report. */
function ActionBar({
	actions = ['like', 'favorite', 'recommend', 'share', 'report'],
	counts = {},
	state = {},
	onAction,
	size = 'md',
	onDark = false,
	className
}: ActionBarProps) {
	const [local, setLocal] = React.useState(state);
	const [n, setN] = React.useState(counts);
	// A new answer from the parent (or a rollback) wins over the optimistic flip.
	const key = JSON.stringify([state, counts]);
	const [synced, setSynced] = React.useState(key);
	if (synced !== key) {
		setSynced(key);
		setLocal(state);
		setN(counts);
	}

	const act = (a: QuoteAction) => {
		const d = ACTIONS[a];
		if (!isToggle(d)) return onAction?.(a);
		const next = !local[d.on];
		setLocal({ ...local, [d.on]: next });
		const c = n[d.count];
		if (c != null) setN({ ...n, [d.count]: c + (next ? 1 : -1) });
		onAction?.(a, next);
	};

	const md = size === 'md';
	return (
		<div role="group" aria-label="Quote actions" className={cn('flex flex-wrap items-center gap-1.5', className)}>
			{actions.map((a) => {
				const d = ACTIONS[a];
				const toggle = isToggle(d);
				const on = toggle ? !!local[d.on] : false;
				const c = toggle ? n[d.count] : undefined;
				return (
					<button
						key={a}
						type="button"
						aria-pressed={toggle ? on : undefined}
						aria-label={d.word + (c != null ? `, ${c}` : '')}
						title={d.meaning}
						onClick={() => act(a)}
						className={cn(
							'inline-flex cursor-pointer items-center gap-1.5 rounded-control border border-transparent bg-transparent font-mono text-[13px]/none transition-colors duration-[180ms]',
							md ? 'border-border px-3 py-[9px]' : 'px-2.5 py-[7px]',
							onDark
								? 'text-stone-400 hover:border-dark-rule hover:text-dark-foreground'
								: cn('text-stone-600 hover:text-ink', md ? 'hover:border-ink' : 'hover:border-border'),
							on && 'text-clay-700 [&>[data-glyph]]:text-clay-600',
							on && md && 'border-clay-200 bg-clay-100',
							a === 'report' && md && 'ml-auto'
						)}
					>
						<span aria-hidden="true" data-glyph className="text-[14px]">
							{glyph(d.glyphs[on ? 1 : 0])}
						</span>
						{md ? <span>{on && toggle ? d.on : d.word}</span> : null}
						{c != null ? <span className="text-stone-600">{c.toLocaleString('en-US')}</span> : null}
					</button>
				);
			})}
		</div>
	);
}

export { ActionBar };
export type { ActionBarProps, QuoteAction };
