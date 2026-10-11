import { PageMeta } from '@/shared/ui';

/** Favorites: built in its own ticket; the route exists so the URL space is settled. */
export function FavoritesRoute() {
	return (
		<>
			<PageMeta title="Favorites" robots="noindex" />
			<h1 className="text-h1">Favorites.</h1>
		</>
	);
}
