import type { ReactNode } from 'react';
import { EmptyState } from '@/shared/ui';

type EmptyProps = {
	title: string;
	description?: ReactNode;
	/** The CLI command that would show this list, when there is one. */
	command?: string;
	action?: ReactNode;
};

/** Inline empty state for lists and panels: the kit's EmptyState. */
export function Empty({ title, description, command, action }: EmptyProps) {
	return (
		<EmptyState command={command} title={title} action={action}>
			{description}
		</EmptyState>
	);
}
