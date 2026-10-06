import { createContext } from 'react';
import { BRAND } from './brand';

/**
 * Per-app title suffix, declared once by `MetaProvider` so routes supply only
 * their own segment. Admin uses a different brand string, which is exactly why
 * this is context and not a constant.
 */
export type MetaConfig = {
	/** Appended after a separator, e.g. `Qotm Web`. */
	suffix: string;
	/** Separator between the page segment and the suffix. */
	separator: string;
};

export const DEFAULT_META: MetaConfig = {
	suffix: BRAND.name,
	separator: ' · '
};

export const MetaContext = createContext<MetaConfig>(DEFAULT_META);

/** `About` + `Qotm Web` -> `About · Qotm Web`. */
export function formatTitle(segment: string, config: MetaConfig): string {
	const trimmed = segment.trim();
	if (!trimmed) return config.suffix;
	// Don't double up when a segment already carries the brand.
	if (trimmed === config.suffix) return trimmed;
	return `${trimmed}${config.separator}${config.suffix}`;
}
