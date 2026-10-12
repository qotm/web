import { Home } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import type { NavItem } from '@/shared/layouts';
import type { FooterColumn, SiteNavItem } from '@/shared/ui';
import { appPath, paths } from '@/lib/paths';
import { ADMIN_BASE } from '@/lib/paths';

/**
 * Drives the app shell's navigation. Keep it in step with `router.tsx` — the
 * shell derives the sidebar from this list, not from the router, so a route
 * added in one place and not the other is simply unreachable or dead.
 *
 * Paths come from `appPath` rather than being written out, because the app's
 * mount point moves when the marketing site is included. `icon` is a rendered
 * element, not a component reference.
 */
/**
 * The console's own nav. Separate from `NAV_ITEMS` on purpose: the admin section
 * is a different branch of the router behind a different guard, and mixing an
 * admin link into the member sidebar would render it for members too — a link
 * that 403s is a worse answer than no link.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
	{ to: ADMIN_BASE, label: 'Overview', icon: <ShieldCheck className="size-4" />, end: true },
	{ to: appPath(), label: 'View site', icon: <Home className="size-4" /> }
];

/** The site header's primary nav (artboard Header). */
export const SITE_NAV: SiteNavItem[] = [
	{ id: 'discover', label: 'discover', to: paths.discover },
	{ id: 'latest', label: 'latest', to: paths.latest },
	{ id: 'curated', label: 'curated', to: paths.curated },
	{ id: 'topics', label: 'topics', to: paths.topics }
];

/** The site footer's columns (artboard Footer). */
export const FOOTER_COLUMNS: FooterColumn[] = [
	{
		title: 'Read',
		links: [
			{ id: 'd', label: 'discover', to: paths.discover },
			{ id: 'l', label: 'latest', to: paths.latest },
			{ id: 'c', label: 'curated', to: paths.curated },
			{ id: 's', label: 'search', to: paths.search() }
		]
	},
	{
		title: 'Contribute',
		links: [
			{ id: 'sub', label: 'submit a quote', to: paths.submit },
			// No guidelines page in the plan: the terms carry the contribution rules.
			{ id: 'g', label: 'guidelines', to: paths.terms },
			{ id: 'r', label: 'dataset releases', to: paths.curated }
		]
	},
	{
		title: 'CLI',
		links: [
			{ id: 'i', label: 'npm i -g qotm', to: '/' },
			{ id: 'gh', label: 'github', href: 'https://github.com/wesscoby/qotm' }
		]
	}
];
