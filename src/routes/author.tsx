import { PageMeta } from '@/shared/ui';

/** Author: built in its own ticket; the route exists so the URL space is settled. */
export function AuthorRoute() {
	return (
		<>
			<PageMeta title="Author" />
			<h1 className="text-h1">Author.</h1>
		</>
	);
}
