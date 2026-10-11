import * as React from 'react';
import { cn, glyph } from '../../lib/utils';

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
	label: React.ReactNode;
	description?: React.ReactNode;
};

/**
 * qotm_kit Checkbox: a 20px box with a stone edge; checked, a clay fill with
 * a mono ✓. For explicit confirmations ("I wrote this quote…").
 */
function Checkbox({ label, description, className, ...props }: CheckboxProps) {
	return (
		<label
			className={cn(
				'relative inline-flex cursor-pointer items-start gap-3 text-[15px]/[1.4] text-foreground',
				className
			)}
		>
			<input type="checkbox" className="peer absolute m-0 size-px opacity-0" {...props} />
			<span
				aria-hidden="true"
				className={cn(
					'-mt-px box-border flex size-5 flex-none items-center justify-center rounded-[6px] border border-stone-400 bg-card font-mono text-xs text-transparent',
					'transition-colors duration-[180ms]',
					'peer-checked:border-clay-500 peer-checked:bg-clay-500 peer-checked:text-white',
					'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
					'peer-disabled:cursor-not-allowed peer-disabled:opacity-55'
				)}
			>
				{glyph('✓')}
			</span>
			<span className="flex flex-col gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-55">
				{label}
				{description ? <span className="text-meta leading-[1.4] text-muted-foreground">{description}</span> : null}
			</span>
		</label>
	);
}

export { Checkbox };
export type { CheckboxProps };
