import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './base-query';

/**
 * The single shared RTK Query API. Feature endpoint slices extend it via
 * `baseApi.injectEndpoints(...)` (code-split per feature), and realtime socket
 * events feed cache updates through `baseApi.util.updateQueryData` / `invalidateTags`.
 */
export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: baseQueryWithReauth,
	tagTypes: [
		// Cache tags, one per resource kind. A query lists what it `provides`, a
		// mutation lists what it `invalidates`, and RTK Query refetches the
		// intersection — so these names are the whole invalidation contract.
		//
		// One flat namespace shared by every feature slice: two features that both
		// invent `Items` will invalidate each other's caches, silently. Add yours
		// here rather than locally, and keep them specific.
		'CurrentUser',
		'Sessions',
		// The signed-in member's own records (header counts, settings, lists).
		'Me',
		'MyQuotes',
		'MyFavorites',
		// The public quotes: feeds (every feed, author and topic list) and one quote.
		'QuoteFeed',
		'Quote',
		'Topics',
		'Release',
		// Public profiles, their contributions and stats.
		'Profile',
		// The admin console: the sidebar's queue sizes.
		'AdminCounts'
	],
	endpoints: () => ({})
});
