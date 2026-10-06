import { formatTitle } from './meta-context';
import { useMetaConfig } from './use-meta-config';

export type PageMetaProps = {
	/**
	 * Page segment, not the whole title — the app's suffix is appended by
	 * `MetaProvider`. Pass `exact` to opt out.
	 */
	title?: string;
	/** Use `title` verbatim, without the app suffix. */
	exact?: boolean;
	/** Overrides the base description from `index.html` while mounted. */
	description?: string;
	/** e.g. `noindex, nofollow` for the private apps. */
	robots?: string;
	/** Absolute URL. */
	canonical?: string;
};

/**
 * Per-route document metadata. Render it anywhere inside a route — React 19
 * hoists `<title>`, `<meta>` and `<link>` into `<head>` natively, so there is no
 * head-management dependency and no effect involved.
 *
 * **Being effect-free is the point**: it is what makes the tags appear in
 * server-rendered output, which an effect-based `document.title` hook can never
 * do. Do not "optimise" this into a `useEffect`.
 *
 * Omit a field to inherit it: a route with no `description` keeps the base one
 * from `index.html`, and React removes the tag again on unmount.
 *
 * ## Nesting
 *
 * Client-side, the innermost render wins for free — React claims the first
 * existing `<title>` (so the static one from `index.html` is overwritten), and
 * for any subsequent one it does `head.insertBefore(new, existing)`. Later
 * renders therefore land *earlier* in `<head>`, and `document.title` is defined
 * as the first `<title>` in tree order.
 *
 * ## Server-side rendering — read before wiring a prerender
 *
 * Order inverts on the server. `react-dom/server` emits tags in render order,
 * so a document renders as:
 *
 * ```html
 * <head><title>base from index.html</title><title>Route · Brand</title></head>
 * ```
 *
 * and the **base** title wins, because it comes first. React does not
 * deduplicate `<title>` or `<meta>` (only stylesheets get resource dedupe), so
 * a prerender step MUST post-process the emitted HTML: keep the **last**
 * `<title>` and the **last** `<meta name="description">`, dropping earlier
 * duplicates. Without that, every prerendered page ships the base title and
 * hydration silently corrects it — invisible in a browser, wrong for crawlers.
 * Tracked on MAI-88.
 */
export function PageMeta({ title, exact, description, robots, canonical }: PageMetaProps) {
	const config = useMetaConfig();
	const resolved = title === undefined ? undefined : exact ? title : formatTitle(title, config);

	return (
		<>
			{resolved === undefined ? null : <title>{resolved}</title>}
			{description === undefined ? null : <meta name="description" content={description} />}
			{robots === undefined ? null : <meta name="robots" content={robots} />}
			{canonical === undefined ? null : <link rel="canonical" href={canonical} />}
		</>
	);
}
