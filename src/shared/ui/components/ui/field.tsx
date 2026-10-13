import * as React from 'react';
import { cn, glyph } from '../../lib/utils';

type FieldProps = Omit<React.ComponentProps<'div'>, 'children'> & {
	label?: React.ReactNode;
	hint?: React.ReactNode;
	error?: React.ReactNode;
	required?: boolean;
	optional?: boolean;
	/** A live count on the label's right, e.g. "42 / 280" or "2 / 3". */
	count?: React.ReactNode;
	htmlFor?: string;
	children: React.ReactNode;
};

/**
 * qotm_kit Field: a mono uppercase label (with "required" / "optional"), the
 * control, then a hint or a clay-700 error. Wraps any control.
 */
function Field({ label, hint, error, required, optional, count, htmlFor, className, children, ...props }: FieldProps) {
	return (
		<div className={cn('flex min-w-0 flex-col gap-2', className)} {...props}>
			{label ? (
				<label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-label leading-[1.6] text-muted-foreground">
					{label}
					{required ? <span className="tracking-[0.02em] normal-case text-clay-600">required</span> : null}
					{optional ? <span className="tracking-[0.02em] normal-case text-stone-600">optional</span> : null}
					{count != null ? <span className="ml-auto tracking-[0.02em]">{count}</span> : null}
				</label>
			) : null}
			{children}
			{error ? (
				<span role="alert" className="text-meta leading-[1.6] text-clay-700">
					{glyph('×')} {error}
				</span>
			) : hint ? (
				<span className="text-meta leading-[1.6] text-muted-foreground">{hint}</span>
			) : null}
		</div>
	);
}

/**
 * The control look shared by Input, Textarea and Select: white, the --input
 * edge (3:1, QOT-11), radius 12, a clay border and 1px clay ring on focus.
 */
const controlClasses = (mono?: boolean, size: 'md' | 'sm' = 'md') =>
	cn(
		'box-border w-full appearance-none rounded-field border border-input bg-card text-foreground outline-none',
		'font-sans transition-colors duration-[180ms] ease-[cubic-bezier(.2,0,.2,1)]',
		'placeholder:text-stone-400 hover:border-foreground',
		'focus:border-clay-500 focus:shadow-[0_0_0_1px_var(--color-clay-500)]',
		'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400',
		'aria-invalid:border-clay-600',
		size === 'sm' ? 'min-h-8 px-3 py-[5px] text-[13px]/[1.4]' : 'min-h-10 px-3.5 py-[9px] text-[15px]/[1.4]',
		// Touch: a 44px target, and 16px text so iOS Safari does not zoom into the field.
		'pointer-coarse:min-h-11 pointer-coarse:text-[16px]',
		mono && 'font-mono'
	);

export { Field, controlClasses };
export type { FieldProps };
