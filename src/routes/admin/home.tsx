import { PageMeta } from '@/shared/ui';

/**
 * The console's landing page.
 *
 * Everything under `/admin` renders behind `RoleRoute`, so this file can assume
 * an admin is reading it — but nothing here may *rely* on that for safety. The
 * guard hides the UI; the API decides what the data is.
 */
export function AdminHomeRoute() {
	return (
		<>
			<PageMeta title="Admin" robots="noindex" />
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">Admin</h1>
				<p className="text-muted-foreground">
					Role-gated section. Add console pages as children of the <code className="mx-1">/admin</code> route in
					<code className="mx-1">app/router.tsx</code> and a matching entry in
					<code className="mx-1">ADMIN_NAV_ITEMS</code>.
				</p>
			</div>
		</>
	);
}
