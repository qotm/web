import { useState } from 'react';
import { useSearchParams } from 'react-router';

/**
 * A review queue's page and selected item, kept in the URL (`?page=2&id=q_…`)
 * so a reload or a shared link opens the same item. Changing page clears the
 * selection; with none, `pick` selects the page's first item. `opened` says
 * an item was chosen (a phone shows it full screen instead of the list). A
 * link to an item without a page (`?id=q_…`) asks the API for the page that
 * holds it, so it opens in place even when it is not on the first.
 */
export function useQueueParams() {
	const [params, setParams] = useSearchParams();
	const [focus] = useState(() => (params.has('page') ? null : params.get('id')));
	const set = (next: Record<string, string | null>, replace = true) =>
		setParams(
			(p) => {
				for (const [k, v] of Object.entries(next))
					if (v === null) p.delete(k);
					else p.set(k, v);
				return p;
			},
			{ replace }
		);
	const page = Math.max(1, Number(params.get('page')) || 1);
	return {
		page,
		query: (limit: number) => ({ page, limit, ...(focus && !params.has('page') ? { focus } : {}) }),
		opened: params.has('id'),
		pick: <T extends { id: string }>(list: T[]) => list.find((q) => q.id === params.get('id')) ?? list[0],
		/** Opening one from the list is a step back can undo; moving between items is not. */
		select: (id: string, { push = false } = {}) => set({ id }, !push),
		close: () => set({ id: null }),
		goTo: (page: number) => set({ page: String(page), id: null })
	};
}
