import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { getApiBaseUrl, notifyUnauthorized } from './config';

const rawBaseQuery = fetchBaseQuery({
	baseUrl: '',
	credentials: 'include'
});

/**
 * Shared base query: sends the Better Auth session cookie (credentials:'include'),
 * prefixes the configured API base URL, and routes 401s to the app's re-auth
 * handler (registered via configureApi) — the single chokepoint for session expiry.
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extraOptions
) => {
	const base = getApiBaseUrl();
	const withBase = typeof args === 'string' ? `${base}${args}` : { ...args, url: `${base}${args.url}` };

	const result = await rawBaseQuery(withBase, api, extraOptions);

	if (result.error && result.error.status === 401) {
		notifyUnauthorized();
	}

	return result;
};
