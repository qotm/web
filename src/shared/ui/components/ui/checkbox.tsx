import * as React from 'react';
import { cn } from '../../lib/utils';

/** Native checkbox tinted with the brand accent (matches the Wise auth design). */
function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type="checkbox"
			data-slot="checkbox"
			className={cn('size-4 shrink-0 cursor-pointer rounded accent-primary', className)}
			{...props}
		/>
	);
}

export { Checkbox };
