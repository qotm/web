import { cn, glyph } from '../../lib/utils';
import { statusInfo } from '../ui/status-badge';
import { TRACKS, type Lifecycle, type Status } from './lifecycle';

type LifecycleStepsProps = Lifecycle & {
	orientation?: 'horizontal' | 'vertical';
	className?: string;
};

/** qotm_kit LifecycleSteps: done steps ticked in ink, the current one ringed in clay, an outcome marked off the track. */
function LifecycleSteps({
	track = 'canonical',
	current,
	outcome,
	dates = {},
	orientation = 'horizontal',
	className
}: LifecycleStepsProps) {
	const steps: readonly Status[] = TRACKS[track];
	const at = Math.max(0, steps.indexOf(current));
	const horizontal = orientation === 'horizontal';
	return (
		<ol
			aria-label="Lifecycle"
			className={cn('m-0 flex list-none p-0 font-mono text-[12px]', !horizontal && 'flex-col', className)}
		>
			{steps.map((s, i) => {
				const state = i < at ? 'done' : i === at ? (outcome ? 'off' : 'current') : 'todo';
				const last = i === steps.length - 1;
				return (
					<li
						key={s}
						data-state={state}
						aria-current={i === at ? 'step' : undefined}
						className={cn(
							'relative',
							horizontal ? 'flex min-w-0 flex-1 flex-col gap-2.5' : 'flex gap-stack pb-grid',
							!last && "before:absolute before:bg-border before:content-['']",
							!last &&
								(horizontal
									? 'before:top-[9px] before:right-0 before:left-5 before:h-px'
									: 'before:top-5 before:bottom-0 before:left-[9px] before:w-px'),
							state === 'done' && 'before:bg-ink'
						)}
					>
						<span
							aria-hidden="true"
							className={cn(
								'relative z-[1] box-border flex size-5 flex-none items-center justify-center rounded-[50%] border text-[11px]',
								state === 'todo' && 'border-stone-400 bg-background',
								state === 'done' && 'border-ink bg-ink text-paper',
								state === 'current' &&
									"border-2 border-clay-500 bg-card after:size-1.5 after:rounded-[50%] after:bg-clay-500 after:content-['']",
								state === 'off' && 'border-clay-600 bg-clay-100 text-clay-700'
							)}
						>
							{state === 'done' ? glyph('✓') : state === 'off' && outcome ? glyph(statusInfo(outcome).glyph) : ''}
						</span>
						<span className="flex flex-col gap-0.5 pr-2">
							<span
								className={cn(
									'leading-[1.4] tracking-[0.1em] uppercase',
									state === 'todo' ? 'text-stone-600' : 'text-ink'
								)}
							>
								{statusInfo(s).label}
							</span>
							{state === 'off' && outcome ? (
								<span className="tracking-[0.1em] text-clay-700 uppercase">{statusInfo(outcome).label}</span>
							) : null}
							{dates[s] ? <span className="text-stone-600">{dates[s]}</span> : null}
						</span>
					</li>
				);
			})}
		</ol>
	);
}

export { LifecycleSteps };
export type { LifecycleStepsProps };
