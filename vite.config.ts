import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { BRAND } from './src/shared/ui/meta/brand';
import { THEME_COLORS } from './src/shared/ui/theme/theme-colors';

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
 * Substitutes `%THEME_LIGHT%` / `%THEME_DARK%` / `%APP_TITLE%` in `index.html`.
 *
 * The `<head>` needs the theme background twice over — the pre-paint script that
 * sets the `dark` class before first paint, and the `html` background that stops
 * a white flash on a dark load — and HTML cannot import. The static `<title>` is
 * the same story: it must match the suffix `MetaProvider` appends at runtime, so
 * it comes from `BRAND` rather than being typed out a second time.
 *
 * Runs for `vite dev` as well as the build.
 */
function injectHtmlConstants(): Plugin {
	return {
		name: 'app:inject-html-constants',
		transformIndexHtml: (html) =>
			html
				.replaceAll('%THEME_LIGHT%', THEME_COLORS.light)
				.replaceAll('%THEME_DARK%', THEME_COLORS.dark)
				.replaceAll('%APP_TITLE%', BRAND.name)
	};
}

// `loadEnv` rather than `process.env`: VITE_APP_* live in `.env`, not the shell,
// so the build would otherwise never see them.
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, import.meta.dirname, '');
	const hosts = env.VITE_APP_ALLOWED_HOSTS;

	return {
		plugins: [react(), tailwindcss(), apiPreconnect(env.VITE_APP_API_URL), injectHtmlConstants()],
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
