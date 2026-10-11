import { PageMeta } from '@/shared/ui';

/** Discover: built in its own ticket; the route exists so the URL space is settled. */
export function DiscoverRoute() {
	return (
		<>
			<PageMeta title="Discover" />
			<h1 className="text-h1">Discover.</h1>
		</>
	);
}
