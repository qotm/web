import { baseApi } from '@/shared/api';
import type { MatchQuote, QuotesMatchResponse, SubmissionsCreateResponse, SubmitQuote } from '@/shared/types';

export const submissionsApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		/** The closest existing quote to some words (exact, then fuzzy). */
		matchQuote: build.query<QuotesMatchResponse, MatchQuote>({
			query: (body) => ({ url: '/v1/quotes/match', method: 'POST', body })
		}),
		/** Submit (canonical, original) or keep (private) a quote. */
		submitQuote: build.mutation<SubmissionsCreateResponse, SubmitQuote>({
			query: (body) => ({ url: '/v1/submissions', method: 'POST', body }),
			invalidatesTags: ['MyQuotes', 'QuoteFeed', 'AdminCounts']
		})
	})
});

export const { useMatchQuoteQuery, useSubmitQuoteMutation } = submissionsApi;
