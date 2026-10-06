import { PageSkeleton } from './page-skeleton';

/**
 * Suspense fallback for a lazily-loaded route.
 *
 * Rendered *inside* the app shell, so the sidebar and topbar stay mounted while
 * the route's chunk arrives — the user sees the app frame, not a blank page.
 *
 * **A skeleton, not a spinner.** A spinner here meant a navigation showed two
 * different loading languages back to back: spinner while the chunk downloaded,
 * then the route's own `Skeleton` blocks while its data loaded. Reusing
 * `PageSkeleton` — the same shape the authenticated bootstrap uses — makes the
 * whole sequence one continuous skeleton that the route's more specific one
 * replaces in kind.
 *
 * `role="status"` with a visually-hidden label keeps the state announced without
 * putting a second visible indicator on screen.
 */
export function RouteFallback({ label = 'Loading…' }: { label?: string }) {
	return (
		<div role="status" aria-busy="true">
			<span className="sr-only">{label}</span>
			<PageSkeleton />
		</div>
	);
}
