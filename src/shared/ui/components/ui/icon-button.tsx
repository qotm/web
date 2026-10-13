import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, glyph as textGlyph } from '../../lib/utils';

/**
 * qotm_kit IconButton: a square action whose "icon" is a Unicode glyph in
 * JetBrains Mono (`❯` open, `↗` share, `⋯` more, `✕` close, `→` next). The
 * `label` is required: it is the accessible name and the tooltip.
 */
const iconButtonVariants = cva(
	[
		'tap inline-flex shrink-0 items-center justify-center p-0 font-mono leading-none',
		'rounded-control border border-border bg-transparent text-foreground',
		'cursor-pointer transition-colors duration-[180ms] ease-[cubic-bezier(.2,0,.2,1)]',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
		'aria-pressed:border-clay-200 aria-pressed:text-clay-600',
		'disabled:cursor-not-allowed disabled:border-border disabled:text-stone-400'
	],
	{
		variants: {
			variant: {
				outline: 'hover:border-foreground',
				ghost: 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
				solid: 'border-transparent bg-primary text-primary-foreground hover:bg-primary-active'
			},
			size: {
				sm: 'size-7 text-xs',
				md: 'size-9 text-[15px]',
				lg: 'size-11 text-lg'
			}
		},
		defaultVariants: { variant: 'outline', size: 'md' }
	}
);

type IconButtonProps = Omit<React.ComponentProps<'button'>, 'children'> &
	VariantProps<typeof iconButtonVariants> & {
		glyph: string;
		/** Required: the accessible name and the tooltip. */
		label: string;
		/** A toggle's state (favorited, liked…). */
		pressed?: boolean;
	};

function IconButton({ glyph, label, pressed, variant, size, className, type, ...props }: IconButtonProps) {
	return (
		<button
			type={type ?? 'button'}
			aria-label={label}
			title={label}
			aria-pressed={pressed}
			className={cn(iconButtonVariants({ variant, size }), className)}
			{...props}
		>
			<span aria-hidden="true">{textGlyph(glyph)}</span>
		</button>
	);
}

export { IconButton, iconButtonVariants };
export type { IconButtonProps };
