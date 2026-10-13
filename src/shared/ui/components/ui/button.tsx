import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * qotm_kit Button. Ink (`solid`) by default; clay (`accent`) only for the one
 * signature action in a view ("Publish", "Submit for review"). `danger` is a
 * clay-700 outline, not red: qotm has no second hue. Hover changes colour
 * only; press nudges 1px. `asChild` renders a link styled as a button.
 */
const buttonVariants = cva(
	[
		'tap inline-flex items-center justify-center gap-2 whitespace-nowrap no-underline',
		'rounded-control border border-transparent font-display font-medium',
		'cursor-pointer transition-colors duration-[180ms] ease-[cubic-bezier(.2,0,.2,1)]',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
		'active:not-disabled:translate-y-px',
		'disabled:cursor-not-allowed disabled:text-stone-400'
	],
	{
		variants: {
			variant: {
				solid: 'bg-primary text-primary-foreground hover:bg-primary-active disabled:bg-border',
				accent:
					'bg-action-accent text-action-accent-foreground hover:bg-action-accent-hover active:bg-clay-700 disabled:bg-border',
				outline: 'bg-transparent text-foreground border-border hover:border-foreground disabled:border-border',
				quiet: 'bg-transparent text-muted-foreground hover:text-foreground',
				danger: 'bg-transparent text-clay-700 border-clay-200 hover:border-clay-700'
			},
			size: {
				sm: 'px-3.5 py-2 text-[13px]/[1.2]',
				md: 'px-4.5 py-2.5 text-[15px]/[1.2]',
				lg: 'px-5.5 py-3 text-[17px]/[1.2]'
			},
			/** Anything terminal-flavoured: `$ npm i -g qotm`, "load more". */
			mono: { true: 'font-mono font-normal tracking-[0.02em]', false: '' },
			pill: { true: 'rounded-pill', false: '' },
			block: { true: 'flex w-full', false: '' }
		},
		defaultVariants: { variant: 'solid', size: 'md', mono: false, pill: false, block: false }
	}
);

type ButtonProps = React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

function Button({ className, variant, size, mono, pill, block, asChild = false, type, ...props }: ButtonProps) {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			type={asChild ? undefined : (type ?? 'button')}
			className={cn(buttonVariants({ variant, size, mono, pill, block }), className)}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
export type { ButtonProps };
