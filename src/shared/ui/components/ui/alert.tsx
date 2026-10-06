import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva('flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium', {
	variants: {
		variant: {
			default: 'border-border bg-secondary text-foreground',
			destructive: 'border-negative/30 bg-negative/10 text-negative',
			success: 'border-primary/40 bg-accent text-accent-foreground'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

type AlertProps = React.ComponentProps<'div'> & VariantProps<typeof alertVariants>;

function Alert({ className, variant, role = 'alert', ...props }: AlertProps) {
	return <div role={role} className={cn(alertVariants({ variant }), className)} {...props} />;
}

export { Alert, alertVariants };
export type { AlertProps };
