import * as React from 'react';
import { cn } from '../../lib/utils';

type TerminalProps = React.ComponentProps<'div'> & {
	/** The bar's title (a path, like `~/projects`). */
	title?: string;
	/** The brand's one real shadow; off for terminals inside other surfaces. */
	shadow?: boolean;
	bodyClassName?: string;
};

/** qotm_kit Terminal: an ink window with three dots, a title and a mono body. */
function Terminal({ title, shadow = true, className, bodyClassName, children, ...props }: TerminalProps) {
	return (
		<div className={cn('overflow-hidden rounded-terminal bg-dark', shadow && 'shadow-terminal', className)} {...props}>
			<div
				aria-hidden={title ? undefined : true}
				className="flex items-center gap-2 border-b border-dark-rule px-grid py-4"
			>
				{[0, 1, 2].map((i) => (
					<i key={i} className="block size-[11px] rounded-[50%] bg-stone-600" />
				))}
				{title ? <span className="ml-3 font-mono text-[13px]/[1.6] text-stone-400">{title}</span> : null}
			</div>
			<div
				className={cn('px-card-x pt-tile pb-[30px] font-mono text-[15px]/[1.5] text-dark-foreground', bodyClassName)}
			>
				{children}
			</div>
		</div>
	);
}

/** qotm_kit Prompt: the clay `~ >` before a command. Decorative. */
function Prompt({ children = '~ >', className }: { children?: React.ReactNode; className?: string }) {
	return (
		<span aria-hidden="true" className={cn('text-dark-accent', className)}>
			{children}
		</span>
	);
}

/** qotm_kit Cursor: the blinking block; it holds still under reduced motion. */
function Cursor({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				'ml-[3px] inline-block h-[1.05em] w-[11px] animate-blink bg-dark-accent align-[-2px] motion-reduce:animate-none',
				className
			)}
			{...props}
		/>
	);
}

export { Terminal, Prompt, Cursor };
export type { TerminalProps };
