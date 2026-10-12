// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { PRIVATE_PREFIXES } from '../src/lib/paths.ts';
import { MAX_URLS, collectUrls, robotsTxt, sitemapXml } from './sitemap.ts';

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

	it('lists the feeds, every topic, every public quote page by page, and the authors they credit', async () => {
		const asked: string[] = [];
		const pages: Record<string, unknown> = {
			'/v1/topics': { list: [{ slug: 'debugging' }, { slug: 'unix' }] },
			'/v1/quotes?feed=latest&limit=50': {
				list: [
					{ id: 'q_aaa111', publishedAt: '2026-09-01T00:00:00Z', author: { slug: 'knuth' } },
					{ id: 'q_bbb222', publishedAt: null, author: null }
				],
				nextCursor: 'c 2'
			},
			'/v1/quotes?feed=latest&limit=50&cursor=c%202': {
				list: [{ id: 'q_ccc333', publishedAt: '2026-08-01T00:00:00Z', author: { slug: 'knuth' } }],
				nextCursor: null
			}
		};
		const urls = await collectUrls(async <T>(path: string) => {
			asked.push(path);
			return pages[path] as T;
		}, SITE);
		expect(urls.map((u) => u.loc)).toEqual([
			`${SITE}/`,
			`${SITE}/discover`,
			`${SITE}/latest`,
			`${SITE}/curated`,
			`${SITE}/topics`,
			`${SITE}/topics/debugging`,
			`${SITE}/topics/unix`,
			`${SITE}/q/aaa111`,
			`${SITE}/q/bbb222`,
			`${SITE}/q/ccc333`,
			`${SITE}/authors/knuth`
		]);
		expect(urls.find((u) => u.loc.endsWith('aaa111'))?.lastmod).toBe('2026-09-01T00:00:00Z');
		expect(asked).toHaveLength(3);
	});
});
