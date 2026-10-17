import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { BRAND } from './src/shared/ui/meta/brand.ts';
import { THEME_COLOR } from './src/shared/ui/theme/theme-colors.ts';
import { httpGet } from './server/http-get.ts';
import { FALLBACK_QUOTE, readmeCardSvg, readmeQuoteOf } from './server/readme-card.ts';

/**
 * Opens the connection to the API origin while the HTML is still parsing.
 *
 * The app's first act is a Better Auth session request, and the API is a
 * different origin, so that request pays DNS + TCP + TLS before it can even be
 * sent. Measured against a deployed API: ~420 ms of an ~880 ms `get-session` was
 * connection setup. Preconnecting overlaps it with the bundle download instead
 * of paying it afterwards.
 *
 * `crossorigin` is load-bearing, not decoration. Better Auth and RTK Query both
 * send the session cookie (`credentials: 'include'`), and a credentialed request
 * will not reuse an anonymous socket — omit it and the browser opens a second
 * connection, making the preconnect pure waste. It must also stay a *preconnect*
 * and never become a `preload`: the session response is user-specific and must
 * not be speculatively fetched.
 *
 * Injected here rather than in `index.html` because `VITE_APP_API_URL` is only
 * known to the build, and HTML can't read env.
 */
function apiPreconnect(apiUrl: string): Plugin {
	let origin = '';
	try {
		origin = apiUrl ? new URL(apiUrl).origin : '';
	} catch {
		/* malformed VITE_APP_API_URL — skip rather than emit a broken tag */
	}
	return {
		name: 'app:api-preconnect',
		transformIndexHtml: {
			order: 'pre',
			handler: () =>
				origin
					? [
							{
								tag: 'link',
								attrs: { rel: 'preconnect', href: origin, crossorigin: true },
								injectTo: 'head-prepend' as const
							}
						]
					: []
		}
	};
}

/**
 * Substitutes `%THEME_COLOR%` / `%APP_TITLE%` in `index.html`.
 *
 * The `<head>` needs the page background (the `theme-color` meta, and the `html`
 * background that stops a white flash before the stylesheet lands) and HTML
 * cannot import. The static `<title>` must match the suffix `MetaProvider`
 * appends at runtime, so it comes from `BRAND` rather than being typed twice.
 *
 * Runs for `vite dev` as well as the build.
 */
function injectHtmlConstants(): Plugin {
	return {
		name: 'app:inject-html-constants',
		transformIndexHtml: (html) => html.replaceAll('%THEME_COLOR%', THEME_COLOR).replaceAll('%APP_TITLE%', BRAND.name)
	};
}

// `loadEnv` rather than `process.env`: VITE_APP_* live in `.env`, not the shell,
// so the build would otherwise never see them.
/**
 * `/today.svg` in `vite dev`: the README card, which the web image's server
 * draws in production (server/readme-card.ts), drawn the same way from the
 * dev API, so the /cli page's preview shows here too. No embedded font.
 */
function readmeCard(apiUrl: string): Plugin {
	return {
		name: 'app:readme-card',
		configureServer(server) {
			server.middlewares.use('/today.svg', (req, res) => {
				const theme =
					new URL(req.url ?? '/', 'http://localhost').searchParams.get('theme') === 'light' ? 'light' : 'dark';
				void httpGet(`${apiUrl.replace(/\/+$/, '')}/v1/quotes/today`, 3000)
					.then((r) => (r.status === 200 ? readmeQuoteOf(JSON.parse(r.body)) : FALLBACK_QUOTE))
					.catch(() => FALLBACK_QUOTE)
					.then((quote) => {
						res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
						res.setHeader('Cache-Control', 'no-store');
						res.end(readmeCardSvg(quote, theme));
					});
			});
		}
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, import.meta.dirname, '');
	const hosts = env.VITE_APP_ALLOWED_HOSTS;

	return {
		plugins: [
			react(),
			tailwindcss(),
			apiPreconnect(env.VITE_APP_API_URL),
			injectHtmlConstants(),
			readmeCard(env.VITE_APP_API_URL)
		],
		server: {
			host: true,
			port: env.PORT ? Number(env.PORT) : undefined,
			strictPort: true,
			allowedHosts: hosts ? hosts.split(',').map((h) => h.trim()) : []
		},
		resolve: {
			alias: {
				'@': path.resolve(import.meta.dirname, './src')
			}
		}
	};
});
