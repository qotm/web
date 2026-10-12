// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, request, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHandler } from './app.ts';
import type { HttpGet } from './http-get.ts';

const INDEX = `<!doctype html><html><head><meta name="description" content="base" /><title>qotm</title></head><body><div id="root"></div></body></html>`;

const API: Record<string, unknown> = {
	'/v1/quotes/q_5k0q2j': {
		id: 'q_5k0q2j',
		text: 'Premature optimization is the root of all evil.',
		type: 'canonical',
		status: 'CURATED',
		author: { slug: 'knuth', name: 'Donald E. Knuth' },
		attribution: null
	},
	'/v1/authors/knuth': { slug: 'knuth', name: 'Donald E. Knuth', line: '1938–' },
	'/v1/topics/debugging': {
		slug: 'debugging',
		name: 'debugging',
		description: null,
		counts: { quotes: 3, curated: 1 }
	},
	'/v1/topics': { list: [{ slug: 'debugging' }] },
	'/v1/quotes?feed=latest&limit=50': {
		list: [{ id: 'q_5k0q2j', publishedAt: null, author: { slug: 'knuth' } }],
		nextCursor: null
	}
};

let base: string;
let server: Server;
let calls = 0;
let down = false;

beforeAll(async () => {
	const dist = mkdtempSync(join(tmpdir(), 'qotm-dist-'));
	writeFileSync(join(dist, 'index.html'), INDEX);
	mkdirSync(join(dist, 'assets'));
	writeFileSync(join(dist, 'assets', 'index-abc123.js'), `console.log(${JSON.stringify('x'.repeat(4000))});`);
	writeFileSync(join(dist, 'favicon.ico'), 'ico');
	writeFileSync(join(dist, '.env'), 'SECRET=1');
	const get: HttpGet = async (url) => {
		calls++;
		if (down) throw new Error('connect ECONNREFUSED');
		const path = url.replace('http://api.internal', '');
		return path in API ? { status: 200, body: JSON.stringify(API[path]) } : { status: 404, body: '{}' };
	};
	const handler = createHandler({
		dist,
		api: 'http://api.internal',
		publicApi: 'https://api.qotm.site',
		site: 'https://qotm.site',
		get,
		cacheMs: 0
	});
	server = createServer((req, res) => void handler(req, res));
	await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe('web server', () => {
	it('writes a quote’s tags into the app shell', async () => {
		const res = await fetch(`${base}/q/5k0q2j`);
		expect(res.status).toBe(200);
		expect(res.headers.get('cache-control')).toBe('no-cache, must-revalidate');
		const html = await res.text();
		expect(html).toContain('<title>Premature optimization is the root of all evil. · qotm</title>');
		expect(html).toContain('<meta property="og:image" content="https://api.qotm.site/v1/quotes/q_5k0q2j/og.png" />');
		expect(html).toContain('<link rel="canonical" href="https://qotm.site/q/5k0q2j" />');
		expect(html).toContain('<div id="root"></div>');
	});

	it('tags authors and topics', async () => {
		expect(await (await fetch(`${base}/authors/knuth`)).text()).toContain('<title>Donald E. Knuth · qotm</title>');
		expect(await (await fetch(`${base}/topics/debugging`)).text()).toContain('<title>Debugging · qotm</title>');
	});

	it('answers 404 for a page the API does not have, still with the app', async () => {
		const res = await fetch(`${base}/q/zzzzzz`);
		expect(res.status).toBe(404);
		expect(res.headers.get('x-robots-tag')).toBe('noindex');
		expect(await res.text()).toContain('<div id="root"></div>');
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
		await fetch(`${base}/discover`);
		await fetch(`${base}/@ada`);
		expect(calls).toBe(before);
	});

	it('serves robots.txt, the sitemap and the health probe', async () => {
		expect(await (await fetch(`${base}/robots.txt`)).text()).toContain('Disallow: /admin');
		const sitemap = await fetch(`${base}/sitemap.xml`);
		expect(sitemap.headers.get('content-type')).toContain('application/xml');
		expect(await sitemap.text()).toContain('<loc>https://qotm.site/q/5k0q2j</loc>');
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
