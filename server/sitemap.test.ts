// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { PRIVATE_PREFIXES } from '../src/lib/paths.ts';
import { MAX_URLS, collectUrls, robotsTxt, sitemapIndexXml, sitemapXml } from './sitemap.ts';

const SITE = 'https://qotm.site';

describe('sitemap and robots', () => {
	it('keeps every private route out, and points at the sitemap', () => {
		const robots = robotsTxt(SITE);
		for (const p of PRIVATE_PREFIXES) expect(robots).toContain(`Disallow: ${p}\n`);
		expect(robots).toContain('Sitemap: https://qotm.site/sitemap.xml');
		expect(robots).not.toMatch(/Disallow: \/\n/);
	});

	it('writes the sitemap protocol, escaped, with dates', () => {
		const xml = sitemapXml([
			{ loc: `${SITE}/search?q=a&b` },
			{ loc: `${SITE}/q/5k0q2j`, lastmod: '2026-09-24T09:30:00.000Z' }
		]);
		expect(xml).toMatch(
			/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/
		);
		expect(xml).toContain('<loc>https://qotm.site/search?q=a&amp;b</loc>');
		expect(xml).toContain('<url><loc>https://qotm.site/q/5k0q2j</loc><lastmod>2026-09-24</lastmod></url>');
		expect(
			sitemapXml(Array.from({ length: MAX_URLS + 5 }, (_, i) => ({ loc: `${SITE}/${i}` }))).match(/<url>/g)
		).toHaveLength(MAX_URLS);
	});

	it('splits the API’s indexable records into pages, quotes, authors and topics, with their dates', async () => {
		const asked: string[] = [];
		const urls = await collectUrls(async <T>(path: string) => {
			asked.push(path);
			return {
				quotes: [
					{ id: 'q_aaa111', updatedAt: '2026-09-01T10:00:00.000Z' },
					{ id: 'q_bbb222', updatedAt: '2026-10-02T10:00:00.000Z' }
				],
				authors: [{ slug: 'knuth', updatedAt: '2026-08-01T00:00:00.000Z' }],
				topics: [{ slug: 'debugging', updatedAt: '2026-07-01T00:00:00.000Z' }]
			} as T;
		}, SITE);
		expect(asked).toEqual(['/v1/sitemap']);
		expect(urls.pages.map((u) => u.loc)).toEqual([
			`${SITE}/`,
			`${SITE}/discover`,
			`${SITE}/latest`,
			`${SITE}/curated`,
			`${SITE}/topics`
		]);
		// The feeds changed when their newest quote did; the topic index when a topic did.
		expect(urls.pages[0].lastmod).toBe('2026-10-02T10:00:00.000Z');
		expect(urls.pages[4].lastmod).toBe('2026-07-01T00:00:00.000Z');
		expect(urls.quotes).toEqual([
			{ loc: `${SITE}/q/aaa111`, lastmod: '2026-09-01T10:00:00.000Z' },
			{ loc: `${SITE}/q/bbb222`, lastmod: '2026-10-02T10:00:00.000Z' }
		]);
		expect(urls.authors).toEqual([{ loc: `${SITE}/authors/knuth`, lastmod: '2026-08-01T00:00:00.000Z' }]);
		expect(urls.topics).toEqual([{ loc: `${SITE}/topics/debugging`, lastmod: '2026-07-01T00:00:00.000Z' }]);

		const index = sitemapIndexXml(SITE, urls);
		expect(index).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(index).toContain(
			'<sitemap><loc>https://qotm.site/sitemaps/quotes.xml</loc><lastmod>2026-10-02</lastmod></sitemap>'
		);
		expect(index.match(/<sitemap>/g)).toHaveLength(4);
	});
});
