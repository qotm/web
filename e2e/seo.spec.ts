import { E2E, expect, test } from './fixtures';

/**
 * QOT-96: what crawlers and link unfurlers get from the web image's server
 * (server/): the built app with each quote, author and topic page's tags
 * written in, the sitemap, and robots. Requests only: no browser runs the app.
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
		expect(body).toContain(`<meta property="og:image" content="${E2E.api}/v1/quotes/q_6f1k9s/og.png" />`);
		expect(body).toContain('<meta name="twitter:card" content="summary_large_image" />');
		// Still the app: its bundle loads from the shell.
		const script = /<script type="module" crossorigin src="([^"]+)"/.exec(body)?.[1];
		expect(script).toMatch(/^\/assets\//);
		const asset = await request.get(`${E2E.site}${script}`);
		expect(asset.status()).toBe(200);
		expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
	});

	test('the og:image the tags point at answers with a PNG', async ({ request }) => {
		const res = await request.get(`${E2E.api}/v1/quotes/q_6f1k9s/og.png`, { maxRedirects: 0 });
		expect([200, 302]).toContain(res.status());
		if (res.status() === 200) expect(res.headers()['content-type']).toContain('image/png');
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

	test('the sitemap lists the public quotes, topics and authors', async ({ request }) => {
		const res = await request.get(`${E2E.site}/sitemap.xml`);
		expect(res.headers()['content-type']).toContain('application/xml');
		const xml = await res.text();
		const latest = await (await request.get(`${E2E.api}/v1/quotes?feed=latest&limit=50`)).json();
		for (const q of latest.list) expect(xml).toContain(`<loc>${E2E.site}/q/${q.id.replace(/^q_/, '')}</loc>`);
		expect(xml).toContain(`<loc>${E2E.site}/topics/debugging</loc>`);
		const credited = latest.list.find((q: { author: { slug: string } | null }) => q.author)?.author.slug;
		expect(xml).toContain(`<loc>${E2E.site}/authors/${credited}</loc>`);
		expect(xml).not.toContain('/admin');
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
