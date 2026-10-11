import { PageMeta } from '@/shared/ui';

/** Curated: built in its own ticket; the route exists so the URL space is settled. */
export function CuratedRoute() {
	return (
		<>
			<PageMeta title="Curated" />
			<h1 className="text-h1">Curated.</h1>
		</>
	);
}
