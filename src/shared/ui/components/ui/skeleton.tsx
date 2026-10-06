import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * Placeholder block for loading states. Fill is `foreground/10` so it reads on both
 * white cards and the muted page background, and adapts to dark mode automatically.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-foreground/10', className)} {...props} />;
}

export { Skeleton };
