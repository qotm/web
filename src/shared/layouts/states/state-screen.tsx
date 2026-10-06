import type { ReactNode } from 'react';

type StateScreenProps = {
	code?: string;
	title: string;
	description?: string;
	children?: ReactNode;
};

/** Full-page centered message used by Forbidden / NotFound / error fallbacks. */
export function StateScreen({ code, title, description, children }: StateScreenProps) {
	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
			{code ? <div className="font-display text-6xl font-black text-primary">{code}</div> : null}
			<div className="flex flex-col gap-1.5">
				<h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
				{description ? <p className="max-w-sm text-mute">{description}</p> : null}
			</div>
			{children ? <div className="flex items-center gap-3">{children}</div> : null}
		</div>
	);
}
