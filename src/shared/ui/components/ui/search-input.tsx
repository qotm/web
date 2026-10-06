import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * `text-base` below `sm` is load-bearing, not a style preference.
 *
 * iOS auto-zooms a focused text input whose computed font-size is under 16px,
 * and it never restores the zoom on blur — so one tap leaves the user zoomed in
 * for the rest of the session, in the installed PWA too. `text-sm` is 14px.
 * 14px from `sm` up keeps the intended desktop density, where nothing auto-zooms.
 *
 * Never drop the `text-base` half, and never "fix" a zoom by adding
 * `maximum-scale`/`user-scalable=no` to the viewport — that disables pinch-zoom
 * and fails WCAG 2.1 SC 1.4.4.
 */
const NO_IOS_ZOOM = 'text-base sm:text-sm';

/**
 * Bare input for a search field. Renders only the input, so callers keep their
 * own wrapper and icon placement (the market search needs a container ref for its
 * results dropdown, and the shapes differ — pill vs card).
 *
 * Pass shape, padding and tone through `className`.
 */
function SearchInput({ className, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			data-slot="search-input"
			className={cn(
				'w-full text-foreground outline-none placeholder:text-mute',
				'focus-visible:ring-2 focus-visible:ring-ring',
				NO_IOS_ZOOM,
				className
			)}
			{...props}
		/>
	);
}

/**
 * The filter row at the top of a combobox dropdown panel: leading icon, a
 * transparent auto-focused input, and a hairline under both.
 *
 * Defaults `aria-label` to the placeholder — a placeholder is not a label.
 */
function ComboboxFilter({ className, placeholder, 'aria-label': ariaLabel, ...props }: React.ComponentProps<'input'>) {
	return (
		<div className="flex items-center gap-2 border-b border-border px-3 py-2">
			<Search aria-hidden="true" className="size-4 shrink-0 text-mute" />
			<input
				// The panel only exists because the user just opened it to type, so
				// focus belongs here.
				autoFocus
				aria-label={ariaLabel ?? placeholder}
				placeholder={placeholder}
				data-slot="combobox-filter"
				className={cn(
					'w-full bg-transparent text-foreground outline-none placeholder:text-mute',
					NO_IOS_ZOOM,
					className
				)}
				{...props}
			/>
		</div>
	);
}

export { SearchInput, ComboboxFilter };
