import * as React from 'react';
import { cn } from '../../lib/utils';
import { controlClasses } from './field';

type TextareaProps = React.ComponentProps<'textarea'> & {
	/** The quote itself: display type at 20px (the submit form). */
	display?: boolean;
};

/** qotm_kit Textarea; FormTextarea adds the live count for a maxLength. */
function Textarea({ display, rows = 4, className, ...props }: TextareaProps) {
	return (
		<textarea
			data-slot="textarea"
			rows={rows}
			className={cn(
				controlClasses(),
				'resize-y text-[15px]/[1.6]',
				display && 'font-display text-[20px]/[1.35] font-medium tracking-[-0.01em]',
				className
			)}
			{...props}
		/>
	);
}

export { Textarea };
export type { TextareaProps };
