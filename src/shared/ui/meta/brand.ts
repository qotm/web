/**
 * Product name, in one place.
 *
 * Consumed twice over, which is the whole reason it lives here:
 *  - at runtime by `MetaProvider`, as the per-route title suffix;
 *  - at build time by each app's `vite.config.ts`, which passes it to
 *    `defineAppConfig({ appTitle })` to substitute `%APP_TITLE%` into
 *    `index.html` — HTML cannot import, and the static `<title>` is what a
 *    visitor sees before React mounts.
 *
 * Keep this file free of React imports: `vite.config.ts` imports it directly
 * via the `@/shared/ui/meta/brand` subpath, exactly as it does `./theme-colors`.
 */
export const BRAND = {
	name: 'Qotm Web',
	/** The console needs its own suffix so an admin can tell two tabs apart. */
	adminName: 'Qotm Web Admin'
} as const;
