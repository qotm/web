import { z } from 'zod';
import { zUpdateMe, type MeEntity, type UpdateMe } from '@/shared/types';

/** A handle as typed: `@` and case don't matter. */
export const normalizeHandle = (h: string) => h.trim().replace(/^@/, '').toLowerCase();

/** The generated rules, with the API's handle pattern and bio length (backend users/dto/me.dto). */
export const profileSchema = zUpdateMe.extend({
	name: z.string().trim().min(1, 'Your name, as others see it').max(80),
	handle: z
		.string()
		.transform(normalizeHandle)
		.pipe(z.string().regex(/^[a-z0-9_]{3,30}$/, '3–30 lowercase letters, digits or _')),
	bio: z.string().max(160).optional()
});

export type ProfileValues = {
	name: string;
	handle: string;
	bio: string;
	showFavorites: boolean;
	emailOnReview: boolean;
};

export const profileValues = (me: MeEntity): ProfileValues => ({
	name: me.name,
	handle: `@${me.handle}`,
	bio: me.bio ?? '',
	showFavorites: me.showFavorites,
	emailOnReview: me.emailOnReview
});

/** Only what changed, as `PATCH /v1/me` takes it (an empty bio clears it). */
export function profileChanges(me: MeEntity, v: ProfileValues): UpdateMe {
	const name = v.name.trim();
	const handle = normalizeHandle(v.handle);
	const bio = v.bio.trim() || null;
	return {
		...(name !== me.name ? { name } : {}),
		...(handle !== me.handle ? { handle } : {}),
		...(bio !== (me.bio ?? null) ? { bio } : {}),
		...(v.showFavorites !== me.showFavorites ? { showFavorites: v.showFavorites } : {}),
		...(v.emailOnReview !== me.emailOnReview ? { emailOnReview: v.emailOnReview } : {})
	};
}

/** "3 minutes ago", "yesterday", or "never" for a terminal that has not synced. */
export function lastSync(iso: string | null, now = Date.now()) {
	if (!iso) return 'never';
	const s = (now - new Date(iso).getTime()) / 1000;
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	if (s < 3600) return rtf.format(-Math.max(1, Math.round(s / 60)), 'minute');
	if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
	return rtf.format(-Math.round(s / 86400), 'day');
}
