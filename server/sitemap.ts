import type { SitemapEntity } from '../src/shared/types/api/types.gen.ts';
import { PRIVATE_PREFIXES, paths } from '../src/lib/paths.ts';
import { CLI_DOC } from '../src/features/cli/docs.ts';

/** The sitemap protocol's limit for one file. */
export const MAX_URLS = 50_000;

export type SitemapUrl = { loc: string; lastmod?: string };

/** The sitemap's parts, each its own file under /sitemaps/. */
export const SITEMAP_PARTS = ['pages', 'quotes', 'authors', 'topics'] as const;
export type SitemapPart = (typeof SITEMAP_PARTS)[number];

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const day = (iso?: string) => (iso ? iso.slice(0, 10) : undefined);
const latest = (dates: (string | undefined)[]) => dates.filter(Boolean).sort().at(-1);

export function sitemapXml(urls: SitemapUrl[]): string {
	const body = urls
		.slice(0, MAX_URLS)
		.map((u) => `\t<url><loc>${xml(u.loc)}</loc>${u.lastmod ? `<lastmod>${day(u.lastmod)}</lastmod>` : ''}</url>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** /sitemap.xml: an index of the parts, each with its newest lastmod. */
export function sitemapIndexXml(site: string, parts: Record<SitemapPart, SitemapUrl[]>): string {
	const body = SITEMAP_PARTS.map((p) => {
		const lastmod = day(latest(parts[p].map((u) => u.lastmod)));
		return `\t<sitemap><loc>${xml(`${site}/sitemaps/${p}.xml`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</sitemap>`;
	}).join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

/** Everything public may be crawled; the account pages and the console may not. */
export function robotsTxt(site: string): string {
	return [
		'# The community pages are public; account pages and the console are not.',
		'User-agent: *',
		...PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`),
		'',
		`Sitemap: ${site}/sitemap.xml`,
		''
	].join('\n');
}

type GetJson = <T>(path: string) => Promise<T>;

/**
 * Every indexable URL, by part, from the API's /v1/sitemap: the feeds and
 * the topic index; each quote that is checked and not disputed; the authors
 * and topics those quotes are under. lastmod is the record's updatedAt.
 */
export async function collectUrls(get: GetJson, site: string): Promise<Record<SitemapPart, SitemapUrl[]>> {
	const data = await get<SitemapEntity>('/v1/sitemap');
	const newest = latest(data.quotes.map((q) => q.updatedAt));
	return {
		pages: [
			...[paths.home, paths.discover, paths.latest, paths.curated, paths.topics].map((p) => ({
				loc: `${site}${p === paths.home ? '/' : p}`,
				lastmod: p === paths.topics ? latest(data.topics.map((t) => t.updatedAt)) : newest
			})),
			{ loc: `${site}${paths.cli}`, lastmod: `${CLI_DOC.updated}T00:00:00.000Z` }
		],
		quotes: data.quotes.map((q) => ({ loc: `${site}${paths.quote(q.id)}`, lastmod: q.updatedAt })),
		authors: data.authors.map((a) => ({ loc: `${site}${paths.author(a.slug)}`, lastmod: a.updatedAt })),
		topics: data.topics.map((t) => ({ loc: `${site}${paths.topic(t.slug)}`, lastmod: t.updatedAt }))
	};
}
