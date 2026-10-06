import type { ReactNode } from 'react';

type EmptyProps = {
	title: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
};

/** Inline empty state for lists/panels (a card, not a full page). */
export function Empty({ title, description, icon, action }: EmptyProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-10 text-center">
			{icon ? <div className="text-mute">{icon}</div> : null}
			<div className="flex flex-col gap-1">
				<p className="font-semibold text-foreground">{title}</p>
				{description ? <p className="text-sm text-mute">{description}</p> : null}
			</div>
			{action}
		</div>
	);
}
