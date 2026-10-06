import { useMemo, type ReactNode } from 'react';
import { DEFAULT_META, MetaContext, type MetaConfig } from './meta-context';

/**
 * Declares the app's title template once, so routes supply only their own
 * segment. Wrap the app root, above the router.
 *
 * ```tsx
 * <MetaProvider suffix="Qotm Web Admin">
 * ```
 */
export function MetaProvider({
	children,
	suffix = DEFAULT_META.suffix,
	separator = DEFAULT_META.separator
}: {
	children: ReactNode;
	suffix?: string;
	separator?: string;
}) {
	const value = useMemo<MetaConfig>(() => ({ suffix, separator }), [suffix, separator]);

	return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}
