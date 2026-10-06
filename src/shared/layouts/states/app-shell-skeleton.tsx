import { Logo, Skeleton } from '@/shared/ui';
import { PageSkeleton } from './page-skeleton';

/**
 * Full-page skeleton for the authenticated bootstrap (session resolving on reload).
 * Renders the real app-shell chrome — sidebar frame + brand + topbar — so the frame
 * appears instantly and only nav/content pulse, then hands off to the route's own
 * skeletons once the shell mounts. Route-agnostic content (used by Client + Admin).
 */
export function AppShellSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
				<div className="flex h-full flex-col gap-1 p-4">
					<div className="px-2 py-2">
						<Logo />
					</div>
					<div className="mt-1 flex flex-col gap-1">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="flex items-center gap-3 px-3 py-2.5">
								<Skeleton className="size-[18px] rounded-md" />
								<Skeleton className="h-3.5 w-24" />
							</div>
						))}
					</div>
				</div>
			</aside>

			{/* Main column */}
			<div className="flex min-h-screen flex-col lg:pl-64">
				<header className="sticky top-0 z-40 flex items-center gap-2.5 border-b border-border bg-card px-4 py-2.5">
					<Skeleton className="size-9 rounded-full lg:hidden" />
					<div className="flex-1" />
					<Skeleton className="size-9 rounded-full" />
				</header>
				<main className="flex-1">
					{/* Same content skeleton a route transition shows, so a reload and a
					    navigation look identical. */}
					<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
						<PageSkeleton />
					</div>
				</main>
			</div>
		</div>
	);
}
