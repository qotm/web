import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { createGzip } from 'node:zlib';
import type {
	AuthorEntity,
	ProfileEntity,
	QuoteEntity,
	QuoteFeedEntity,
	TopicEntity,
	TopicListEntity
} from '../src/shared/types/api/types.gen.ts';
import { PRIVATE_PREFIXES, paths } from '../src/lib/paths.ts';
import { FEEDS, rssXml, type FeedPath } from './feed.ts';
import { httpGet, httpGetBytes, type HttpGet, type HttpGetBytes } from './http-get.ts';
import {
	authorTags,
	inject,
	noindex,
	profileTags,
	quoteTags,
	staticTags,
	topicTags,
	type PageTags,
	type QuoteCard,
	type Site
} from './meta.ts';
import { topicIndexBody } from './prerender.ts';
import {
	SITEMAP_PARTS,
	collectUrls,
	robotsTxt,
	sitemapIndexXml,
	sitemapXml,
	type SitemapPart,
	type SitemapUrl
} from './sitemap.ts';

export type ServerConfig = {
	/** The built app (`vite build`'s outDir). */
	dist: string;
	/** Where this server reaches the API (an internal address in production). */
	api: string;
	/** This site's public origin, for canonical URLs, og:images, the sitemap and robots.txt. */
	site: string;
	/** IndexNow's key: served at /<key>.txt so search engines trust the API's pings. */
	indexNowKey?: string;
	/**
	 * The API's INTERNAL_API_KEY, sent as X-Qotm-Server so this server's
	 * requests (every visitor's, from one address) skip the API's rate limit.
	 * Sent to the API's origin only, never to the bucket an og:image redirects to.
	 */
	apiKey?: string;
	/** How long a page waits for the API before it is sent without its tags. */
	timeoutMs?: number;
	/** How long the sitemap and fetched tags are reused. */
	cacheMs?: number;
	/** The API client (tests pass their own). */
	get?: HttpGet;
	/** The og:image client: the API's image routes and the bucket they redirect to. */
	getBytes?: HttpGetBytes;
};

/** The API waits up to 8s for a render before it answers with a fallback. */
const OG_TIMEOUT_MS = 12_000;
/** A rendered card never changes for its revision; the route may move to a new one. */
const OG_RENDER_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';
/** How many quotes a crawlable page lists. */
const LISTED = 20;

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
 * The web image's server: the built SPA, with each public page's title,
 * description, canonical URL, Open Graph / Twitter tags, JSON-LD and plain
 * HTML for crawlers written into index.html (crawlers and link unfurlers do
 * not run the app); the og:images on this origin; /sitemap.xml and its
 * parts, /robots.txt, the RSS feeds and /healthz.
 */
