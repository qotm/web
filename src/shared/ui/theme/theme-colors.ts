/**
 * The page background, as a raw value: the `theme-color` meta, the `<html>`
 * background before the stylesheet lands, and the PWA manifest.
 *
 * This module deliberately has **no imports**: `vite.config.ts` reads it at
 * build time. qotm has one theme ("Paper"); this must match `--background`
 * in `globals.css`.
 */
export const THEME_COLOR = '#f4f2ed';
