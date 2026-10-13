import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createHandler } from './app.ts';

/**
 * Runs the web image: `node server/index.ts` (Node strips the types). Runtime
 * configuration, unlike the VITE_* values baked into the bundle:
 *
 *   PORT             listen port (8080)
 *   API_URL          where this server reaches the API (required)
 *   SITE_URL         this site's public origin, for canonical URLs and the sitemap (required)
 *   DIST             the built app (./dist)
 *   INDEXNOW_KEY     IndexNow's key, served at /<key>.txt (the API's INDEXNOW_KEY); optional
 */
const need = (key: string) => {
	const value = process.env[key]?.replace(/\/+$/, '');
	if (!value) {
		console.error(`${key} is required`);
		process.exit(1);
	}
	return value;
};

const api = need('API_URL');
const handler = createHandler({
	dist: resolve(process.env.DIST ?? 'dist'),
	api,
	site: need('SITE_URL'),
	indexNowKey: process.env.INDEXNOW_KEY || undefined
});

const port = Number(process.env.PORT ?? 8080);
const server = createServer((req, res) => {
	handler(req, res).catch((err) => {
		console.error(JSON.stringify({ level: 'error', msg: 'request failed', url: req.url, err: String(err) }));
		if (!res.headersSent) res.statusCode = 500;
		res.end();
	});
});
server.listen(port, () => console.log(JSON.stringify({ level: 'info', msg: 'web listening', port })));

for (const signal of ['SIGTERM', 'SIGINT'] as const)
	process.on(signal, () => {
		server.close(() => process.exit(0));
		setTimeout(() => process.exit(0), 5000).unref();
	});
