import * as React from 'react';
import { cn } from '../../lib/utils';

type ProgressProps = React.ComponentProps<'div'> & {
	/** 0-100. Values outside the range are clamped. */
	value: number;
	/** Accessible name, e.g. "Upload progress". */
	label?: string;
};

/** A determinate progress bar — pair with a percentage or byte count in text. */
function Progress({ value, label, className, ...props }: ProgressProps) {
	const percent = Math.min(100, Math.max(0, Math.round(value)));
	return (
		<div
			role="progressbar"
			aria-valuenow={percent}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={label}
			className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
			{...props}
		>
			<div
				className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

export { Progress };
export type { ProgressProps };
