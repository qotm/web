import { baseApi } from '@/shared/api';
import type {
	AdminAuditActionsResponse,
	AdminAuditData,
	AdminAuditResponse,
	AdminUsersData,
	AdminUsersIdRoleData,
	AdminUsersIdRoleResponse,
	AdminUsersResponse,
	AdminAuthorsCreateData,
	AdminAuthorsCreateResponse,
	AdminAuthorsIdData,
	AdminAuthorsIdResponse,
	AdminSourcesCreateData,
	AdminSourcesCreateResponse,
	AdminSourcesData,
	AdminSourcesIdData,
	AdminSourcesIdResponse,
	AdminSourcesResponse,
	AdminTopicsCreateData,
	AdminTopicsCreateResponse,
	AdminTopicsData,
	AdminTopicsIdData,
	AdminTopicsIdResponse,
	AdminTopicsResponse,
	AdminAuthorsData,
	AdminCurationData,
	AdminExportsIdResponse,
	AdminQuotesData,
	AdminQuotesExportData,
	AdminQuotesExportResponse,
	AdminQuotesBulkTopicData,
	AdminQuotesBulkTopicResponse,
	AdminQuotesBulkWithdrawData,
	AdminQuotesBulkWithdrawResponse,
	AdminQuotesResponse,
	AdminReportsData,
	AdminReportsIdDecisionData,
	AdminReportsIdDecisionResponse,
	AdminReportsResponse,
	AdminCurationResponse,
	AdminQuotesIdCurationData,
	AdminQuotesIdCurationResponse,
	AdminQuotesIdNominationData,
	AdminQuotesIdNominationResponse,
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
	AdminReleasesVersionPublishResponse,
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
		/** Add an author (audited; 409 when the slug is taken). */
		createAuthor: build.mutation<AdminAuthorsCreateResponse, AdminAuthorsCreateData['body']>({
			query: (body) => ({ url: '/v1/admin/authors', method: 'POST', body }),
			invalidatesTags: ['AdminAuthors']
		}),
		updateAuthor: build.mutation<AdminAuthorsIdResponse, { id: string; body: AdminAuthorsIdData['body'] }>({
			query: ({ id, body }) => ({ url: `/v1/admin/authors/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['AdminAuthors']
		}),
		/** Sources quotes are verified against, searched by title. */
		adminSources: build.query<AdminSourcesResponse, AdminSourcesData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/sources', params: params ?? undefined }),
			providesTags: ['AdminSources']
		}),
		createSource: build.mutation<AdminSourcesCreateResponse, AdminSourcesCreateData['body']>({
			query: (body) => ({ url: '/v1/admin/sources', method: 'POST', body }),
			invalidatesTags: ['AdminSources']
		}),
		updateSource: build.mutation<AdminSourcesIdResponse, { id: string; body: AdminSourcesIdData['body'] }>({
			query: ({ id, body }) => ({ url: `/v1/admin/sources/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['AdminSources']
		}),
		/** The controlled topic list, with how many quotes (and curated ones) each has. */
		adminTopics: build.query<AdminTopicsResponse, AdminTopicsData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/topics', params: params ?? undefined }),
			providesTags: ['AdminTopics']
		}),
		createTopic: build.mutation<AdminTopicsCreateResponse, AdminTopicsCreateData['body']>({
			query: (body) => ({ url: '/v1/admin/topics', method: 'POST', body }),
			invalidatesTags: ['AdminTopics', 'Topics']
		}),
		updateTopic: build.mutation<AdminTopicsIdResponse, { id: string; body: AdminTopicsIdData['body'] }>({
			query: ({ id, body }) => ({ url: `/v1/admin/topics/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['AdminTopics', 'Topics']
		}),
		/** Members and staff, by handle, name or email and by role. */
		adminUsers: build.query<AdminUsersResponse, AdminUsersData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/users', params: params ?? undefined }),
			providesTags: ['AdminUsers']
		}),
		/** Assign a role (409: the superuser's, or demoting the last admin). */
		setUserRole: build.mutation<AdminUsersIdRoleResponse, { id: string; role: AdminUsersIdRoleData['body']['role'] }>({
			query: ({ id, role }) => ({ url: `/v1/admin/users/${id}/role`, method: 'PATCH', body: { role } }),
			invalidatesTags: ['AdminUsers']
		}),
		/** The audit log, newest first, searched (actor, action, target, note) and filtered by action. */
		adminAudit: build.query<AdminAuditResponse, AdminAuditData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/audit', params: params ?? undefined }),
			providesTags: ['AdminAudit']
		}),
		/** Every action the log records, with its label, for the filter. */
		auditActions: build.query<AdminAuditActionsResponse, void>({
			query: () => '/v1/admin/audit/actions'
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
		/** A curator puts a published community original forward for curation, whatever its recommends. */
		nominateQuote: build.mutation<
			AdminQuotesIdNominationResponse,
			{ id: string; body: AdminQuotesIdNominationData['body'] }
		>({
			query: ({ id, body }) => ({ url: `/v1/admin/quotes/${id}/nomination`, method: 'POST', body }),
			invalidatesTags: [...DECIDED]
		}),
		/** Reports for the moderators: open ones oldest first, or resolved ones newest first. */
		adminReports: build.query<AdminReportsResponse, AdminReportsData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/reports', params: params ?? undefined }),
			providesTags: ['AdminQueue']
		}),
		/** Dismiss, mark the quote disputed, or withdraw it (resolving every open report on it). */
		decideReport: build.mutation<
			AdminReportsIdDecisionResponse,
			{ id: string; body: AdminReportsIdDecisionData['body'] }
		>({
			query: ({ id, body }) => ({ url: `/v1/admin/reports/${id}/decision`, method: 'POST', body }),
			invalidatesTags: [...DECIDED]
		}),
		/** Queues the publish of a built preview; the admin confirms reviewing it (409: no preview, or a build running). */
		publishRelease: build.mutation<AdminReleasesVersionPublishResponse, string>({
			query: (version) => ({
				url: `/v1/admin/releases/${version}/publish`,
				method: 'POST',
				body: { reviewed: true }
			}),
			invalidatesTags: ['AdminReleases', 'AdminStats', 'Release']
		}),
		/** Every public quote, searched and filtered, with the public and release-eligible counts. */
		adminQuotes: build.query<AdminQuotesResponse, AdminQuotesData['query'] | void>({
			query: (params) => ({ url: '/v1/admin/quotes', params: params ?? undefined }),
			providesTags: ['AdminQueue']
		}),
		/** Queues a CSV export of the filtered list; poll exportStatus for it. */
		exportQuotes: build.mutation<AdminQuotesExportResponse, AdminQuotesExportData['body']>({
			query: (body) => ({ url: '/v1/admin/quotes/export', method: 'POST', body })
		}),
		/** Withdraws the selected quotes, each with the note; skipped ones say why. */
		bulkWithdraw: build.mutation<AdminQuotesBulkWithdrawResponse, AdminQuotesBulkWithdrawData['body']>({
			query: (body) => ({ url: '/v1/admin/quotes/bulk/withdraw', method: 'POST', body }),
			invalidatesTags: [...DECIDED]
		}),
		/** Adds a topic to the selected quotes, or takes it off them. */
		bulkTopic: build.mutation<AdminQuotesBulkTopicResponse, AdminQuotesBulkTopicData['body']>({
			query: (body) => ({ url: '/v1/admin/quotes/bulk/topic', method: 'POST', body }),
			invalidatesTags: ['AdminQueue']
		}),
		/** An export's progress: waiting, running, ready (rows, bytes) or failed. */
		exportStatus: build.query<AdminExportsIdResponse, string>({
			query: (id) => `/v1/admin/exports/${id}`
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
	useModerateSubmissionMutation,
	useAdminVerificationQuery,
	useAdminQuoteQuery,
	useVerifyQuoteMutation,
	useCorrectQuoteMutation,
	useAdminAuthorsQuery,
	useAdminCurationQuery,
	useCurateQuoteMutation,
	useNominateQuoteMutation,
	useAdminReportsQuery,
	useDecideReportMutation,
	usePublishReleaseMutation,
	useAdminQuotesQuery,
	useExportQuotesMutation,
	useBulkWithdrawMutation,
	useBulkTopicMutation,
	useExportStatusQuery,
	useCreateAuthorMutation,
	useUpdateAuthorMutation,
	useAdminSourcesQuery,
	useCreateSourceMutation,
	useUpdateSourceMutation,
	useAdminTopicsQuery,
	useCreateTopicMutation,
	useUpdateTopicMutation,
	useAdminUsersQuery,
	useSetUserRoleMutation,
	useAdminAuditQuery,
	useAuditActionsQuery
} = adminApi;
