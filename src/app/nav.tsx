import { Home, Settings } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import type { NavItem } from '@/shared/layouts';
import { appPath } from '@/lib/paths';
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
export const NAV_ITEMS: NavItem[] = [
	{ to: appPath(), label: 'Home', icon: <Home className="size-4" />, end: true },
	{ to: appPath('settings'), label: 'Settings', icon: <Settings className="size-4" /> }
];

/**
 * The console's own nav. Separate from `NAV_ITEMS` on purpose: the admin section
 * is a different branch of the router behind a different guard, and mixing an
 * admin link into the member sidebar would render it for members too — a link
 * that 403s is a worse answer than no link.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
	{ to: ADMIN_BASE, label: 'Overview', icon: <ShieldCheck className="size-4" />, end: true },
	{ to: appPath(), label: 'Back to app', icon: <Home className="size-4" /> }
];
