import * as React from 'react';
import { cn } from '../../lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'flex h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 py-2 text-base text-foreground transition-colors',
				'placeholder:text-mute selection:bg-primary selection:text-primary-foreground',
				'outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring',
				'aria-invalid:border-negative aria-invalid:focus-visible:ring-negative/30',
				'disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
