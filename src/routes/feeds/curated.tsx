import { CommandBlock, PageMeta } from '@/shared/ui';
import { FeedLayout } from '@/features/quotes/components/feed';
import { useCurrentReleaseQuery } from '@/features/quotes/api';

/** /curated (artboard Curated): what the current release ships to every install. */
export function CuratedRoute() {
	const { data: release, isLoading } = useCurrentReleaseQuery();
	const intro = isLoading
		? 'Every quote here ships in the current release.'
		: release
			? `Every quote here ships in the current release, ${release.version} · ${release.quotes.toLocaleString('en-US')} quotes.`
			: 'No release has been published yet. Curated quotes ship in the first one.';
	return (
		<>
			<PageMeta title="Curated" description="The quotes in qotm's current dataset release: what every install shows." />
			<FeedLayout
				feed="curated"
				eyebrow="In the CLI dataset"
				title="Curated."
				intro={intro}
				note={<CommandBlock caption="Get this release" command="qotm sync" />}
			/>
		</>
	);
}
