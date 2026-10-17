import { useState } from 'react';

const KEY = 'qotm.admin.autoNext';

/** Whether a decision opens the queue's next item: on unless this browser turned it off. */
export function useAutoNext() {
	const [on, setOn] = useState(() => {
		try {
			return localStorage.getItem(KEY) !== 'off';
		} catch {
			return true;
		}
	});
	const set = (next: boolean) => {
		setOn(next);
		try {
			localStorage.setItem(KEY, next ? 'on' : 'off');
		} catch {
			// Private windows may refuse storage; the choice then lasts the visit.
		}
	};
	return [on, set] as const;
}
