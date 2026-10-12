import * as React from 'react';
import { cn } from '../../lib/utils';

type StatCardProps = {
	label: React.ReactNode;
	value: number | string;
	/** A change, in ink ("+81 since v2026.08.2"). */
	delta?: React.ReactNode;
	/** Context, muted ("oldest 6 days"). */
	note?: React.ReactNode;
	className?: string;
};

/** qotm_kit StatCard: one dashboard number with its label and a delta or note. */
function StatCard({ label, value, delta, note, className }: StatCardProps) {
	return (
		<div
			className={cn(
				'box-border flex flex-col gap-1.5 rounded-card border border-border bg-card px-card-x py-card-y',
				className
			)}
		>
			<div className="font-mono text-[12px]/[1.6] tracking-[0.14em] text-stone-600 uppercase">{label}</div>
			<div className="font-display text-[32px]/[1.1] font-semibold tracking-[-0.01em]">
				{typeof value === 'number' ? value.toLocaleString('en-US') : value}
			</div>
			{delta ? <div className="font-mono text-[13px]/[1.6] text-ink">{delta}</div> : null}
			{note ? <div className="font-mono text-[13px]/[1.6] text-muted-foreground">{note}</div> : null}
		</div>
	);
}

export { StatCard };
export type { StatCardProps };
