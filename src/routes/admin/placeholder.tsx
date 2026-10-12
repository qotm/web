import { PageMeta } from '@/shared/ui';

/**
 * A console page whose screen is still to be built (QOT-83 to QOT-92). The
 * route, its role gate and its sidebar entry are real; the page says so.
 */
export function AdminPlaceholderRoute({ title }: { title: string }) {
	return (
		<>
			<PageMeta title={title} robots="noindex" />
			<h1 className="m-0 text-h1">{title}.</h1>
			<p className="mt-2 text-[15px] text-muted-foreground">This page is not built yet.</p>
		</>
	);
}
