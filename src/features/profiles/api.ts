import { baseApi } from '@/shared/api';
import type {
	UsersHandleContributionsResponse,
	UsersHandleFavoritesResponse,
	UsersHandleResponse,
	UsersHandleStatsResponse
} from '@/shared/types';

/** A member's public profile. An old handle 301s to the current one, which `handle` then reports. */
export const profilesApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		profile: build.query<UsersHandleResponse, string>({
			query: (handle) => `/v1/users/${handle}`,
			providesTags: ['Profile']
		}),
		contributions: build.query<UsersHandleContributionsResponse, { handle: string; page: number; limit: number }>({
			query: ({ handle, page, limit }) => `/v1/users/${handle}/contributions?page=${page}&limit=${limit}`,
			providesTags: ['Profile']
		}),
		contributionStats: build.query<UsersHandleStatsResponse, string>({
			query: (handle) => `/v1/users/${handle}/stats`,
			providesTags: ['Profile']
		}),
		/** Only when the member made their favorites public (else 404). */
		profileFavorites: build.query<UsersHandleFavoritesResponse, string>({
			query: (handle) => `/v1/users/${handle}/favorites`,
			providesTags: ['Profile', 'MyFavorites']
		})
	})
});

export const { useProfileQuery, useContributionsQuery, useContributionStatsQuery, useProfileFavoritesQuery } =
	profilesApi;
