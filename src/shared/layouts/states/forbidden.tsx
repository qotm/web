import { Button, PageMeta } from '@/shared/ui';
import { StateScreen } from './state-screen';

/** 403 — authenticated but lacking the required role. */
export function Forbidden({ homeHref = '/' }: { homeHref?: string }) {
	return (
		<StateScreen code="403" title="Not authorized" description="You don't have permission to view this page.">
			<PageMeta title="Not authorized" robots="noindex" />
			<Button asChild variant="outline">
				<a href={homeHref}>Go back</a>
			</Button>
		</StateScreen>
	);
}
