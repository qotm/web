import { PageMeta } from '@/shared/ui';

/** Topics: built in its own ticket; the route exists so the URL space is settled. */
export function TopicRoute() {
	return (
		<>
			<PageMeta title="Topics" />
			<h1 className="text-h1">Topics.</h1>
		</>
	);
}
