import { createContext } from 'react';
import { THEME_COLORS } from './theme-colors';

/** What the user chose. `system` follows the OS and keeps following it. */
export type ThemeMode = 'system' | 'light' | 'dark';
/** What is actually on screen once `system` is resolved. */
export type ResolvedTheme = 'light' | 'dark';

export type ThemeContextValue = {
	mode: ThemeMode;
	resolved: ResolvedTheme;
	setMode: (mode: ThemeMode) => void;
	/** Cycles light → dark → system. */
	toggle: () => void;
};

/**
 * Shared across every app. Kept in its own module (no components) so the
 * provider and the hook can live in separate files without tripping
 * `react-refresh/only-export-components`.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** localStorage key. Per-origin, so each app remembers its own choice. */
export const THEME_STORAGE_KEY = 'qotm-web-theme';

/**
 * Re-exported so consumers keep importing theme colours from one place. The
 * values live in `theme-colors.ts`, which has no imports so the Vite config can
 * read them at build time (see the PWA manifest in `apps/client/vite.config.ts`).
 */
export { THEME_COLORS };

export function isThemeMode(value: unknown): value is ThemeMode {
	return value === 'system' || value === 'light' || value === 'dark';
}

/** Read the stored preference. Safe on the server and in private-mode browsers. */
export function readStoredMode(): ThemeMode {
	if (typeof window === 'undefined') return 'system';
	try {
		const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
		return isThemeMode(stored) ? stored : 'system';
	} catch {
		return 'system';
	}
}

/**
 * Apply a resolved theme to the document: the `dark` class that Tailwind's
 * `@custom-variant dark` keys off, `color-scheme` so native scrollbars, form
 * controls and autofill follow, and the PWA status-bar colour.
 */
export function applyTheme(resolved: ResolvedTheme): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	root.classList.toggle('dark', resolved === 'dark');
	root.style.colorScheme = resolved;
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}
