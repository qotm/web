import type {
	AuthorEntity,
	ProfileEntity,
	QuoteCardEntity,
	QuoteEntity,
	TopicEntity
} from '../src/shared/types/api/types.gen.ts';
import { paths } from '../src/lib/paths.ts';
import { BRAND } from '../src/shared/ui/meta/brand.ts';
import { NOT_INDEXED } from '../src/shared/ui/meta/indexing.ts';
import { author as authorLd, breadcrumbs, quotation, website, type JsonLd } from './jsonld.ts';
import { PRIVACY, TERMS } from '../src/features/legal/documents.ts';
import { CLI_DOC } from '../src/features/cli/docs.ts';
import { authorBody, cliBody, feedBody, homeBody, legalBody, profileBody, quoteBody, topicBody } from './prerender.ts';

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
	image: { url: string; width: number; height: number; alt: string };
	noindex?: boolean;
	/** schema.org objects, one `<script type="application/ld+json">` each. */
	jsonLd?: JsonLd[];
	/** Plain HTML for `#root`, for crawlers that do not run the app; React replaces it. */
	body?: string;
};

/** What a page's tags are built from: this site's origin and its og:image routes. */
export type Site = { origin: string };

const SEPARATOR = ' · ';
const title = (segment: string) => `${segment}${SEPARATOR}${BRAND.name}`;
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
const n = (count: number) => count.toLocaleString('en-US');
const capital = (s: string) => `${s[0].toUpperCase()}${s.slice(1)}`;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** An og:image on this site's own origin; the web server streams it from the API. */
const card = (url: string, alt: string) => ({ url, width: 1200, height: 630, alt: clip(alt, 420) });
const siteCard = (site: Site) => card(`${site.origin}/og.png`, `${BRAND.name}: a thought between commands`);

/** The quote's credit: its author, or "@handle" for an original. */
export const creditOf = (q: Pick<QuoteEntity, 'type' | 'author' | 'attribution' | 'contributor'>) =>
	q.type === 'original'
		? q.contributor
			? `@${q.contributor.handle}`
			: 'a former member'
		: (q.author?.name ?? q.attribution ?? 'Unknown');

/** Which of a quote's cards its og:image is: the link's `?card=` (the Share dialog's choice). */
export type QuoteCard = 'quote' | 'terminal';

/** A quote's page: its words as the title, author and source in the description, its card as og:image. */
export function quoteTags(q: QuoteEntity, site: Site, variant: QuoteCard = 'quote'): PageTags {
	const name = creditOf(q);
	const original = q.type === 'original';
	const canonical = `${site.origin}${paths.quote(q.id)}`;
	return {
		title: title(q.text.length > 60 ? `${q.text.slice(0, 57)}…` : q.text),
		description: clip(
			original ? `“${q.text}” Declared original on qotm.` : `“${q.text}” — ${name}. Source and provenance on qotm.`,
			300
		),
		canonical,
		type: 'article',
		image: card(
			`${canonical}/og.png${variant === 'terminal' ? '?card=terminal' : ''}`,
			`“${q.text}”${original ? '' : ` — ${name}`}`
		),
		noindex: NOT_INDEXED.includes(q.status),
		jsonLd: [
			quotation(q, site.origin),
			breadcrumbs(site.origin, [
				...(q.author ? [{ name: q.author.name, path: paths.author(q.author.slug) }] : []),
				{ name: clip(q.text, 60), path: paths.quote(q.id) }
			])
		],
		body: quoteBody(q)
	};
}

/** An author's page, as `PageMeta` on /authors/:slug words it, with their first quotes. */
export function authorTags(a: AuthorEntity, quotes: QuoteCardEntity[], site: Site): PageTags {
	const line = a.line && a.line !== '—' ? ` (${a.line})` : '';
	const canonical = `${site.origin}${paths.author(a.slug)}`;
	return {
		title: title(a.name),
		description: `Quotes by ${a.name}${line}, each with its source, on qotm.`,
		canonical,
		type: 'profile',
		image: card(`${canonical}/og.png`, `${a.name}${line} on qotm`),
		jsonLd: [authorLd(a, site.origin), breadcrumbs(site.origin, [{ name: a.name, path: paths.author(a.slug) }])],
		body: authorBody(a, quotes)
	};
}

/** A topic's page, as `PageMeta` on /topics/:slug words it, with its first quotes. */
export function topicTags(t: TopicEntity, quotes: QuoteCardEntity[], site: Site): PageTags {
	const canonical = `${site.origin}${paths.topic(t.slug)}`;
	return {
		title: title(capital(t.name)),
		description: topicDescription(t),
		canonical,
		type: 'website',
		image: card(`${canonical}/og.png`, `${capital(t.name)}: quotes on qotm`),
		jsonLd: [
			breadcrumbs(site.origin, [
				{ name: 'Topics', path: paths.topics },
				{ name: capital(t.name), path: paths.topic(t.slug) }
			])
		],
		body: topicBody(t, quotes)
	};
}

