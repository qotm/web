import * as React from 'react';
import { cn } from '../../lib/utils';

type SwitchProps = Omit<React.ComponentProps<'input'>, 'type' | 'role'> & {
	label: React.ReactNode;
	description?: React.ReactNode;
};

/**
 * qotm_kit Switch: a pill track with a stone knob; on, a clay track and a
 * white knob. For settings, never for publishing.
 */
function Switch({ label, description, className, ...props }: SwitchProps) {
	return (
		<label
			className={cn(
				'relative inline-flex cursor-pointer items-start gap-3 text-[15px]/[1.4] text-foreground',
				className
			)}
		>
			<input type="checkbox" role="switch" className="peer absolute m-0 size-px opacity-0" {...props} />
			<span
				aria-hidden="true"
				className={cn(
					'group/track box-border flex h-[22px] w-10 flex-none items-center rounded-pill border border-stone-400 bg-card p-0.5',
					'transition-colors duration-[180ms]',
					'peer-checked:border-clay-500 peer-checked:bg-clay-500',
					'peer-checked:[&>span]:translate-x-4 peer-checked:[&>span]:bg-white',
					'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
					'peer-disabled:cursor-not-allowed peer-disabled:opacity-55'
				)}
			>
				<span className="size-4 rounded-[50%] bg-stone-400 transition-[transform,background-color] duration-[180ms] ease-[cubic-bezier(.2,0,.2,1)]" />
			</span>
			<span className="flex flex-col gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-55">
				{label}
				{description ? <span className="text-meta leading-[1.4] text-muted-foreground">{description}</span> : null}
			</span>
		</label>
	);
}

export { Switch };
export type { SwitchProps };
