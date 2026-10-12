import type { QuoteFeedEntity, TopicListEntity } from '../src/shared/types/api/types.gen.ts';
import { PRIVATE_PREFIXES, paths } from '../src/lib/paths.ts';

/** The sitemap protocol's limit for one file. */
export const MAX_URLS = 50_000;
/** The API's largest feed page. */
const PAGE = 50;

export type SitemapUrl = { loc: string; lastmod?: string };

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function sitemapXml(urls: SitemapUrl[]): string {
	const body = urls
		.slice(0, MAX_URLS)
		.map(
			(u) => `\t<url><loc>${xml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`
		)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
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
 * Every public URL: the feeds, the topics, each public quote (newest first,
 * from the API's latest feed) and each author those quotes credit.
 */
export async function collectUrls(get: GetJson, site: string): Promise<SitemapUrl[]> {
	const urls: SitemapUrl[] = [paths.home, paths.discover, paths.latest, paths.curated, paths.topics].map((p) => ({
		loc: `${site}${p}`
	}));
	const topics = await get<TopicListEntity>('/v1/topics');
	for (const t of topics.list) urls.push({ loc: `${site}${paths.topic(t.slug)}` });

	const authors = new Set<string>();
	let cursor: string | null = null;
	do {
		const page: QuoteFeedEntity = await get<QuoteFeedEntity>(
			`/v1/quotes?feed=latest&limit=${PAGE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
		);
		for (const q of page.list) {
			urls.push({ loc: `${site}${paths.quote(q.id)}`, lastmod: q.publishedAt ?? undefined });
			if (q.author) authors.add(q.author.slug);
		}
		cursor = page.nextCursor;
	} while (cursor && urls.length + authors.size < MAX_URLS);

	for (const slug of authors) urls.push({ loc: `${site}${paths.author(slug)}` });
	return urls.slice(0, MAX_URLS);
}