/** The topic page's description (`topic.tsx` words it the same). */
export const topicDescription = (t: TopicEntity) =>
	`Quotes on ${t.name}, each with its source: ${n(t.counts.quotes)} on qotm, ${n(t.counts.curated)} in the CLI dataset.`;

/** A member's profile, as `PageMeta` on /@handle words it. */
export function profileTags(p: ProfileEntity, site: Site): PageTags {
	return {
		title: title(`${p.name || `@${p.handle}`} (@${p.handle})`),
		description: p.bio ?? `@${p.handle}’s quotes and contributions on qotm.`,
		canonical: `${site.origin}${paths.profile(p.handle)}`,
		type: 'profile',
		image: siteCard(site),
		body: profileBody(p)
	};
}

/** The pages that are not about one record: home, the feeds, the topic index, search, legal. */
const STATIC: Record<string, { title: string; exact?: boolean; description: string; noindex?: boolean }> = {
	[paths.home]: {
		title: 'qotm — a thought between commands',
		exact: true,
		description:
			'qotm prints one considered programming quote in your terminal. The community checks where every one of them came from.'
	},
	[paths.discover]: {
		title: 'Discover',
		description: 'A mix of verified quotes and community originals. Not personalized, not ranked by engagement.'
	},
	[paths.latest]: { title: 'Latest', description: 'Newly published quotes on qotm, newest first.' },
	[paths.curated]: {
		title: 'Curated',
		description: "The quotes in qotm's current dataset release: what every install shows."
	},
	[paths.topics]: {
		title: 'Topics',
		description: "The topics qotm's quotes are filed under, each with its own feed."
	},
	[paths.cli]: { title: CLI_DOC.title, description: CLI_DOC.description },
	[paths.search()]: { title: 'Search', description: 'Search qotm’s quotes, authors and topics.', noindex: true },
	[paths.terms]: { title: TERMS.title, description: TERMS.description },
	[paths.privacy]: { title: PRIVACY.title, description: PRIVACY.description }
};

export const STATIC_PATHS = Object.keys(STATIC);

const LEGAL: Record<string, typeof TERMS> = { [TERMS.path]: TERMS, [PRIVACY.path]: PRIVACY };

/**
 * A page that is not about one record. The home page and the feeds list
 * their first quotes for crawlers; the home page also carries the site's
 * WebSite and Organization data.
 */
export function staticTags(path: string, site: Site, quotes: QuoteCardEntity[] = []): PageTags | null {
	const page = STATIC[path];
	if (!page) return null;
	const home = path === paths.home;
	return {
		title: page.exact ? page.title : title(page.title),
		description: page.description,
		canonical: `${site.origin}${path === paths.home ? '' : path}`,
		type: 'website',
		image: siteCard(site),
		noindex: page.noindex,
		jsonLd: home ? website(site.origin) : undefined,
		body: home
			? homeBody(quotes)
			: path === paths.cli
				? cliBody(CLI_DOC)
				: LEGAL[path]
					? legalBody(LEGAL[path])
					: quotes.length
						? feedBody(page.title, page.description, quotes)
						: undefined
	};
}

/** The head tags for `tags`: canonical, Open Graph, Twitter card, robots and JSON-LD. */
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
		meta('property', 'og:image', tags.image.url),
		meta('property', 'og:image:secure_url', tags.image.url),
		meta('property', 'og:image:type', 'image/png'),
		meta('property', 'og:image:width', String(tags.image.width)),
		meta('property', 'og:image:height', String(tags.image.height)),
		meta('property', 'og:image:alt', tags.image.alt),
		meta('name', 'twitter:card', 'summary_large_image'),
		meta('name', 'twitter:title', tags.title),
		meta('name', 'twitter:description', tags.description),
		meta('name', 'twitter:image', tags.image.url),
		meta('name', 'twitter:image:alt', tags.image.alt)
	];
	if (tags.noindex) out.push(meta('name', 'robots', 'noindex'));
	for (const ld of tags.jsonLd ?? []) {
		// `<` escaped so no string in the data can close the script element.
		out.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
	}
	return out.join('\n\t\t');
}

/**
 * index.html with the page's title and description replaced, its other tags
 * added to the head and, when there is one, its crawlable HTML in `#root`
 * (`createRoot` replaces it when the app starts).
 */
export function inject(html: string, tags: PageTags): string {
	const out = html
		.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(tags.title)}</title>`)
		.replace(
			/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
			`<meta name="description" content="${escapeHtml(tags.description)}" />`
		)
		.replace('</head>', `\t${renderTags(tags)}\n\t</head>`);
	return tags.body ? out.replace('<div id="root"></div>', () => `<div id="root">${tags.body}</div>`) : out;
}

/** index.html marked noindex, for the account pages and the console. */
export const noindex = (html: string) =>
	html.replace('</head>', '\t<meta name="robots" content="noindex" />\n\t</head>');
