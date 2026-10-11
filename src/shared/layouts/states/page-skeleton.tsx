import { Card, Skeleton } from '@/shared/ui';

/**
 * Route-agnostic placeholder for a page's content: a heading, a card, then a
 * row of cards, in the kit's static hairline grey (no shimmer).
 *
 * The *only* generic loading shape in the app, shared by the session bootstrap
 * and route transitions, so a reload and a navigation look the same.
 */
export function PageSkeleton() {
	return (
		<div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
			<Skeleton block width={240} height={32} />
			<Card>
				<Skeleton block width="60%" height={20} />
				<div className="h-3" />
				<Skeleton lines={2} />
			</Card>
			<div className="grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i}>
						<Skeleton lines={3} />
					</Card>
				))}
			</div>
		</div>
	);
}
