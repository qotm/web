import { E2E, expect, test } from './fixtures';

/**
 * What crawlers and link unfurlers get from the web image's server (server/):
 * the built app with each public page's tags, JSON-LD and plain HTML written
 * in, the og:images on the site's own origin, the sitemap, the RSS feeds and
 * robots. Requests only: no browser runs the app.
 */
test.describe('seo server', () => {
	const html = async (request: import('@playwright/test').APIRequestContext, path: string) => {
		const res = await request.get(`${E2E.site}${path}`);
		return { res, body: await res.text() };
	};

	test('a quote page carries its title, description, canonical URL and share image', async ({ request }) => {
		const quote = await (await request.get(`${E2E.api}/v1/quotes/q_6f1k9s`)).json();
		const { res, body } = await html(request, '/q/6f1k9s');
		expect(res.status()).toBe(200);
		const short = quote.text.length > 60 ? `${quote.text.slice(0, 57)}…` : quote.text;
		expect(body).toContain(`<title>${short} · qotm</title>`);
		expect(body).toContain(
			`<meta name="description" content="“${quote.text}” — ${quote.author.name}. Source and provenance on qotm." />`
		);
		expect(body).toContain(`<link rel="canonical" href="${E2E.site}/q/6f1k9s" />`);
		expect(body).toContain('<meta property="og:type" content="article" />');
		expect(body).toContain(`<meta property="og:image" content="${E2E.site}/q/6f1k9s/og.png" />`);
		expect(body).toContain('<meta name="twitter:card" content="summary_large_image" />');
		// schema.org data, and the quote itself for crawlers that do not run the app.
		const ld = [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
		expect(ld[0]).toMatchObject({ '@type': 'Quotation', text: quote.text, creator: { name: quote.author.name } });
		expect(ld[1]['@type']).toBe('BreadcrumbList');
		expect(body).toContain(`<a href="/authors/${quote.author.slug}">`);
		// Still the app: its bundle loads from the shell.
		const script = /<script type="module" crossorigin src="([^"]+)"/.exec(body)?.[1];
		expect(script).toMatch(/^\/assets\//);
		const asset = await request.get(`${E2E.site}${script}`);
		expect(asset.status()).toBe(200);
		expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
	});

	test('the og:image the tags point at is a PNG on the site, never the placeholder', async ({ request }) => {
		// The render if one exists, else (after the API's wait) a fallback card, uncached.
		const res = await request.get(`${E2E.site}/q/6f1k9s/og.png`, { timeout: 20_000 });
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toBe('image/png');
		expect(['no-store', 'public, max-age=86400, stale-while-revalidate=604800']).toContain(
			res.headers()['cache-control']
		);
		const png = await res.body();
		expect(png.subarray(1, 4).toString()).toBe('PNG');
		expect(png.readUInt32BE(16)).toBe(1200); // the card's size, not the placeholder's
		expect(png.readUInt32BE(20)).toBe(630);
	});

	test('a quote still under review is shareable but not indexed', async ({ request }) => {
		const review = await (await request.get(`${E2E.api}/v1/quotes?state=review&limit=1`)).json();
		test.skip(!review.list.length, 'the seed has no quote under review');
		const id = review.list[0].id.replace(/^q_/, '');
		const { res, body } = await html(request, `/q/${id}`);
		expect(res.status()).toBe(200);
		expect(res.headers()['x-robots-tag']).toBe('noindex');
		expect(body).toContain(`<meta property="og:image" content="${E2E.site}/q/${id}/og.png" />`);
	});

	test('home, feeds and profiles carry theirs, with the site card', async ({ request }) => {
		const home = await html(request, '/');
		expect(home.body).toContain('<title>qotm — a thought between commands</title>');
		expect(home.body).toContain(`<meta property="og:image" content="${E2E.site}/og.png" />`);
		expect(home.body).toContain('"@type":"WebSite"');
		expect((await html(request, '/latest')).body).toContain('<title>Latest · qotm</title>');
		expect((await html(request, '/@ada')).body).toContain('(@ada) · qotm</title>');
	});

	test('the RSS feed lists the latest quotes', async ({ request }) => {
		const res = await request.get(`${E2E.site}/feed.xml`);
		expect(res.headers()['content-type']).toBe('application/rss+xml; charset=utf-8');
		const xml = await res.text();
		const latest = await (await request.get(`${E2E.api}/v1/quotes?feed=latest&limit=5`)).json();
		for (const q of latest.list) expect(xml).toContain(`<link>${E2E.site}/q/${q.id.replace(/^q_/, '')}</link>`);
	});

	test('an id with its q_ prefix redirects', async ({ request }) => {
		const res = await request.get(`${E2E.site}/q/q_6f1k9s`, { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers().location).toBe('/q/6f1k9s');
	});

	test('author and topic pages carry theirs', async ({ request }) => {
		expect((await html(request, '/authors/knuth')).body).toContain('<title>Donald E. Knuth · qotm</title>');
		const topic = await html(request, '/topics/debugging');
		expect(topic.body).toContain('<title>Debugging · qotm</title>');
		expect(topic.body).toContain(`<link rel="canonical" href="${E2E.site}/topics/debugging" />`);
	});

	test('a page the API does not have is a 404', async ({ request }) => {
		const { res, body } = await html(request, '/q/zzzzzz');
		expect(res.status()).toBe(404);
		expect(res.headers()['x-robots-tag']).toBe('noindex');
		expect(body).toContain('<div id="root"></div>');
	});

	test('the sitemap lists the indexable quotes, topics and authors, by part', async ({ request }) => {
		const res = await request.get(`${E2E.site}/sitemap.xml`);
		expect(res.headers()['content-type']).toContain('application/xml');
		const index = await res.text();
		for (const part of ['pages', 'quotes', 'authors', 'topics'])
			expect(index).toContain(`<loc>${E2E.site}/sitemaps/${part}.xml</loc>`);
		const data = await (await request.get(`${E2E.api}/v1/sitemap`)).json();
		const quotes = await (await request.get(`${E2E.site}/sitemaps/quotes.xml`)).text();
		for (const q of data.quotes) expect(quotes).toContain(`<loc>${E2E.site}/q/${q.id.replace(/^q_/, '')}</loc>`);
		const authors = await (await request.get(`${E2E.site}/sitemaps/authors.xml`)).text();
		expect(authors).toContain(`<loc>${E2E.site}/authors/${data.authors[0].slug}</loc>`);
		const topics = await (await request.get(`${E2E.site}/sitemaps/topics.xml`)).text();
		expect(topics).toContain(`<loc>${E2E.site}/topics/debugging</loc>`);
		expect(index + quotes + authors + topics).not.toContain('/admin');
	});

	test('account and admin routes are not indexed', async ({ request }) => {
		const robots = await (await request.get(`${E2E.site}/robots.txt`)).text();
		for (const p of ['/admin', '/settings', '/my-quotes', '/favorites', '/submit', '/login', '/device'])
			expect(robots).toContain(`Disallow: ${p}`);
		expect(robots).toContain(`Sitemap: ${E2E.site}/sitemap.xml`);
		for (const p of ['/admin/users', '/settings']) {
			const { res, body } = await html(request, p);
			expect(res.headers()['x-robots-tag']).toBe('noindex');
			expect(body).toContain('<meta name="robots" content="noindex" />');
		}
		expect((await request.get(`${E2E.site}/discover`)).headers()['x-robots-tag']).toBeUndefined();
	});
});
