import { Link } from 'react-router';
import { Button, PageMeta } from '@/shared/ui';
import { StateScreen } from './state-screen';

/** 404 — no matching route. */
export function NotFound({ homeHref = '/' }: { homeHref?: string }) {
	return (
		<StateScreen
			code="404"
			title="No page here."
			description="The link may be old, or the address mistyped. The quotes are still where they were."
		>
			{/* All four apps route here, so the title comes from the shared layer.
			    `noindex` because a 404 body served at an arbitrary URL should never
			    be listed — the landing app is public and does get crawled. */}
			<PageMeta title="Page not found" robots="noindex" />
			<div className="flex flex-wrap justify-center gap-3">
				<Button asChild>
					<Link to={homeHref}>Go home</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/discover">Discover quotes</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/search">Search</Link>
				</Button>
			</div>
		</StateScreen>
	);
}
