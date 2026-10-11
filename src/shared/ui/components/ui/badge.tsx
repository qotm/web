import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
	'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-transparent px-2.5 py-[3px] font-mono text-[12px]/[1.5] tracking-[0.02em]',
	{
		variants: {
			tone: {
				neutral: 'border-border text-stone-600',
				clay: 'bg-clay-100 text-clay-700',
				ink: 'bg-ink text-paper',
				dark: 'border-ink-rule text-clay-400'
			},
			uppercase: { true: 'uppercase tracking-[0.14em]', false: '' }
		},
		defaultVariants: { tone: 'neutral', uppercase: false }
	}
);

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

/** qotm_kit Badge: a small mono label (release version, licence, "new"). `dark` sits on ink. */
function Badge({ tone, uppercase, className, ...props }: BadgeProps) {
	return <span className={cn(badgeVariants({ tone, uppercase }), className)} {...props} />;
}

export { Badge, badgeVariants };
export type { BadgeProps };
