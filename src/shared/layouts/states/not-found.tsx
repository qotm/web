import { Button, PageMeta } from '@/shared/ui';
import { StateScreen } from './state-screen';

/** 404 — no matching route. */
export function NotFound({ homeHref = '/' }: { homeHref?: string }) {
	return (
		<StateScreen
			code="404"
			title="Page not found"
			description="The page you're looking for doesn't exist or has moved."
		>
			{/* All four apps route here, so the title comes from the shared layer.
			    `noindex` because a 404 body served at an arbitrary URL should never
			    be listed — the landing app is public and does get crawled. */}
			<PageMeta title="Page not found" robots="noindex" />
			<Button asChild>
				<a href={homeHref}>Go home</a>
			</Button>
		</StateScreen>
	);
}
