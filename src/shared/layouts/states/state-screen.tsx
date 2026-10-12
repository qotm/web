import type { ReactNode } from 'react';
import { cn } from '@/shared/ui';

type StateScreenProps = {
	code?: string;
	title: string;
	description?: string;
	children?: ReactNode;
	/** Inside a page (a list that failed to load) rather than the whole screen. */
	compact?: boolean;
};

/** A centred message for Forbidden / NotFound / errors, on the kit's type and tokens. */
export function StateScreen({ code, title, description, children, compact = false }: StateScreenProps) {
	return (
		<div
			role={compact ? 'alert' : undefined}
			className={cn(
				'flex w-full flex-col items-center justify-center gap-4 text-center',
				compact ? 'rounded-card border border-border bg-card px-card-x py-section' : 'min-h-screen bg-background p-6'
			)}
		>
			{code ? <div className="font-mono text-[13px] tracking-[0.14em] text-clay-600 uppercase">{code}</div> : null}
			<div className="flex flex-col items-center gap-1.5">
				<h1 className={cn('m-0', compact ? 'text-h3' : 'text-h2')}>{title}</h1>
				{description ? <p className="m-0 max-w-sm text-[15px] text-muted-foreground">{description}</p> : null}
			</div>
			{children ? <div className="flex items-center gap-3">{children}</div> : null}
		</div>
	);
}
