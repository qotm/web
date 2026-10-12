import { PageMeta, Notice } from '@/shared/ui';
import { FeedLayout } from '@/features/quotes/components/feed';

/** /discover (artboard Discover): a mix, the same order for everyone each day. */
export function DiscoverRoute() {
	return (
		<>
			<PageMeta
				title="Discover"
				description="A mix of verified quotes and community originals. Not personalized, not ranked by engagement."
			/>
			<FeedLayout
				feed="discover"
				eyebrow="Community"
				title="Discover."
				intro="A mix of verified quotes and community originals. Not personalized, not ranked by engagement."
				note={<Notice tone="dark">Curated quotes reach every install on the next qotm sync.</Notice>}
			/>
		</>
	);
}
