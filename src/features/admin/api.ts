import { baseApi } from '@/shared/api';
import type {
	AdminAuthorsData,
	AdminCurationData,
	AdminCurationResponse,
	AdminQuotesIdCurationData,
	AdminQuotesIdCurationResponse,
	AdminAuthorsResponse,
	AdminQueuesOldestResponse,
	AdminQuotesIdResponse,
	AdminQuotesIdUpdateData,
	AdminQuotesIdUpdateResponse,
	AdminQuotesIdVerificationData,
	AdminQuotesIdVerificationResponse,
	AdminVerificationData,
	AdminVerificationResponse,
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
		/** Canonical quotes waiting for a verifier, longest-waiting first. */
		adminVerification: build.query<AdminVerificationResponse, AdminVerificationData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/verification', params: params ?? undefined }),
			providesTags: ['AdminQueue']
		}),
		/** A quote in any status, with its history and notes (verifiers and admins). */
		adminQuote: build.query<AdminQuotesIdResponse, string>({
			query: (id) => `/v1/admin/quotes/${id}`,
			providesTags: (_r, _e, id) => [{ type: 'AdminQueue', id }]
		}),
		/** Verify, ask for evidence or reject (409: not in verification, author not linked, decided meanwhile). */
		verifyQuote: build.mutation<
			AdminQuotesIdVerificationResponse,
			{ id: string; body: AdminQuotesIdVerificationData['body'] }
		>({
			query: ({ id, body }) => ({ url: `/v1/admin/quotes/${id}/verification`, method: 'POST', body }),
			invalidatesTags: [...DECIDED]
		}),
		/** Correct the wording (kept as a Correction), link the author, set the source. */
		correctQuote: build.mutation<AdminQuotesIdUpdateResponse, { id: string; body: AdminQuotesIdUpdateData['body'] }>({
			query: ({ id, body }) => ({ url: `/v1/admin/quotes/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['AdminQueue']
		}),
		/** Authors, searched by name (for linking a quote's author). */
		adminAuthors: build.query<AdminAuthorsResponse, AdminAuthorsData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/authors', params: params ?? undefined }),
			providesTags: ['AdminAuthors']
		}),
		/** Verified quotes and community candidates waiting for a curator, with their signals. */
		adminCuration: build.query<AdminCurationResponse, AdminCurationData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/curation', params: params ?? undefined }),
			providesTags: ['AdminQueue']
		}),
		/** Curate (every checklist item ticked, no open report) or keep it out of the dataset (with a note). */
		curateQuote: build.mutation<AdminQuotesIdCurationResponse, { id: string; body: AdminQuotesIdCurationData['body'] }>(
			{
				query: ({ id, body }) => ({ url: `/v1/admin/quotes/${id}/curation`, method: 'POST', body }),
				invalidatesTags: [...DECIDED]
			}
		),
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
	useModerateSubmissionMutation,
	useAdminVerificationQuery,
	useAdminQuoteQuery,
	useVerifyQuoteMutation,
	useCorrectQuoteMutation,
	useAdminAuthorsQuery,
	useAdminCurationQuery,
	useCurateQuoteMutation
} = adminApi;
