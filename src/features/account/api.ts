import { baseApi } from '@/shared/api';
import type { MeFavoritesData, MeFavoritesResponse, MeQuotesResponse, MeResponse } from '@/shared/types';

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
		/** One page of the member's favorites, filtered and sorted. */
		myFavorites: build.query<MeFavoritesResponse, NonNullable<MeFavoritesData['query']>>({
			query: ({ q, sort, page, limit }) =>
				`/v1/me/favorites?${new URLSearchParams({
					...(q ? { q } : {}),
					...(sort ? { sort } : {}),
					page: String(page ?? 1),
					limit: String(limit ?? 20)
				})}`,
			providesTags: ['MyFavorites']
		}),
		myFavoritesCount: build.query<number, void>({
			query: () => '/v1/me/favorites?limit=1',
			transformResponse: (r: MeFavoritesResponse) => r.total,
			providesTags: ['MyFavorites']
		})
	})
});

export const { useMeQuery, useMyQuotesCountQuery, useMyFavoritesCountQuery, useMyFavoritesQuery } = accountApi;
