import type { FooterColumn, SiteNavItem } from '@/shared/ui';
import type { QueueCountsEntity } from '@/shared/types';
import { adminPaths, paths } from '@/lib/paths';

/**
 * The site's and the console's navigation. Keep them in step with
 * `router.tsx`: a route added in one place and not the other is unreachable
 * or dead.
 */

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
			{ id: 'g', label: 'guidelines', to: `${paths.terms}#submitting` },
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

/** The roles the console admits at all (any staff role). */
export const STAFF_ROLES = ['verifier', 'moderator', 'admin', 'superuser'];

export type AdminPage = keyof typeof adminPaths;

/**
 * Who may open each console page: the API's permissions (backend
 * lib/access.ts) for the endpoints the page calls. Verifiers verify;
 * moderators handle submissions and reports; admins do everything else.
 * The superuser holds every permission. The sidebar shows a role only its
 * pages: a link that 403s is a worse answer than no link.
 */
export const ADMIN_ACCESS: Record<AdminPage, string[]> = {
	dashboard: ['admin', 'superuser'],
	quotes: ['admin', 'superuser'],
	submissions: ['moderator', 'admin', 'superuser'],
	verification: ['verifier', 'admin', 'superuser'],
	curation: ['admin', 'superuser'],
	reports: ['moderator', 'admin', 'superuser'],
	authors: ['admin', 'superuser'],
	sources: ['admin', 'superuser'],
	topics: ['admin', 'superuser'],
	users: ['admin', 'superuser'],
	releases: ['admin', 'superuser'],
	audit: ['admin', 'superuser']
};

type AdminNavItem = {
	id: AdminPage;
	label: string;
	/** The queue whose size the item shows (`/v1/admin/stats/counts`). */
	count?: keyof QueueCountsEntity;
	/** A queue a person must answer: its count is marked while anything waits. */
	attention?: boolean;
};

/** The console's sidebar (artboard AdminNav). */
export const ADMIN_SECTIONS: { title?: string; items: AdminNavItem[] }[] = [
	{ items: [{ id: 'dashboard', label: 'Dashboard' }] },
	{
		title: 'Content',
		items: [
			{ id: 'quotes', label: 'Quotes' },
			{ id: 'submissions', label: 'Submissions', count: 'submissions' },
			{ id: 'verification', label: 'Verification queue', count: 'verification', attention: true },
			{ id: 'curation', label: 'Curation queue', count: 'curation' },
			{ id: 'reports', label: 'Reports', count: 'reports', attention: true }
		]
	},
	{
		title: 'Taxonomy',
		items: [
			{ id: 'authors', label: 'Authors' },
			{ id: 'sources', label: 'Sources' },
			{ id: 'topics', label: 'Topics' }
		]
	},
	{ title: 'People', items: [{ id: 'users', label: 'Users' }] },
	{
		title: 'System',
		items: [
			{ id: 'releases', label: 'Dataset releases' },
			{ id: 'audit', label: 'Audit logs' }
		]
	}
];

/** The roles in a session's comma-separated role string. */
export const rolesOf = (role?: string | null) =>
	(role ?? '')
		.split(',')
		.map((r) => r.trim())
		.filter(Boolean);

export const canOpen = (page: AdminPage, role?: string | null) =>
	rolesOf(role).some((r) => ADMIN_ACCESS[page].includes(r));
