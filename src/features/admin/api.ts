import { baseApi } from '@/shared/api';
import type {
	AdminQueuesOldestResponse,
	AdminReleasesData,
	AdminReleasesPreviewResponse,
	AdminReleasesResponse,
	AdminStatsCountsResponse,
	AdminStatsResponse,
	AdminSubmissionsData,
	AdminSubmissionsIdDecisionData,
	AdminSubmissionsIdDecisionResponse,
	AdminSubmissionsResponse
} from '@/shared/types';

/** A decision moves an item out of its queue: refresh the queues, the sidebar and the dashboard. */
const DECIDED = ['AdminQueue', 'AdminCounts', 'AdminStats'] as const;

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
		/** Originals the originality check held, and canonical quotes nobody has picked up. */
		adminSubmissions: build.query<AdminSubmissionsResponse, AdminSubmissionsData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/submissions', params: params ?? undefined }),
			providesTags: ['AdminQueue']
		}),
		/** A moderator's publish / mark disputed / withdraw on a held original (409 once decided). */
		moderateSubmission: build.mutation<
			AdminSubmissionsIdDecisionResponse,
			{ id: string; body: AdminSubmissionsIdDecisionData['body'] }
		>({
			query: ({ id, body }) => ({ url: `/v1/admin/submissions/${id}/decision`, method: 'POST', body }),
			invalidatesTags: [...DECIDED]
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
	useBuildReleasePreviewMutation,
	useAdminSubmissionsQuery,
	useModerateSubmissionMutation
} = adminApi;
