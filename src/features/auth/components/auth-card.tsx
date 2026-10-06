import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

type AuthCardProps = {
	title: string;
	description?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
};

/** Standard auth surface: white 24px card, 900-weight heading, optional footer. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-black">{title}</CardTitle>
				{description ? <CardDescription className="text-body">{description}</CardDescription> : null}
			</CardHeader>
			<CardContent>{children}</CardContent>
			{footer ? <p className="text-center text-sm text-body">{footer}</p> : null}
		</Card>
	);
}
