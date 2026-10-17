import * as React from 'react';

export type Nav = {
	/** "2 of 14". */
	position: string;
	prev: string | null;
	next: string | null;
	go: (id: string) => void;
	close: () => void;
	/** After a decision: open the next item, when the reviewer wants that. */
	advance: () => void;
	autoNext: boolean;
	setAutoNext: (on: boolean) => void;
	/** The open item: when it changes, the pane scrolls back to its top. */
	selectedId?: string;
};

export const QueueNav = React.createContext<Nav | null>(null);

/** The queue's navigation, for the selected item's pane and decision. */
export function useQueueNav() {
	const nav = React.useContext(QueueNav);
	if (!nav) throw new Error('useQueueNav needs a ReviewQueue around it');
	return nav;
}
