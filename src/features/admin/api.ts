import { baseApi } from '@/shared/api';
import type { AdminStatsCountsResponse } from '@/shared/types';

/** Refetch the sidebar's queue sizes this often (the API caches them for 30s). */
export const COUNTS_POLL_MS = 30_000;

export const adminApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		/** Queue sizes for the admin sidebar: any staff role may read them. */
		adminCounts: build.query<AdminStatsCountsResponse, void>({
			query: () => '/v1/admin/stats/counts',
			providesTags: ['AdminCounts']
		})
	})
});

export const { useAdminCountsQuery } = adminApi;
