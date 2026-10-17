// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, request, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHandler } from './app.ts';
import type { HttpGet, HttpGetBytes } from './http-get.ts';

const INDEX = `<!doctype html><html><head><meta name="description" content="base" /><title>qotm</title></head><body><div id="root"></div></body></html>`;

const API: Record<string, unknown> = {
	'/v1/quotes/q_5k0q2j': {
		id: 'q_5k0q2j',
		text: 'Premature optimization is the root of all evil.',
		type: 'canonical',
		status: 'CURATED',
		author: { slug: 'knuth', name: 'Donald E. Knuth' },
		attribution: null,
		contributor: null,
		work: null,
		year: null,
		context: null,
		sourceUrl: null,
		source: null,
		topics: [],
		publishedAt: '2026-09-24T09:30:00.000Z'
	},
	'/v1/quotes/q_rev1ew': {
		id: 'q_rev1ew',
		text: 'Still being checked.',
		type: 'canonical',
		status: 'UNDER_REVIEW',
		author: null,
		attribution: 'Someone',
		contributor: null,
		topics: [],
		publishedAt: null
	},
	'/v1/authors/knuth': { slug: 'knuth', name: 'Donald E. Knuth', line: '1938–', topics: [], wikidataId: 'Q17457' },
	'/v1/quotes?author=knuth&limit=20': {
		list: [
			{
				id: 'q_5k0q2j',
				text: 'Premature optimization is the root of all evil.',
				type: 'canonical',
				author: { slug: 'knuth', name: 'Donald E. Knuth' },
				topics: []
			}
		],
		nextCursor: null
	},
	'/v1/users/ada': { handle: 'ada', name: 'Ada', bio: 'Reads Knuth.' },
	'/v1/topics/debugging': {
		slug: 'debugging',
		name: 'debugging',
		description: null,
		counts: { quotes: 3, curated: 1 }
	},
	'/v1/topics': { list: [{ slug: 'debugging', name: 'debugging', counts: { quotes: 3, curated: 1 } }] },
	'/v1/quotes?feed=latest&limit=50': {
		list: [
			{
				id: 'q_5k0q2j',
				text: 'Premature optimization is the root of all evil.',
				type: 'canonical',
				author: { slug: 'knuth', name: 'Donald E. Knuth' },
				work: null,
				year: null,
				topics: [{ slug: 'debugging', name: 'debugging' }],
				publishedAt: '2026-09-24T09:30:00.000Z'
			}
		],
		nextCursor: null
	},
	'/v1/sitemap': {
		quotes: [{ id: 'q_5k0q2j', updatedAt: '2026-09-24T09:30:00.000Z' }],
		authors: [{ slug: 'knuth', updatedAt: '2026-09-01T00:00:00.000Z' }],
		topics: [{ slug: 'debugging', updatedAt: '2026-08-01T00:00:00.000Z' }]
	}
};

const RENDER = Buffer.from('rendered png');
const FALLBACK = Buffer.from('fallback png');
const TERMINAL = Buffer.from('terminal png');
/** The API's og:image routes, and the bucket a render redirects to. */
const IMAGES: Record<string, { status: number; headers: Record<string, string>; body: Buffer }> = {
	'http://api.internal/v1/quotes/q_5k0q2j/og.png': {
		status: 302,
		headers: { 'x-og-image': 'render', location: 'https://media.example/og/q.png' },
		body: Buffer.alloc(0)
	},
	'https://media.example/og/q.png': { status: 200, headers: {}, body: RENDER },
	// The API sends the bytes itself (no redirect) since it reads the bucket with its own credentials.
	'http://api.internal/v1/quotes/q_5k0q2j/og.png?variant=terminal': {
		status: 200,
		headers: { 'x-og-image': 'render' },
		body: TERMINAL
	},
	'http://api.internal/v1/og.png': { status: 200, headers: { 'x-og-image': 'fallback' }, body: FALLBACK }
};

let base: string;
let server: Server;
let calls = 0;
let down = false;
/** The headers each request went out with, by URL. */
const sent = new Map<string, Record<string, string> | undefined>();

