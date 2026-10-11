import * as React from 'react';
import { cn } from '../../lib/utils';
import { CopyStatus } from './copy-status';
import { copyHint, useCopy } from './use-copy';

type CommandBlockProps = Omit<React.ComponentProps<'div'>, 'children'> & {
	command: string;
	/** A mono uppercase line above the command. */
	caption?: React.ReactNode;
	glyph?: string;
	tone?: 'dark' | 'light';
};

/** qotm_kit CommandBlock: one command to run, with a copy button. */
function CommandBlock({ command, caption, glyph = '$', tone = 'dark', className, ...props }: CommandBlockProps) {
	const [state, copy] = useCopy(command);
	const dark = tone === 'dark';
	return (
		<div
			className={cn(
				'rounded-field font-mono text-[15px]',
				dark ? 'bg-dark text-dark-foreground' : 'border border-border bg-card text-foreground',
				className
			)}
			{...props}
		>
			{caption ? (
				<div
					className={cn(
						'px-4 pt-3 text-[12px] tracking-[0.14em] uppercase',
						dark ? 'text-stone-400' : 'text-stone-600'
					)}
				>
					{caption}
				</div>
			) : null}
			<div className="flex items-center justify-between gap-3 py-3 pr-3 pl-4">
				<code className="overflow-x-auto text-[length:inherit] whitespace-nowrap">
					<span aria-hidden="true" className={dark ? 'text-clay-400' : 'text-clay-600'}>
						{glyph}
					</span>{' '}
					{command}
				</code>
				<button
					type="button"
					onClick={copy}
					aria-label={`Copy ${command}`}
					className={cn(
						'flex-none cursor-pointer rounded-control border bg-transparent px-2.5 py-1 font-mono text-[13px]/[1.6] transition-colors duration-[180ms]',
						dark
							? 'border-dark-rule text-stone-400 hover:border-stone-600 hover:text-dark-foreground'
							: 'border-border text-stone-600 hover:border-foreground hover:text-foreground'
					)}
				>
					{copyHint(state)}
				</button>
				<CopyStatus state={state} text={command} />
			</div>
		</div>
	);
}

export { CommandBlock };
export type { CommandBlockProps };
