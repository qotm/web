import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { MeFavoritesData } from '@/shared/types';
import {
	Button,
	CommandBlock,
	Eyebrow,
	PageMeta,
	Pagination,
	QuoteCard,
	SearchField,
	Select,
	notify,
	type QuoteAction
} from '@/shared/ui';
import { useMyFavoritesQuery } from '@/features/account/api';
import { track } from '@/shared/analytics';
import { useReactMutation } from '@/features/quotes/api';
import { useQuoteActions } from '@/features/quotes/use-quote-actions';

type Sort = NonNullable<NonNullable<MeFavoritesData['query']>['sort']>;
const SORTS: { value: Sort; label: string }[] = [
	{ value: 'recent', label: 'Recently saved' },
	{ value: 'author', label: 'Author A–Z' },
	{ value: 'likes', label: 'Most liked' }
];
const PAGE = 20;

function FavoritesPage({
	q,
	sort,
	page,
	last,
	onMore,
	onAction
}: {
	q: string;
	sort: Sort;
	page: number;
	last: boolean;
	onMore: () => void;
	onAction: (id: string) => (action: QuoteAction, on?: boolean) => void;
}) {
	const { data, isFetching } = useMyFavoritesQuery({ q: q || undefined, sort, page, limit: PAGE });
	if (!data) return null;
	return (
		<>
			{data.list.map((f) => (
				<QuoteCard key={f.id} quote={f} variant="compact" onAction={onAction(f.id)} />
			))}
			{last && data.currentPage < data.lastPage ? (
				<div className="col-span-full">
					<Pagination mode="more" loading={isFetching} onPage={onMore} />
				</div>
			) : null}
		</>
	);
}

/**
 * The member's favorites (artboard Favorites): the count and the terminal
 * commands that read them, a filter and a sort (in the URL), two columns of
 * compact cards loading more, and unfavoriting with an undo.
 */
export function FavoritesRoute() {
	const [params, setParams] = useSearchParams();
	const q = params.get('q') ?? '';
	const sort: Sort = SORTS.find((s) => s.value === params.get('sort'))?.value ?? 'recent';
	const key = `${q}|${sort}`;
	const [loaded, setLoaded] = useState<{ key: string; pages: number }>({ key, pages: 1 });
	const pages = loaded.key === key ? loaded.pages : 1;
	const first = useMyFavoritesQuery({ q: q || undefined, sort, page: 1, limit: PAGE });
	const [react] = useReactMutation();
	const act = useQuoteActions();

	const set = (k: string, v: string) => {
		const next = new URLSearchParams(params);
		if (v) next.set(k, v);
		else next.delete(k);
		setParams(next, { replace: true });
	};
	const onAction = (id: string) => (action: QuoteAction, on?: boolean) => {
		if (action !== 'favorite' || on) return act(id)(action, on);
		void react({ id, reaction: 'favorite', on: false })
			.unwrap()
			.then(() => {
				track('quote_reacted', { reaction: 'favorite', on: false });
				notify('Removed from favorites.', {
					action: 'undo',
					onAction: () => void react({ id, reaction: 'favorite', on: true })
				});
			})
			.catch(() => notify('That did not save. Try again.'));
	};
	const total = first.data?.total;

	return (
		<div className="flex flex-col gap-card-y pt-10 pb-14">
			<PageMeta title="Favorites" robots="noindex" />
			<header className="flex flex-wrap items-end justify-between gap-page">
				<div>
					<Eyebrow>Your library</Eyebrow>
					<h1 className="m-0 mb-2.5 text-h1">Favorites.</h1>
					<p className="m-0 text-muted-foreground">
						{total === undefined
							? 'They sync to every terminal you’ve signed in on.'
							: `${total.toLocaleString('en-US')} ${total === 1 ? 'quote' : 'quotes'}. They sync to every terminal you’ve signed in on.`}
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<CommandBlock command="qotm --favorites" />
					<CommandBlock tone="light" command="qotm favorites" />
				</div>
			</header>
			<div className="flex flex-wrap items-end gap-3">
				<SearchField
					size="sm"
					placeholder="Filter favorites"
					shortcut={null}
					aria-label="Filter favorites"
					defaultValue={q}
					onSubmit={(v) => set('q', v.trim())}
					onChange={(e) => {
						if (!e.target.value) set('q', '');
					}}
					className="w-[280px] narrow:w-full"
				/>
				<Select
					size="sm"
					aria-label="Sort"
					value={sort}
					onChange={(e) => set('sort', e.target.value === 'recent' ? '' : e.target.value)}
					options={SORTS}
					className="w-[200px]"
				/>
			</div>
			{first.isLoading ? (
				<PageSkeleton />
			) : first.isError ? (
				<StateScreen compact title="Your favorites did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void first.refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !total ? (
				q ? (
					<Empty
						title={`No favorites match “${q}”.`}
						action={
							<Button variant="outline" size="sm" onClick={() => set('q', '')}>
								Clear the filter
							</Button>
						}
					/>
				) : (
					<Empty
						title="No favorites yet."
						description="Press ☆ on any quote, or run qotm save in your terminal."
						command="qotm save"
					/>
				)
			) : (
				<div className="grid grid-cols-2 items-start gap-grid narrow:grid-cols-1">
					{Array.from({ length: pages }, (_, i) => (
						<FavoritesPage
							key={i}
							q={q}
							sort={sort}
							page={i + 1}
							last={i === pages - 1}
							onMore={() => setLoaded({ key, pages: pages + 1 })}
							onAction={onAction}
						/>
					))}
				</div>
			)}
		</div>
	);
}
