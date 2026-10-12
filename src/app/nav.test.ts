import { describe, expect, it } from 'vitest';
import { ADMIN_ACCESS, ADMIN_SECTIONS, STAFF_ROLES, canOpen, rolesOf } from './nav';
import { adminPaths } from '@/lib/paths';

describe('the console’s access map', () => {
	it('lists every console page once, each with a path and a gate', () => {
		const ids = ADMIN_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
		expect([...ids].sort()).toEqual(Object.keys(adminPaths).sort());
		expect(Object.keys(ADMIN_ACCESS).sort()).toEqual(Object.keys(adminPaths).sort());
	});

	it('admits only staff, and the superuser everywhere', () => {
		for (const roles of Object.values(ADMIN_ACCESS)) {
			expect(roles.every((r) => STAFF_ROLES.includes(r))).toBe(true);
			expect(roles).toContain('superuser');
		}
	});

	it('follows the API’s permissions for each role', () => {
		const pages = (role: string) => Object.keys(ADMIN_ACCESS).filter((p) => canOpen(p as never, role));
		expect(pages('verifier')).toEqual(['verification']);
		expect(pages('moderator')).toEqual(['submissions', 'reports']);
		expect(pages('admin')).toHaveLength(12);
		expect(pages('member')).toEqual([]);
		expect(pages('')).toEqual([]);
	});

	it('reads comma-separated roles', () => {
		expect(rolesOf(' verifier, moderator ')).toEqual(['verifier', 'moderator']);
		expect(canOpen('reports', 'verifier,moderator')).toBe(true);
		expect(rolesOf(null)).toEqual([]);
	});
});
