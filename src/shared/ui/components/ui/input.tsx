import * as React from 'react';
import { cn } from '../../lib/utils';
import { controlClasses } from './field';

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
	/** Commands, handles, URLs, ids. */
	mono?: boolean;
	size?: 'md' | 'sm';
};

/** qotm_kit Input (the control; wrap it in Field for a label). */
function Input({ mono, size, className, ...props }: InputProps) {
	return <input data-slot="input" className={cn(controlClasses(mono, size), className)} {...props} />;
}

export { Input };
export type { InputProps };