export function createHandler(config: ServerConfig) {
	const { dist, api, site: origin } = config;
	const site: Site = { origin };
	const timeoutMs = config.timeoutMs ?? 1500;
	// The key goes to the API's origin and nowhere else.
	const apiOrigin = new URL(api).origin;
	const keyFor = (url: string): Record<string, string> =>
		config.apiKey && new URL(url).origin === apiOrigin ? { 'x-qotm-server': config.apiKey } : {};
	const fetchJson = config.get ?? httpGet;
	const fetchBytes = config.getBytes ?? httpGetBytes;
	const request = (url: string, ms: number) => fetchJson(url, ms, keyFor(url));
	const bytes = (url: string, ms: number) => fetchBytes(url, ms, keyFor(url));
	const index = readFileSync(join(dist, 'index.html'), 'utf8');
	const tagsCache = memo<PageTags | null>(config.cacheMs ?? 60_000);
	const sitemapCache = memo<Record<SitemapPart, SitemapUrl[]>>(config.cacheMs ?? 3_600_000, 1);
	const feedCache = memo<string>(config.cacheMs ?? 600_000, 4);

	async function get<T>(path: string): Promise<T> {
		const res = await request(`${api}${path}`, timeoutMs);
		if (res.status === 404) throw new NotFound(path);
		if (res.status < 200 || res.status >= 300) throw new Error(`${path}: ${res.status}`);
		return JSON.parse(res.body) as T;
	}

	/** A feed's first page; an empty list if the API fails, so a page's tags never depend on it. */
	const firstQuotes = (query: string) =>
		get<QuoteFeedEntity>(`/v1/quotes?${query}&limit=${LISTED}`).then(
			(f) => f.list,
			() => []
		);

	/** The tags for a path, null when it has none; NotFound when the API has no such page. */
	function tagsFor(path: string, search: URLSearchParams): Promise<PageTags | null> | null {
		let m = /^\/q\/([a-z0-9]{3,32})$/i.exec(path);
		if (m) {
			const id = `q_${m[1]}`;
			const card: QuoteCard = search.get('card') === 'terminal' ? 'terminal' : 'quote';
			const key = card === 'quote' ? path : `${path}?card=${card}`;
			return tagsCache(key, async () => quoteTags(await get<QuoteEntity>(`/v1/quotes/${id}`), site, card));
		}
		m = /^\/authors\/([a-z0-9-]{1,80})$/.exec(path);
		if (m) {
			const slug = m[1];
			return tagsCache(path, async () => {
				const [author, quotes] = await Promise.all([
					get<AuthorEntity>(`/v1/authors/${slug}`),
					firstQuotes(`author=${slug}`)
				]);
				return authorTags(author, quotes, site);
			});
		}
		m = /^\/topics\/([a-z0-9-]{1,60})$/.exec(path);
		if (m) {
			const slug = m[1];
			return tagsCache(path, async () => {
				const [topic, quotes] = await Promise.all([
					get<TopicEntity>(`/v1/topics/${slug}`),
					firstQuotes(`topic=${slug}`)
				]);
				return topicTags(topic, quotes, site);
			});
		}
		m = /^\/@([a-z0-9_]{1,30})(?:\/(?:quotes|contributions))?$/i.exec(path);
		if (m) {
			const handle = m[1];
			return tagsCache(`/@${handle}`, async () => profileTags(await get<ProfileEntity>(`/v1/users/${handle}`), site));
		}
		if (path === paths.home || path === paths.latest || path === paths.discover || path === paths.curated) {
			const feed = path === paths.home ? 'latest' : path.slice(1);
			return tagsCache(path, async () => staticTags(path, site, await firstQuotes(`feed=${feed}`)));
		}
		if (path === paths.topics) {
			return tagsCache(path, async () => {
				const tags = staticTags(path, site)!;
				const topics = await get<TopicListEntity>('/v1/topics').then(
					(t) => t.list,
					() => []
				);
				return { ...tags, body: topicIndexBody(tags.description, topics) };
			});
		}
		const tags = staticTags(path, site);
		if (tags && path === paths.search() && search.get('q')) return Promise.resolve({ ...tags, noindex: true });
		return tags ? Promise.resolve(tags) : null;
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

	function redirect(res: ServerResponse, location: string) {
		res.statusCode = 301;
		res.setHeader('Location', location);
		res.setHeader('Cache-Control', 'public, max-age=86400');
		res.end();
	}

	/**
	 * An og:image on this origin, from the API's route for it. The API waits
	 * for the render; a rendered card (X-Og-Image: render) is cached for a
	 * day, a fallback never, so the next unfurl gets the card.
	 */
	async function og(req: IncomingMessage, res: ServerResponse, apiPath: string) {
		try {
			const r = await bytes(`${api}${apiPath}`, OG_TIMEOUT_MS);
			if (r.status === 404) return send(req, res, 404, TYPES['.txt'], 'Not found\n', 'no-store');
			const rendered = r.headers['x-og-image'] === 'render';
			let png = r.body;
			if (r.status >= 300 && r.status < 400 && r.headers.location) {
				const image = await bytes(new URL(r.headers.location, api).href, OG_TIMEOUT_MS);
				if (image.status !== 200) throw new Error(`image ${image.status}`);
				png = image.body;
			} else if (r.status !== 200) {
				throw new Error(`${apiPath}: ${r.status}`);
			}
			return send(req, res, 200, TYPES['.png'], png, rendered ? OG_RENDER_CACHE : 'no-store');
		} catch (err) {
			console.error(JSON.stringify({ level: 'warn', msg: 'og image unavailable', path: apiPath, err: String(err) }));
			return send(req, res, 502, TYPES['.txt'], 'The image is unavailable; try again shortly.\n', 'no-store');
		}
	}

	/** The og:image route on the API for one of this site's og:image paths, or null. */
	function ogRoute(path: string, search: URLSearchParams): string | null {
		if (path === '/og.png') return '/v1/og.png';
		let m = /^\/q\/([a-z0-9]{3,32})\/og\.png$/i.exec(path);
		if (m) return `/v1/quotes/q_${m[1]}/og.png${search.get('card') === 'terminal' ? '?variant=terminal' : ''}`;
		m = /^\/authors\/([a-z0-9-]{1,80})\/og\.png$/.exec(path);
		if (m) return `/v1/authors/${m[1]}/og.png`;
		m = /^\/topics\/([a-z0-9-]{1,60})\/og\.png$/.exec(path);
		if (m) return `/v1/topics/${m[1]}/og.png`;
		return null;
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

	const sitemap = () => sitemapCache('sitemap', () => collectUrls(get, origin));

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
		if (path === '/robots.txt') return send(req, res, 200, TYPES['.txt'], robotsTxt(origin), 'public, max-age=3600');
		if (config.indexNowKey && path === `/${config.indexNowKey}.txt`) {
			return send(req, res, 200, TYPES['.txt'], config.indexNowKey, 'public, max-age=86400');
		}
		// The API's public ids carry a `q_` the site's URLs leave out.
		const prefixed = /^\/q\/q_([a-z0-9]{3,32})(\/og\.png)?$/i.exec(path);
		if (prefixed) return redirect(res, `/q/${prefixed[1]}${prefixed[2] ?? ''}${url.search}`);

		const image = ogRoute(path, url.searchParams);
		if (image) return og(req, res, image);

		const part = /^\/sitemaps\/([a-z]+)\.xml$/.exec(path)?.[1];
		if (path === '/sitemap.xml' || part) {
			if (part && !SITEMAP_PARTS.includes(part as SitemapPart)) {
				return send(req, res, 404, TYPES['.txt'], 'Not found\n', 'no-store');
			}
			try {
				const urls = await sitemap();
				const body = part ? sitemapXml(urls[part as SitemapPart]) : sitemapIndexXml(origin, urls);
				return send(req, res, 200, TYPES['.xml'], body, 'public, max-age=3600');
			} catch (err) {
				console.error(JSON.stringify({ level: 'error', msg: 'sitemap failed', err: String(err) }));
				return send(req, res, 503, TYPES['.txt'], 'The sitemap is unavailable; try again shortly.\n', 'no-store');
			}
		}
		if (path in FEEDS) {
			const feed = path as FeedPath;
			try {
				const body = await feedCache(feed, async () => {
					const page = await get<QuoteFeedEntity>(`/v1/quotes?feed=${FEEDS[feed].feed}&limit=50`);
					return rssXml(feed, origin, page.list);
				});
				return send(req, res, 200, 'application/rss+xml; charset=utf-8', body, 'public, max-age=600');
			} catch (err) {
				console.error(JSON.stringify({ level: 'error', msg: 'feed failed', path, err: String(err) }));
				return send(req, res, 503, TYPES['.txt'], 'The feed is unavailable; try again shortly.\n', 'no-store');
			}
		}

		const file = fileFor(path);
		if (file) return sendFile(req, res, path, file);
		// A missing hashed asset is a real 404, not the app shell.
		if (path.startsWith('/assets/')) return send(req, res, 404, TYPES['.txt'], 'Not found\n', 'no-store');

		// One URL per page: `/discover/` is `/discover`.
		if (path.length > 1 && path.endsWith('/')) {
			return redirect(res, `${encodeURI(path.replace(/\/+$/, '')) || '/'}${url.search}`);
		}

		const page = 'no-cache, must-revalidate';
		if (isPrivate(path)) {
			res.setHeader('X-Robots-Tag', 'noindex');
			return send(req, res, 200, TYPES['.html'], noindex(index), page);
		}
		// Every public page has tags and every account page is private, so a
		// path with neither is one the app has no route for: its not-found page,
		// with the status a crawler needs to drop it (no soft 404).
		const pending = tagsFor(path, url.searchParams);
		if (!pending) {
			res.setHeader('X-Robots-Tag', 'noindex');
			return send(req, res, 404, TYPES['.html'], noindex(index), page);
		}
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
