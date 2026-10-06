import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureApi } from '@/shared/api';
import { AuthProvider, configureAuth, redirectToLogin } from '@/shared/auth';
import { MetaProvider, ThemeProvider, Toaster, installZodErrorMap } from '@/shared/ui';
import { API_URL } from '@/lib/env';
import { appPath } from '@/lib/paths';
import { store } from './store';

// Wired at module scope, before anything renders. The first thing this app does
// is ask the backend who the user is, and doing this in an effect would put that
// request behind a render pass for no gain.
configureApi({ baseUrl: API_URL, onUnauthorized: () => redirectToLogin() });
configureAuth({
	authApiBaseUrl: `${API_URL}/auth`,
	// `trustedOrigins` is left to its default of this app's own origin — one
	// deployment, one origin. Add to it only for a deliberate hand-off elsewhere;
	// every entry is a URL an attacker may put in `?redirect=`.
	defaultRedirect: appPath()
});
installZodErrorMap();

export function Providers({ children }: { children: ReactNode }) {
	return (
		// ThemeProvider above the Redux Provider: it only touches the document
		// (`dark` class, color-scheme, theme-color meta) and must not re-render
		// through the store.
		<ThemeProvider>
			<MetaProvider>
				<Provider store={store}>
					<AuthProvider>
						{children}
						<Toaster />
					</AuthProvider>
				</Provider>
			</MetaProvider>
		</ThemeProvider>
	);
}
