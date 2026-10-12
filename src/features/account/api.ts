import { baseApi } from '@/shared/api';
import type {
	AddEvidence,
	EditQuote,
	MeFavoritesData,
	MeFavoritesResponse,
	MeQuotesData,
	MeQuotesResponse,
	MeResponse,
	QuoteEntity,
	SubmitPrivate
} from '@/shared/types';

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
		/** One page of the member's own quotes (cursor), with the tab counts. */
		myQuotes: build.query<MeQuotesResponse, NonNullable<MeQuotesData['query']>>({
			query: ({ tab, cursor, limit }) =>
				`/v1/me/quotes?${new URLSearchParams({
					...(tab ? { tab } : {}),
					...(cursor ? { cursor } : {}),
					limit: String(limit ?? 10)
				})}`,
			providesTags: ['MyQuotes']
		}),
		editMyQuote: build.mutation<QuoteEntity, { id: string } & EditQuote>({
			query: ({ id, ...body }) => ({ url: `/v1/me/quotes/${id}`, method: 'PATCH', body }),
			invalidatesTags: ['MyQuotes']
		}),
		deleteMyQuote: build.mutation<unknown, string>({
			query: (id) => ({ url: `/v1/me/quotes/${id}`, method: 'DELETE' }),
			invalidatesTags: ['MyQuotes']
		}),
		/** A private quote, submitted as the member's own original. */
		submitPrivate: build.mutation<QuoteEntity, { id: string } & SubmitPrivate>({
			query: ({ id, ...body }) => ({ url: `/v1/me/quotes/${id}/submit`, method: 'POST', body }),
			invalidatesTags: ['MyQuotes', 'QuoteFeed']
		}),
		/** Answers a verifier's "needs evidence" with a source. */
		addEvidence: build.mutation<QuoteEntity, { id: string } & AddEvidence>({
			query: ({ id, ...body }) => ({ url: `/v1/submissions/${id}/evidence`, method: 'POST', body }),
			invalidatesTags: ['MyQuotes', 'AdminCounts']
		}),
		myFavoritesCount: build.query<number, void>({
			query: () => '/v1/me/favorites?limit=1',
			transformResponse: (r: MeFavoritesResponse) => r.total,
			providesTags: ['MyFavorites']
		})
	})
});

export const {
	useMeQuery,
	useMyQuotesCountQuery,
	useMyFavoritesCountQuery,
	useMyFavoritesQuery,
	useMyQuotesQuery,
	useEditMyQuoteMutation,
	useDeleteMyQuoteMutation,
	useSubmitPrivateMutation,
	useAddEvidenceMutation
} = accountApi;