beforeAll(async () => {
	const dist = mkdtempSync(join(tmpdir(), 'qotm-dist-'));
	writeFileSync(join(dist, 'index.html'), INDEX);
	mkdirSync(join(dist, 'assets'));
	writeFileSync(join(dist, 'assets', 'index-abc123.js'), `console.log(${JSON.stringify('x'.repeat(4000))});`);
	writeFileSync(join(dist, 'favicon.ico'), 'ico');
	writeFileSync(join(dist, '.env'), 'SECRET=1');
	const get: HttpGet = async (url, _ms, headers) => {
		sent.set(url, headers);
		calls++;
		if (down) throw new Error('connect ECONNREFUSED');
		const path = url.replace('http://api.internal', '');
		return path in API ? { status: 200, body: JSON.stringify(API[path]) } : { status: 404, body: '{}' };
	};
	const getBytes: HttpGetBytes = async (url, _ms, headers) => {
		sent.set(url, headers);
		return IMAGES[url] ?? { status: 404, headers: {}, body: Buffer.from('{}') };
	};
	const handler = createHandler({
		dist,
		api: 'http://api.internal',
		site: 'https://qotm.site',
		indexNowKey: 'abc123key',
		apiKey: 'internal-key',
		get,
		getBytes,
		cacheMs: 0
	});
	server = createServer((req, res) => void handler(req, res));
	await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe('web server', () => {
	it('sends its key to the API, and never to the bucket an og:image redirects to', async () => {
		await fetch(`${base}/q/5k0q2j`);
		await fetch(`${base}/q/5k0q2j/og.png`);
		expect(sent.get('http://api.internal/v1/quotes/q_5k0q2j')).toEqual({ 'x-qotm-server': 'internal-key' });
		expect(sent.get('http://api.internal/v1/quotes/q_5k0q2j/og.png')).toEqual({ 'x-qotm-server': 'internal-key' });
		expect(sent.get('https://media.example/og/q.png')).toEqual({});
	});

	it('writes a quote’s tags into the app shell', async () => {
		const res = await fetch(`${base}/q/5k0q2j`);
		expect(res.status).toBe(200);
		expect(res.headers.get('cache-control')).toBe('no-cache, must-revalidate');
		const html = await res.text();
		expect(html).toContain('<title>Premature optimization is the root of all evil. · qotm</title>');
		expect(html).toContain('<meta property="og:image" content="https://qotm.site/q/5k0q2j/og.png" />');
		expect(html).toContain('<link rel="canonical" href="https://qotm.site/q/5k0q2j" />');
		expect(html).toContain('"@type":"Quotation"');
		// The quote itself, for crawlers that do not run the app.
		expect(html).toContain('<div id="root"><main data-prerender');
		expect(html).toContain('<blockquote><p>Premature optimization is the root of all evil.</p></blockquote>');
	});

	it('gives a shared ?card=terminal link the terminal card, with the same canonical URL', async () => {
		const html = await (await fetch(`${base}/q/5k0q2j?card=terminal`)).text();
		expect(html).toContain('<meta property="og:image" content="https://qotm.site/q/5k0q2j/og.png?card=terminal" />');
		expect(html).toContain('<meta name="twitter:image" content="https://qotm.site/q/5k0q2j/og.png?card=terminal" />');
		expect(html).toContain('<link rel="canonical" href="https://qotm.site/q/5k0q2j" />');
		// Any other value is the default card.
		const plain = await (await fetch(`${base}/q/5k0q2j?card=poster`)).text();
		expect(plain).toContain('<meta property="og:image" content="https://qotm.site/q/5k0q2j/og.png" />');

		const card = await fetch(`${base}/q/5k0q2j/og.png?card=terminal`);
		expect(card.status).toBe(200);
		expect(card.headers.get('cache-control')).toBe('public, max-age=86400, stale-while-revalidate=604800');
		expect(Buffer.from(await card.arrayBuffer())).toEqual(TERMINAL);
	});

	it('keeps a quote under review out of search engines, but shareable', async () => {
		const res = await fetch(`${base}/q/rev1ew`);
		expect(res.status).toBe(200);
		expect(res.headers.get('x-robots-tag')).toBe('noindex');
		const html = await res.text();
		expect(html).toContain('<meta name="robots" content="noindex" />');
		expect(html).toContain('<meta property="og:image" content="https://qotm.site/q/rev1ew/og.png" />');
	});

	it('redirects an id with its q_ prefix to the site’s URL', async () => {
		const res = await fetch(`${base}/q/q_5k0q2j?ref=x`, { redirect: 'manual' });
		expect(res.status).toBe(301);
		expect(res.headers.get('location')).toBe('/q/5k0q2j?ref=x');
	});

	it('serves a rendered og:image from this origin, cached; a fallback, never cached', async () => {
		const card = await fetch(`${base}/q/5k0q2j/og.png`);
		expect(card.status).toBe(200);
		expect(card.headers.get('content-type')).toBe('image/png');
		expect(card.headers.get('cache-control')).toBe('public, max-age=86400, stale-while-revalidate=604800');
		expect(Buffer.from(await card.arrayBuffer())).toEqual(RENDER);

		const site = await fetch(`${base}/og.png`);
		expect(site.headers.get('cache-control')).toBe('no-store');
		expect(Buffer.from(await site.arrayBuffer())).toEqual(FALLBACK);

		expect((await fetch(`${base}/authors/nobody/og.png`)).status).toBe(404);
	});

	it('tags a profile, the home page and the feeds', async () => {
		expect(await (await fetch(`${base}/@ada`)).text()).toContain('<title>Ada (@ada) · qotm</title>');
		expect(await (await fetch(`${base}/@ada/contributions`)).text()).toContain(
			'<link rel="canonical" href="https://qotm.site/@ada" />'
		);
		const home = await (await fetch(`${base}/`)).text();
		expect(home).toContain('<title>qotm — a thought between commands</title>');
		expect(home).toContain('"@type":"WebSite"');
		expect(home).toContain('<meta property="og:image" content="https://qotm.site/og.png" />');
		const search = await fetch(`${base}/search?q=knuth`);
		expect(search.headers.get('x-robots-tag')).toBe('noindex');
	});

	it('serves the RSS feeds', async () => {
		const res = await fetch(`${base}/feed.xml`);
		expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
		const xml = await res.text();
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain('<link>https://qotm.site/q/5k0q2j</link>');
		expect(xml).toContain('<title>“Premature optimization is the root of all evil.” — Donald E. Knuth</title>');
		expect(xml).toContain('<pubDate>Thu, 24 Sep 2026 09:30:00 GMT</pubDate>');
		expect(xml).toContain('<category>debugging</category>');
	});

	it('serves the IndexNow key', async () => {
		expect(await (await fetch(`${base}/abc123key.txt`)).text()).toBe('abc123key');
	});

	it('tags authors and topics', async () => {
		const author = await (await fetch(`${base}/authors/knuth`)).text();
		expect(author).toContain('<title>Donald E. Knuth · qotm</title>');
		expect(author).toContain('"sameAs":["https://www.wikidata.org/wiki/Q17457"]');
		expect(author).toContain('<a href="/q/5k0q2j">Premature optimization is the root of all evil.</a>');
		expect(await (await fetch(`${base}/topics/debugging`)).text()).toContain('<title>Debugging · qotm</title>');
	});

	it('answers 404 for a page the API does not have, still with the app', async () => {
		const res = await fetch(`${base}/q/zzzzzz`);
		expect(res.status).toBe(404);
		expect(res.headers.get('x-robots-tag')).toBe('noindex');
		expect(await res.text()).toContain('<div id="root"></div>');
	});

	it('answers 404 for a path the app has no route for (no soft 404)', async () => {
		for (const path of ['/does-not-exist', '/q/5k0q2j/extra', '/wp-login.php', '/ada']) {
			const res = await fetch(`${base}${path}`);
			expect(res.status, path).toBe(404);
			expect(res.headers.get('x-robots-tag')).toBe('noindex');
			const html = await res.text();
			expect(html).toContain('<meta name="robots" content="noindex" />');
			expect(html).toContain('<div id="root"></div>');
		}
		// The public pages without an API record still answer 200.
		for (const path of ['/', '/discover', '/terms', '/search']) {
			expect((await fetch(`${base}${path}`)).status, path).toBe(200);
		}
	});

	it('sends a trailing-slash URL to the page’s own URL', async () => {
		const res = await fetch(`${base}/discover/?ref=x`, { redirect: 'manual' });
		expect(res.status).toBe(301);
		expect(res.headers.get('location')).toBe('/discover?ref=x');
		const deep = await fetch(`${base}/q/5k0q2j//`, { redirect: 'manual' });
		expect(deep.headers.get('location')).toBe('/q/5k0q2j');
	});

	it('serves the app without tags when the API is down', async () => {
		down = true;
		const res = await fetch(`${base}/q/5k0q2j`);
		down = false;
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('<title>qotm</title>');
	});

	it('keeps the account pages and the console out of the index', async () => {
		for (const path of ['/admin', '/admin/quotes', '/settings', '/my-quotes']) {
			const res = await fetch(`${base}${path}`);
			expect(res.status).toBe(200);
			expect(res.headers.get('x-robots-tag')).toBe('noindex');
			expect(await res.text()).toContain('<meta name="robots" content="noindex" />');
		}
		const plain = await fetch(`${base}/discover`);
		expect(plain.headers.get('x-robots-tag')).toBeNull();
	});

	it('does not ask the API for other routes', async () => {
		const before = calls;
		await fetch(`${base}/terms`);
		await fetch(`${base}/somewhere/else`);
		expect(calls).toBe(before);
	});

	it('serves robots.txt, the sitemap and the health probe', async () => {
		expect(await (await fetch(`${base}/robots.txt`)).text()).toContain('Disallow: /admin');
		const sitemap = await fetch(`${base}/sitemap.xml`);
		expect(sitemap.headers.get('content-type')).toContain('application/xml');
		expect(await sitemap.text()).toContain('<loc>https://qotm.site/sitemaps/quotes.xml</loc>');
		const quotes = await (await fetch(`${base}/sitemaps/quotes.xml`)).text();
		expect(quotes).toContain('<url><loc>https://qotm.site/q/5k0q2j</loc><lastmod>2026-09-24</lastmod></url>');
		expect((await fetch(`${base}/sitemaps/secrets.xml`)).status).toBe(404);
		expect(await (await fetch(`${base}/healthz`)).text()).toBe('ok\n');
	});

	it('caches hashed assets for a year, gzipped, and 404s a missing one', async () => {
		const res = await fetch(`${base}/assets/index-abc123.js`, { headers: { 'accept-encoding': 'gzip' } });
		expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
		expect(res.headers.get('content-encoding')).toBe('gzip');
		// fetch has already gunzipped it.
		expect(await res.text()).toContain('console.log');
		expect((await fetch(`${base}/assets/missing.js`)).status).toBe(404);
		expect((await fetch(`${base}/favicon.ico`)).headers.get('cache-control')).toBe('public, max-age=604800');
	});

	it('never serves dotfiles or anything outside the build', async () => {
		expect(await (await fetch(`${base}/.env`)).text()).not.toContain('SECRET');
		const traversal = await new Promise<string>((resolve) => {
			// fetch normalizes "..": send the raw path.
			const req = request(`${base}/..%2f..%2fetc%2fpasswd`, (res: IncomingMessage) => {
				let body = '';
				res.on('data', (c: Buffer) => (body += c));
				res.on('end', () => resolve(body));
			});
			req.end();
		});
		expect(traversal).not.toContain('root:');
		expect(traversal).toContain('<div id="root"></div>');
	});

	it('refuses anything but GET and HEAD', async () => {
		expect((await fetch(`${base}/`, { method: 'POST' })).status).toBe(405);
		const head = await fetch(`${base}/q/5k0q2j`, { method: 'HEAD' });
		expect(head.status).toBe(200);
	});
});
