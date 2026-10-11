import type { ReactNode } from 'react';
import { Card } from '@/shared/ui';

type AuthCardProps = {
	title: string;
	description?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
};

/** The sign-in surface: a raised kit Card with a display heading. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
	return (
		<Card className="flex flex-col gap-5 p-tile">
			<div className="flex flex-col gap-2">
				<h1 className="m-0 text-h2">{title}</h1>
				{description ? <p className="m-0 text-ui text-muted-foreground">{description}</p> : null}
			</div>
			{children}
			{footer ? <p className="m-0 text-center text-ui text-muted-foreground">{footer}</p> : null}
		</Card>
	);
}
