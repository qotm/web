import * as React from 'react';
import { cn, glyph } from '../../lib/utils';
import { Kbd } from './kbd';

type SearchFieldProps = Omit<React.ComponentProps<'input'>, 'size' | 'onSubmit'> & {
	/** Called with the query on Enter. */
	onSubmit?: (query: string) => void;
	/** The key that focuses the field from anywhere on the page; null for none. */
	shortcut?: string | null;
	size?: 'md' | 'sm';
};

/**
 * qotm_kit SearchField: a clay ❯ prompt, a mono input and the shortcut hint.
 * Pressing the shortcut ("/") anywhere outside a text field focuses it.
 */
function SearchField({
	onSubmit,
	shortcut = '/',
	size = 'md',
	placeholder = 'Search quotes, authors, topics',
	className,
	...props
}: SearchFieldProps) {
	const input = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		if (!shortcut) return;
		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
			if (event.key === shortcut && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
				event.preventDefault();
				input.current?.focus();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [shortcut]);

	return (
		<form
			role="search"
			className={cn(
				'box-border flex min-w-[220px] items-center gap-2.5 rounded-field border border-input bg-card pr-2.5 pl-3.5',
				'transition-colors duration-[180ms] hover:border-foreground',
				'focus-within:border-clay-500 focus-within:shadow-[0_0_0_1px_var(--color-clay-500)]',
				size === 'sm' ? 'min-h-8' : 'min-h-10',
				className
			)}
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit?.(input.current?.value.trim() ?? '');
			}}
		>
			<span aria-hidden="true" className="font-mono text-[13px] text-clay-600">
				{glyph('❯')}
			</span>
			<input
				ref={input}
				name="q"
				type="search"
				aria-label="Search"
				placeholder={placeholder}
				className="min-w-0 flex-1 border-0 bg-transparent py-2 font-mono text-[13px]/[normal] text-foreground outline-0 placeholder:text-stone-400 [&::-webkit-search-cancel-button]:hidden"
				{...props}
			/>
			{shortcut ? <Kbd>{shortcut}</Kbd> : null}
		</form>
	);
}

export { SearchField };
export type { SearchFieldProps };
