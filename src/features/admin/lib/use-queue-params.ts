import { useSearchParams } from 'react-router';

/**
 * A review queue's page and selected item, kept in the URL (`?page=2&id=q_…`)
 * so a reload or a shared link opens the same item. Changing page clears the
 * selection; with none, `pick` selects the page's first item.
 */
export function useQueueParams() {
	const [params, setParams] = useSearchParams();
	const set = (next: Record<string, string | null>) =>
		setParams(
			(p) => {
				for (const [k, v] of Object.entries(next))
					if (v === null) p.delete(k);
					else p.set(k, v);
				return p;
			},
			{ replace: true }
		);
	return {
		page: Math.max(1, Number(params.get('page')) || 1),
		pick: <T extends { id: string }>(list: T[]) => list.find((q) => q.id === params.get('id')) ?? list[0],
		select: (id: string) => set({ id }),
		goTo: (page: number) => set({ page: String(page), id: null })
	};
}
