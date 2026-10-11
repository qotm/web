import * as React from 'react';
import { cn } from '../../lib/utils';

type EmptyStateProps = Omit<React.ComponentProps<'div'>, 'title'> & {
	/** The CLI command that would show this: `qotm favorites`. */
	command?: string;
	title?: React.ReactNode;
	action?: React.ReactNode;
};

/** qotm_kit EmptyState: the command, one plain sentence, one action, on a dashed hairline. */
function EmptyState({ command, title, action, className, children, ...props }: EmptyStateProps) {
	return (
		<div className={cn('rounded-card border border-dashed border-border px-8 py-12 text-center', className)} {...props}>
			{command ? (
				<code className="mb-3.5 inline-block font-mono text-[13px] text-stone-600">
					<span className="text-clay-600">~ &gt;</span> {command}
				</code>
			) : null}
			{title ? <h3 className="mt-0 mb-1.5 text-h3">{title}</h3> : null}
			{children ? <p className="mx-auto my-0 max-w-measure text-ui text-muted-foreground">{children}</p> : null}
			{action ? <div className="mt-4.5">{action}</div> : null}
		</div>
	);
}

export { EmptyState };
export type { EmptyStateProps };
