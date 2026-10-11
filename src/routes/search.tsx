import { PageMeta } from '@/shared/ui';

/** Search: built in its own ticket; the route exists so the URL space is settled. */
export function SearchRoute() {
	return (
		<>
			<PageMeta title="Search" />
			<h1 className="text-h1">Search.</h1>
		</>
	);
}
