import { PageMeta } from '@/shared/ui';

/** Latest: built in its own ticket; the route exists so the URL space is settled. */
export function LatestRoute() {
	return (
		<>
			<PageMeta title="Latest" />
			<h1 className="text-h1">Latest.</h1>
		</>
	);
}
