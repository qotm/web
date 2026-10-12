import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { createGzip } from 'node:zlib';
import type { AuthorEntity, QuoteEntity, TopicEntity } from '../src/shared/types/api/types.gen.ts';
import { PRIVATE_PREFIXES } from '../src/lib/paths.ts';
import { authorTags, inject, noindex, quoteTags, topicTags, type PageTags } from './meta.ts';
import { httpGet, type HttpGet } from './http-get.ts';
import { collectUrls, robotsTxt, sitemapXml } from './sitemap.ts';

export type ServerConfig = {
	/** The built app (`vite build`'s outDir). */
	dist: string;
	/** Where this server reaches the API (an internal address in production). */
	api: string;
	/** The API as the public reaches it: og:image URLs point here. */
	publicApi: string;
	/** This site's public origin, for canonical URLs, the sitemap and robots.txt. */
	site: string;
	/** How long a page waits for the API before it is sent without its tags. */
	timeoutMs?: number;
	/** How long the sitemap and fetched tags are reused. */
	cacheMs?: number;
	/** The API client (tests pass their own). */
	get?: HttpGet;
};

class NotFound extends Error {}

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.map': 'application/json; charset=utf-8'
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/;

/**
 * Caching, as the nginx config it replaces had it. Hashed assets never
 * change under a URL; anything with a stable name must be revalidated, or
 * returning visitors are pinned to an old build.
 */
function cacheControl(path: string) {
	if (path.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
	if (/\.(png|jpe?g|gif|svg|ico|webp|woff2?)$/.test(path)) return 'public, max-age=604800';
	return 'no-cache, must-revalidate';
}

/** Modest hardening, as before. No CSP: index.html's inline theme script would need a nonce. */
const HARDENING = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'SAMEORIGIN'
};

const isPrivate = (path: string) => PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

/** A tiny time-boxed cache: the sitemap and recently fetched tags. */
function memo<T>(ms: number, max = 500) {
	const store = new Map<string, { at: number; value: T }>();
	return async (key: string, make: () => Promise<T>): Promise<T> => {
		const hit = store.get(key);
		if (hit && Date.now() - hit.at < ms) return hit.value;
		const value = await make();
		if (store.size >= max) store.delete(store.keys().next().value!);
		store.set(key, { at: Date.now(), value });
		return value;
	};
}

/**
 * The web image's server: the built SPA, with per-page title, description,
 * canonical URL and Open Graph / Twitter tags written into index.html for
 * /q/:id, /authors/:slug and /topics/:slug (crawlers and link unfurlers do
 * not run the app), plus /sitemap.xml, /robots.txt and /healthz.
 */
