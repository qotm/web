import * as React from 'react';
import { cn, glyph } from '../../lib/utils';
import { controlClasses } from './field';

type Option = string | { value: string; label: React.ReactNode };

type SelectProps = Omit<React.ComponentProps<'select'>, 'size' | 'children'> & {
	options: Option[];
	size?: 'md' | 'sm';
};

/** qotm_kit Select: the native control styled like Input, with a mono ⌄ caret. */
function Select({ options, size, className, ...props }: SelectProps) {
	return (
		<span className={cn('relative flex', className)}>
			<select data-slot="select" className={cn(controlClasses(false, size), 'cursor-pointer pr-[38px]')} {...props}>
				{options.map((option) => {
					const { value, label } = typeof option === 'string' ? { value: option, label: option } : option;
					return (
						<option key={value} value={value}>
							{label}
						</option>
					);
				})}
			</select>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-[58%] font-mono text-[13px] text-muted-foreground"
			>
				{glyph('⌄')}
			</span>
		</span>
	);
}

export { Select };
export type { SelectProps };
