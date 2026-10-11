/**
 * The page background per theme, as a raw value.
 *
 * This module deliberately has **no imports**. Build-time config needs these
 * values too — `vite.config.ts` bakes them into the manifest — and importing
 * `theme-context` there would pull React into the Vite config. Keep it
 * dependency-free so both the runtime and the build can read it.
 *
 * qotm has one theme ("Paper"), so both entries are the same. Must match
 * `--background` in `globals.css`.
 */
export const THEME_COLORS = {
	light: '#f4f2ed',
	dark: '#f4f2ed'
} as const;
