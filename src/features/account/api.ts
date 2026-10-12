import { baseApi } from '@/shared/api';
import type { MeFavoritesResponse, MeQuotesResponse, MeResponse } from '@/shared/types';

/** The signed-in member: their profile and the counts the header's menu shows. */
export const accountApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		me: build.query<MeResponse, void>({
			query: () => '/v1/me',
			providesTags: ['Me']
		}),
		/** Only `tabs.all` is read: one row keeps it cheap. */
		myQuotesCount: build.query<number, void>({
			query: () => '/v1/me/quotes?limit=1',
			transformResponse: (r: MeQuotesResponse) => r.tabs.all,
			providesTags: ['MyQuotes']
		}),
		myFavoritesCount: build.query<number, void>({
			query: () => '/v1/me/favorites?limit=1',
			transformResponse: (r: MeFavoritesResponse) => r.total,
			providesTags: ['MyFavorites']
		})
	})
});

export const { useMeQuery, useMyQuotesCountQuery, useMyFavoritesCountQuery } = accountApi;
