import { Skeleton } from '@/shared/ui';

/**
 * Route-agnostic placeholder for a page's content area: heading, a summary card,
 * then a card grid.
 *
 * Deliberately the *only* generic loading shape in the app, shared by the
 * authenticated bootstrap (`AppShellSkeleton`) and by route transitions
 * (`RouteFallback`). Keeping them identical means a reload and a navigation look
 * the same, and a route's own skeleton takes over from a shape it already
 * resembles rather than replacing a different kind of loading indicator.
 *
 * Renders no padding or max-width of its own — `AppShell`'s `<main>` already
 * supplies those, so this can drop straight into the content slot.
 */
export function PageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-8 w-48" />
			<div className="flex flex-col gap-5 rounded-3xl bg-card p-6">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-10 w-52" />
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex flex-col rounded-3xl bg-card p-5">
						<div className="flex items-start justify-between gap-2">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-3 w-14" />
						</div>
						<Skeleton className="mt-3 h-7 w-32" />
						<Skeleton className="mt-2 h-3 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}
