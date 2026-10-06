import type { ReactNode } from 'react';
import { Outlet } from 'react-router';

type MarketingLayoutProps = {
	/** Sticky header slot (brand, nav, auth CTAs). */
	header?: ReactNode;
	/** Footer slot (link columns, legal, newsletter). */
	footer?: ReactNode;
	/** Page content. Defaults to the router <Outlet /> when omitted. */
	children?: ReactNode;
};

/**
 * Shared shell for the public marketing site (landing) and its legal pages: a
 * header slot, the routed page content, and a footer slot — defined once so
 * nav and footer aren't rebuilt per route. Presentational only, like
 * `AppShell`: no data fetching, no router coupling beyond the `Outlet`
 * fallback, and no Suspense of its own — that's the consumer's job, same as
 * `AppShell` leaves it to `ClientShell`.
 */
export function MarketingLayout({ header, footer, children }: MarketingLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			{header}
			<main className="flex-1">{children ?? <Outlet />}</main>
			{footer}
		</div>
	);
}
