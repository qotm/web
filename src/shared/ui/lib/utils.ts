import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge, taught the theme's own names (theme.css) so it never drops
 * one as a conflict it does not know: `text-meta` is a text style, not a
 * colour, so `cn('text-meta', 'text-muted-foreground')` keeps both.
 */
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: [
				'display',
				'h1',
				'h2',
				'h3',
				'quote',
				'quote-sm',
				'quote-card',
				'body',
				'ui',
				'ui-strong',
				'mono',
				'meta',
				'label'
			],
			radius: ['control', 'field', 'card', 'terminal', 'pill'],
			shadow: ['terminal', 'raised'],
			spacing: [
				'inline',
				'stack',
				'grid',
				'card-y',
				'card-x',
				'tile',
				'page',
				'section',
				'control',
				'control-sm',
				'sidebar',
				'header'
			],
			container: ['site', 'site-wide', 'measure']
		}
	}
});

/** Merge Tailwind class names, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * A symbol glyph with text presentation, never an emoji (the kit's `g()`):
 * ❯ ↗ ♡ ★ ⚑ ✓ render in the mono face, not as colour emoji.
 */
export const glyph = (char: string) => `${char}︎`;