export function createHandler(config: ServerConfig) {
	const { dist, api, publicApi, site } = config;
	const timeoutMs = config.timeoutMs ?? 1500;
	const request = config.get ?? httpGet;
	const index = readFileSync(join(dist, 'index.html'), 'utf8');
	const tagsCache = memo<PageTags | null>(config.cacheMs ?? 60_000);
	const sitemapCache = memo<string>(config.cacheMs ?? 3_600_000, 1);

	async function get<T>(path: string): Promise<T> {
		const res = await request(`${api}${path}`, timeoutMs);
		if (res.status === 404) throw new NotFound(path);
		if (res.status < 200 || res.status >= 300) throw new Error(`${path}: ${res.status}`);
		return JSON.parse(res.body) as T;
	}

	/** The tags for a path, null when it is not one of the three; NotFound when the API has no such page. */
	function tagsFor(path: string): Promise<PageTags | null> | null {
		let m = /^\/q\/([a-z0-9]{3,32})$/i.exec(path);
		if (m) {
			const id = `q_${m[1]}`;
			return tagsCache(path, async () => quoteTags(await get<QuoteEntity>(`/v1/quotes/${id}`), site, publicApi));
		}
		m = /^\/authors\/([a-z0-9-]{1,80})$/.exec(path);
		if (m) {
			const slug = m[1];
			return tagsCache(path, async () => authorTags(await get<AuthorEntity>(`/v1/authors/${slug}`), site));
		}
		m = /^\/topics\/([a-z0-9-]{1,60})$/.exec(path);
		if (m) {
			const slug = m[1];
			return tagsCache(path, async () => topicTags(await get<TopicEntity>(`/v1/topics/${slug}`), site));
		}
		return null;
	}

	function send(
		req: IncomingMessage,
		res: ServerResponse,
		status: number,
		type: string,
		body: string | Buffer,
		cache: string
	) {
		res.statusCode = status;
		for (const [k, v] of Object.entries(HARDENING)) res.setHeader(k, v);
		res.setHeader('Content-Type', type);
		res.setHeader('Cache-Control', cache);
		const gzip =
			/\bgzip\b/.test(String(req.headers['accept-encoding'] ?? '')) && COMPRESSIBLE.test(type) && body.length > 1024;
		if (gzip) {
			res.setHeader('Content-Encoding', 'gzip');
			res.setHeader('Vary', 'Accept-Encoding');
			const z = createGzip();
			z.pipe(res);
			z.end(req.method === 'HEAD' ? '' : body);
			return;
		}
		res.setHeader('Content-Length', Buffer.byteLength(body));
		res.end(req.method === 'HEAD' ? undefined : body);
	}

	function sendFile(req: IncomingMessage, res: ServerResponse, path: string, file: string) {
		const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
		const size = statSync(file).size;
		res.statusCode = 200;
		for (const [k, v] of Object.entries(HARDENING)) res.setHeader(k, v);
		res.setHeader('Content-Type', type);
		res.setHeader('Cache-Control', cacheControl(path));
		if (req.method === 'HEAD') {
			res.setHeader('Content-Length', size);
			return res.end();
		}
		if (/\bgzip\b/.test(String(req.headers['accept-encoding'] ?? '')) && COMPRESSIBLE.test(type) && size > 1024) {
			res.setHeader('Content-Encoding', 'gzip');
			res.setHeader('Vary', 'Accept-Encoding');
			createReadStream(file).pipe(createGzip()).pipe(res);
			return;
		}
		res.setHeader('Content-Length', size);
		createReadStream(file).pipe(res);
	}

	/** A file under dist for this path, never outside it, never a dotfile (but .well-known). */
	function fileFor(path: string): string | null {
		if (path === '/' || path.endsWith('/')) return null;
		if (/(^|\/)\.(?!well-known\/)/.test(path)) return null;
		const file = normalize(join(dist, path));
		if (!file.startsWith(dist.endsWith(sep) ? dist : dist + sep)) return null;
		return existsSync(file) && statSync(file).isFile() ? file : null;
	}

	return async function handle(req: IncomingMessage, res: ServerResponse) {
		const url = new URL(req.url ?? '/', 'http://localhost');
		let path: string;
		try {
			path = decodeURIComponent(url.pathname);
		} catch {
			return send(req, res, 400, TYPES['.txt'], 'Bad request\n', 'no-store');
		}
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			res.setHeader('Allow', 'GET, HEAD');
			return send(req, res, 405, TYPES['.txt'], 'Method not allowed\n', 'no-store');
		}

		if (path === '/healthz') return send(req, res, 200, TYPES['.txt'], 'ok\n', 'no-store');
		if (path === '/robots.txt') return send(req, res, 200, TYPES['.txt'], robotsTxt(site), 'public, max-age=3600');
		if (path === '/sitemap.xml') {
			try {
				const xml = await sitemapCache('sitemap', async () => sitemapXml(await collectUrls(get, site)));
				return send(req, res, 200, TYPES['.xml'], xml, 'public, max-age=3600');
			} catch (err) {
				console.error(JSON.stringify({ level: 'error', msg: 'sitemap failed', err: String(err) }));
				return send(req, res, 503, TYPES['.txt'], 'The sitemap is unavailable; try again shortly.\n', 'no-store');
			}
		}

		const file = fileFor(path);
		if (file) return sendFile(req, res, path, file);
		// A missing hashed asset is a real 404, not the app shell.
		if (path.startsWith('/assets/')) return send(req, res, 404, TYPES['.txt'], 'Not found\n', 'no-store');

		const page = 'no-cache, must-revalidate';
		if (isPrivate(path)) {
			res.setHeader('X-Robots-Tag', 'noindex');
			return send(req, res, 200, TYPES['.html'], noindex(index), page);
		}
		const pending = tagsFor(path);
		if (!pending) return send(req, res, 200, TYPES['.html'], index, page);
		try {
			const tags = await pending;
			if (tags?.noindex) res.setHeader('X-Robots-Tag', 'noindex');
			return send(req, res, 200, TYPES['.html'], tags ? inject(index, tags) : index, page);
		} catch (err) {
			// The app renders its own not-found page; crawlers get the status too.
			if (err instanceof NotFound) {
				res.setHeader('X-Robots-Tag', 'noindex');
				return send(req, res, 404, TYPES['.html'], noindex(index), page);
			}
			// The API is slow or down: serve the app without the tags rather than fail the page.
			console.error(JSON.stringify({ level: 'warn', msg: 'page tags unavailable', path, err: String(err) }));
			return send(req, res, 200, TYPES['.html'], index, page);
		}
	};
}
