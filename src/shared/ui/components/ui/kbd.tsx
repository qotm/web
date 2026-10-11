import * as React from 'react';
import { cn } from '../../lib/utils';

/** qotm_kit Kbd: an inline key or command chip, `/` or `qotm open`. */
function Kbd({ onDark = false, className, ...props }: React.ComponentProps<'kbd'> & { onDark?: boolean }) {
	return (
		<kbd
			className={cn(
				'inline-block rounded-[6px] border px-1.5 font-mono text-xs leading-[18px]',
				onDark ? 'border-dark-rule bg-transparent text-dark-muted' : 'border-border bg-card text-muted-foreground',
				className
			)}
			{...props}
		/>
	);
}

export { Kbd };
