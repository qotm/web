import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				primary: 'bg-primary text-primary-foreground hover:bg-primary-active',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
				outline: 'border border-foreground bg-transparent text-foreground hover:bg-secondary',
				ghost: 'bg-transparent text-foreground hover:bg-secondary',
				destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
				link: 'text-ink-deep underline-offset-4 hover:underline'
			},
			size: {
				sm: 'h-9 px-4 text-sm',
				md: 'h-11 px-5 text-base',
				lg: 'h-12 px-6 text-base',
				icon: 'size-11 rounded-full'
			}
		},
		defaultVariants: {
			variant: 'primary',
			size: 'md'
		}
	}
);

type ButtonProps = React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	};

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
	const Comp = asChild ? Slot : 'button';
	return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
export type { ButtonProps };
