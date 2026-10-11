import { PageMeta } from '@/shared/ui';

/** Submit a quote: built in its own ticket; the route exists so the URL space is settled. */
export function SubmitRoute() {
	return (
		<>
			<PageMeta title="Submit a quote" robots="noindex" />
			<h1 className="text-h1">Submit a quote.</h1>
		</>
	);
}
