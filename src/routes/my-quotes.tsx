import { PageMeta } from '@/shared/ui';

/** My quotes: built in its own ticket; the route exists so the URL space is settled. */
export function MyQuotesRoute() {
	return (
		<>
			<PageMeta title="My quotes" robots="noindex" />
			<h1 className="text-h1">My quotes.</h1>
		</>
	);
}
