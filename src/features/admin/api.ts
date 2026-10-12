import { baseApi } from '@/shared/api';
import type {
	AdminQueuesOldestResponse,
	AdminReleasesData,
	AdminReleasesPreviewResponse,
	AdminReleasesResponse,
	AdminStatsCountsResponse,
	AdminStatsResponse
} from '@/shared/types';

/** Refetch the sidebar's queue sizes this often (the API caches them for 30s). */
export const COUNTS_POLL_MS = 30_000;

export const adminApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		/** Queue sizes for the admin sidebar: any staff role may read them. */
		adminCounts: build.query<AdminStatsCountsResponse, void>({
			query: () => '/v1/admin/stats/counts',
			providesTags: ['AdminCounts']
		}),
		/** The dashboard: queues with their notes, 30-day corpus quality, community and CLI. */
		adminStats: build.query<AdminStatsResponse, void>({
			query: () => '/v1/admin/stats',
			providesTags: ['AdminStats']
		}),
		/** The longest-waiting items across the queues. */
		oldestInQueues: build.query<AdminQueuesOldestResponse, void>({
			query: () => '/v1/admin/queues/oldest',
			providesTags: ['AdminStats']
		}),
		/** The release in progress (`current`), whether a build runs, and the published ones. */
		adminReleases: build.query<AdminReleasesResponse, AdminReleasesData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/releases', params: params ?? undefined }),
			providesTags: ['AdminReleases']
		}),
		/** Queues a preview build of the release in progress (409 while one runs). */
		buildReleasePreview: build.mutation<AdminReleasesPreviewResponse, void>({
			query: () => ({ url: '/v1/admin/releases/preview', method: 'POST' }),
			invalidatesTags: ['AdminReleases']
		})
	})
});

export const {
	useAdminCountsQuery,
	useAdminStatsQuery,
	useOldestInQueuesQuery,
	useAdminReleasesQuery,
	useBuildReleasePreviewMutation
} = adminApi;
