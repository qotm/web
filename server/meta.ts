import type { AuthorEntity, QuoteEntity, TopicEntity } from '../src/shared/types/api/types.gen.ts';
import { paths } from '../src/lib/paths.ts';
import { BRAND } from '../src/shared/ui/meta/brand.ts';

/**
 * The tags a crawler needs for one page: crawlers and link unfurlers do not
 * run the SPA, so the server writes these into index.html before sending it.
 * The words match what `PageMeta` sets once the app runs.
 */
export type PageTags = {
	title: string;
	description: string;
	/** Absolute URL. */
	canonical: string;
	type: 'website' | 'article' | 'profile';
	image?: { url: string; width: number; height: number; alt: string };
	noindex?: boolean;
};

const SEPARATOR = ' · ';
const title = (segment: string) => `${segment}${SEPARATOR}${BRAND.name}`;
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** A quote's page: its words as the title, author and source in the description, the share card as og:image. */
export function quoteTags(q: QuoteEntity, site: string, publicApi: string): PageTags {
	const name = q.author?.name ?? q.attribution ?? 'Unknown';
	const original = q.type === 'original';
	return {
		title: title(q.text.length > 60 ? `${q.text.slice(0, 57)}…` : q.text),
		description: clip(
			original ? `“${q.text}” Declared original on qotm.` : `“${q.text}” — ${name}. Source and provenance on qotm.`,
			300
		),
		canonical: `${site}${paths.quote(q.id)}`,
		type: 'article',
		image: {
			url: `${publicApi}/v1/quotes/${q.id}/og.png`,
			width: 1200,
			height: 630,
			alt: clip(`“${q.text}”${original ? '' : ` — ${name}`}`, 420)
		},
		noindex: q.status === 'WITHDRAWN'
	};
}

/** An author's page, as `PageMeta` on /authors/:slug words it. */
export function authorTags(a: AuthorEntity, site: string): PageTags {
	const line = a.line && a.line !== '—' ? ` (${a.line})` : '';
	return {
		title: title(a.name),
		description: `Quotes by ${a.name}${line}, each with its source, on qotm.`,
		canonical: `${site}${paths.author(a.slug)}`,
		type: 'profile'
	};
}

/** A topic's page. */
export function topicTags(t: TopicEntity, site: string): PageTags {
	const name = `${t.name[0].toUpperCase()}${t.name.slice(1)}`;
	return {
		title: title(name),
		description:
			t.description ??
			`Programming quotes about ${t.name} on qotm: ${t.counts.quotes} quotes, ${t.counts.curated} curated.`,
		canonical: `${site}${paths.topic(t.slug)}`,
		type: 'website'
	};
}

/** The head tags for `tags`, Open Graph and Twitter cards included. */
export function renderTags(tags: PageTags): string {
	const meta = (attr: 'name' | 'property', key: string, value: string) =>
		`<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
	const out = [
		`<link rel="canonical" href="${escapeHtml(tags.canonical)}" />`,
		meta('property', 'og:site_name', BRAND.name),
		meta('property', 'og:type', tags.type),
		meta('property', 'og:title', tags.title),
		meta('property', 'og:description', tags.description),
		meta('property', 'og:url', tags.canonical),
		meta('name', 'twitter:card', tags.image ? 'summary_large_image' : 'summary'),
		meta('name', 'twitter:title', tags.title),
		meta('name', 'twitter:description', tags.description)
	];
	if (tags.image)
		out.push(
			meta('property', 'og:image', tags.image.url),
			meta('property', 'og:image:width', String(tags.image.width)),
			meta('property', 'og:image:height', String(tags.image.height)),
			meta('property', 'og:image:alt', tags.image.alt),
			meta('name', 'twitter:image', tags.image.url),
			meta('name', 'twitter:image:alt', tags.image.alt)
		);
	if (tags.noindex) out.push(meta('name', 'robots', 'noindex'));
	return out.join('\n\t\t');
}

/** index.html with the page's title and description replaced and its other tags added to the head. */
export function inject(html: string, tags: PageTags): string {
	return html
		.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(tags.title)}</title>`)
		.replace(
			/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
			`<meta name="description" content="${escapeHtml(tags.description)}" />`
		)
		.replace('</head>', `\t${renderTags(tags)}\n\t</head>`);
}

/** index.html marked noindex, for the account pages and the console. */
export const noindex = (html: string) =>
	html.replace('</head>', '\t<meta name="robots" content="noindex" />\n\t</head>');
