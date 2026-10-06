import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
	ThemeContext,
	THEME_STORAGE_KEY,
	applyTheme,
	isThemeMode,
	readStoredMode,
	type ResolvedTheme,
	type ThemeMode
} from './theme-context';

const QUERY = '(prefers-color-scheme: dark)';

function systemTheme(): ResolvedTheme {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

function resolve(mode: ThemeMode): ResolvedTheme {
	return mode === 'system' ? systemTheme() : mode;
}

/**
 * Theme provider for every app. Wrap the app root once, above the router.
 *
 * The initial class is set by the inline snippet in `index.html` (see
 * `themeInitScript`) so there is no flash of the wrong theme before React
 * mounts; this provider then takes over and keeps the DOM in sync.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
	const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readStoredMode()));

	const setMode = useCallback((next: ThemeMode) => {
		setModeState(next);
		const nextResolved = resolve(next);
		setResolved(nextResolved);
		applyTheme(nextResolved);
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Private mode / storage disabled — the theme still applies for this session.
		}
	}, []);

	// Follow the OS while in `system` mode.
	useEffect(() => {
		if (mode !== 'system') return;
		const media = window.matchMedia(QUERY);
		const sync = () => {
			const next: ResolvedTheme = media.matches ? 'dark' : 'light';
			setResolved(next);
			applyTheme(next);
		};

		media.addEventListener('change', sync);

		// The `change` event alone is not enough for an installed PWA. It can sit
		// frozen for days, and the OS flipping theme while it is backgrounded — an
		// automatic sunset switch, typically — delivers no event, so the app resumes
		// on the stale theme until a full reload. A browser tab hides this because it
		// gets navigated and discarded far more often. Re-read on resume as well;
		// `pageshow` additionally covers a back/forward-cache restore.
		const onVisible = () => {
			if (document.visibilityState === 'visible') sync();
		};
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('pageshow', sync);

		return () => {
			media.removeEventListener('change', sync);
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('pageshow', sync);
		};
	}, [mode]);

	// Keep other tabs of the same app in step.
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== THEME_STORAGE_KEY || !isThemeMode(event.newValue)) return;
			setModeState(event.newValue);
			const next = resolve(event.newValue);
			setResolved(next);
			applyTheme(next);
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	const value = useMemo(
		() => ({
			mode,
			resolved,
			setMode,
			toggle: () => setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light')
		}),
		[mode, resolved, setMode]
	);

	return <ThemeContext value={value}>{children}</ThemeContext>;
}
