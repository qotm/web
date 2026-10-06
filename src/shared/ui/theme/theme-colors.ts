/**
 * The page background per theme, as a raw value.
 *
 * This module deliberately has **no imports**. Build-time config needs these
 * values too — `apps/client/vite.config.ts` bakes them into the PWA manifest —
 * and importing `theme-context` there would pull React into the Vite config.
 * Keep it dependency-free so both the runtime and the build can read it.
 *
 * Must match `--background` in `globals.css` for each theme.
 */
export const THEME_COLORS = {
	light: '#eceee9',
	dark: '#0e0f0c'
} as const;
