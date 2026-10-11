import * as React from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * qotm_kit Link: clay-600 text over a 1px clay-200 underline that darkens to
 * clay-700 on hover. `quiet` is stone to ink with no underline (nav,
 * metadata); `mono` sets it in the meta size for URLs and commands.
 */
const textLinkVariants = cva(
	[
		'border-b no-underline transition-colors duration-[180ms] ease-[cubic-bezier(.2,0,.2,1)]',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
	],
	{
		variants: {
			variant: {
				default: 'border-clay-200 text-link hover:border-clay-700 hover:text-clay-700',
				quiet: 'border-transparent text-muted-foreground hover:text-foreground'
			},
			mono: { true: 'font-mono text-[13px]', false: '' }
		},
		defaultVariants: { variant: 'default', mono: false }
	}
);

type TextLinkProps = VariantProps<typeof textLinkVariants> &
	(
		| ({ to: RouterLinkProps['to'] } & Omit<RouterLinkProps, 'to'>)
		| ({ to?: undefined; href: string } & React.ComponentProps<'a'>)
	);

/** An in-app route (`to`) through React Router, or an outside URL (`href`). */
function TextLink({ variant, mono, className, ...props }: TextLinkProps) {
	const classes = cn(textLinkVariants({ variant, mono }), className);
	if (props.to !== undefined) return <RouterLink className={classes} {...(props as RouterLinkProps)} />;
	return <a className={classes} {...(props as React.ComponentProps<'a'>)} />;
}

export { TextLink, textLinkVariants };
export type { TextLinkProps };
