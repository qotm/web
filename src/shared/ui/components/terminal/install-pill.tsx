import { cn } from '../../lib/utils';
import { CopyStatus } from './copy-status';
import { copyHint, useCopy } from './use-copy';

type InstallPillProps = {
	command?: string;
	glyph?: string;
	/** A button that copies the command, with a "copy" hint. */
	copyable?: boolean;
	onDark?: boolean;
	className?: string;
};

/** qotm_kit InstallPill: `$ npm i -g qotm` in a hairline pill, optionally copyable. */
function InstallPill({
	command = 'npm i -g qotm',
	glyph = '$',
	copyable = false,
	onDark = false,
	className
}: InstallPillProps) {
	const [state, copy] = useCopy(command);
	const classes = cn(
		'inline-flex items-center gap-2 rounded-pill border bg-transparent px-grid py-2.5 font-mono text-[15px]/[1.5] transition-colors duration-[180ms]',
		onDark ? 'border-dark-rule text-dark-foreground' : 'border-border text-foreground',
		copyable && 'cursor-pointer',
		copyable && (onDark ? 'hover:border-dark-muted' : 'hover:border-foreground'),
		className
	);
	const inner = (
		<>
			<span aria-hidden="true" className={onDark ? 'text-dark-accent' : 'text-clay-600'}>
				{glyph}
			</span>
			<span>{command}</span>
		</>
	);
	if (!copyable) return <span className={classes}>{inner}</span>;
	return (
		<>
			<button type="button" className={classes} onClick={copy} aria-label={`Copy ${command}`}>
				{inner}
				<span
					aria-hidden="true"
					className={cn('ml-2 text-[13px]', onDark ? 'text-stone-400' : 'text-muted-foreground')}
				>
					{copyHint(state)}
				</span>
			</button>
			<CopyStatus state={state} text={command} />
		</>
	);
}

export { InstallPill };
export type { InstallPillProps };
