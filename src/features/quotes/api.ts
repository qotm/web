import { baseApi } from '@/shared/api';
import type {
	QuoteCardEntity,
	QuotesData,
	QuotesResponse,
	ReactionEntity,
	ReleasesCurrentResponse,
	TopicsResponse
} from '@/shared/types';

export type FeedArgs = NonNullable<QuotesData['query']>;
export type Reaction = 'like' | 'favorite' | 'recommend';

/** Each reaction's endpoint, count and viewer flag. */
const REACTIONS = {
	like: { path: 'like', count: 'likes', flag: 'liked' },
	favorite: { path: 'favorite', count: 'favorites', flag: 'favorited' },
	recommend: { path: 'recommendation', count: 'recommends', flag: 'recommended' }
} as const;

const query = (args: FeedArgs) =>
	new URLSearchParams(
		Object.entries(args).flatMap(([k, v]) => (v === undefined || v === '' ? [] : [[k, String(v)]]))
	).toString();

/** Applies a reaction to a card (its count and the viewer's flag). */
function react(card: QuoteCardEntity, reaction: Reaction, on: boolean, count?: number) {
	const r = REACTIONS[reaction];
	const was = card.viewer?.[r.flag] ?? false;
	card.viewer = { liked: false, favorited: false, recommended: false, ...card.viewer, [r.flag]: on };
	card.counts[r.count] = count ?? Math.max(0, card.counts[r.count] + (on === was ? 0 : on ? 1 : -1));
}

export const quotesApi = baseApi.injectEndpoints({
	endpoints: (build) => ({
		/** One page of a feed (`nextCursor` loads the next). */
		quoteFeed: build.query<QuotesResponse, FeedArgs>({
			query: (args) => `/v1/quotes?${query(args)}`,
			providesTags: ['QuoteFeed']
		}),
		topics: build.query<TopicsResponse, void>({
			query: () => '/v1/topics',
			providesTags: ['Topics']
		}),
		/** The release the CLI ships; null before the first one. */
		currentRelease: build.query<ReleasesCurrentResponse | null, void>({
			queryFn: async (_arg, _api, _extra, baseQuery) => {
				const res = await baseQuery('/v1/releases/current');
				if (res.error?.status === 404) return { data: null };
				return res.error ? { error: res.error } : { data: res.data as ReleasesCurrentResponse };
			},
			providesTags: ['Release']
		}),
		/**
		 * Likes, favorites or recommends a quote, or takes it back. Every cached
		 * feed page showing the quote changes at once and changes back if the
		 * API refuses; the API's count then replaces the guess.
		 */
		react: build.mutation<ReactionEntity, { id: string; reaction: Reaction; on: boolean }>({
			query: ({ id, reaction, on }) => ({
				url: `/v1/quotes/${id}/${REACTIONS[reaction].path}`,
				method: on ? 'POST' : 'DELETE'
			}),
			async onQueryStarted({ id, reaction, on }, { dispatch, getState, queryFulfilled }) {
				const patch = (count?: number) =>
					quotesApi.util.selectCachedArgsForQuery(getState(), 'quoteFeed').map((args) =>
						dispatch(
							quotesApi.util.updateQueryData('quoteFeed', args, (page) => {
								const card = page.list.find((q) => q.id === id);
								if (card) react(card, reaction, on, count);
							})
						)
					);
				const optimistic = patch();
				try {
					const { data } = await queryFulfilled;
					patch(data.count);
				} catch {
					for (const p of optimistic) p.undo();
				}
			},
			invalidatesTags: (_r, _e, { reaction }) => (reaction === 'favorite' ? ['MyFavorites'] : [])
		})
	})
});

export const { useQuoteFeedQuery, useTopicsQuery, useCurrentReleaseQuery, useReactMutation } = quotesApi;
export { react as applyReaction };
