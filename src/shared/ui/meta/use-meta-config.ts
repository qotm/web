import { useContext } from 'react';
import { MetaContext } from './meta-context';

/**
 * The app's title template. Falls back to the un-suffixed default rather than
 * throwing, so a component rendering `PageMeta` outside a `MetaProvider` still
 * produces a usable title instead of blanking the tab.
 */
export function useMetaConfig() {
	return useContext(MetaContext);
}
