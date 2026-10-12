import { describe, expect, it } from 'vitest';
import type { MeEntity } from '@/shared/types';
import { lastSync, normalizeHandle, profileChanges, profileSchema, profileValues } from './settings';

const me = {
	name: 'Ada Lovelace',
	handle: 'ada',
	email: 'ada@example.com',
	bio: null,
	showFavorites: true,
	emailOnReview: false
} as MeEntity;

describe('settings', () => {
	it('normalizes a typed handle', () => {
		expect(normalizeHandle(' @Ada_L ')).toBe('ada_l');
	});

	it('checks the handle as the API does', () => {
		const base = profileValues(me);
		expect(profileSchema.safeParse({ ...base, handle: '@Ada_L' }).success).toBe(true);
		expect(profileSchema.safeParse({ ...base, handle: '@ad' }).success).toBe(false);
		expect(profileSchema.safeParse({ ...base, handle: '@ada-l' }).success).toBe(false);
		expect(profileSchema.safeParse({ ...base, bio: 'x'.repeat(161) }).success).toBe(false);
	});

	it('sends only what changed', () => {
		expect(profileChanges(me, profileValues(me))).toEqual({});
		expect(profileChanges(me, { ...profileValues(me), handle: '@Ada', bio: '  ' })).toEqual({});
		expect(
			profileChanges(me, { ...profileValues(me), handle: '@countess', bio: 'Notes. ', showFavorites: false })
		).toEqual({ handle: 'countess', bio: 'Notes.', showFavorites: false });
	});

	it('clears a bio left empty', () => {
		expect(profileChanges({ ...me, bio: 'Old' }, { ...profileValues(me), bio: '' })).toEqual({ bio: null });
	});

	it('says when a terminal last synced', () => {
		const now = Date.parse('2026-10-12T12:00:00Z');
		expect(lastSync(null, now)).toBe('never');
		expect(lastSync('2026-10-12T11:57:00Z', now)).toBe('3 minutes ago');
		expect(lastSync('2026-10-12T09:00:00Z', now)).toBe('3 hours ago');
		expect(lastSync('2026-10-11T12:00:00Z', now)).toBe('yesterday');
	});
});
