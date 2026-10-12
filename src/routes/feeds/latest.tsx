import { Notice, PageMeta } from '@/shared/ui';
import { FeedLayout } from '@/features/quotes/components/feed';

/** /latest (artboard Latest): newly published, newest first. */
export function LatestRoute() {
	return (
		<>
			<PageMeta title="Latest" description="Newly published quotes on qotm, newest first." />
			<FeedLayout
				feed="latest"
				eyebrow="Community"
				title="Latest."
				intro="Newly published quotes, newest first."
				note={
					<Notice title="Published isn’t shipped.">
						A quote here is public on the web. It reaches the CLI only after curation.
					</Notice>
				}
			/>
		</>
	);
}
