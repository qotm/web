import type { ModerationDecision, QueueItemEntity, QuoteEntity } from '@/shared/types';

/** The queue item's match in MatchCompare's shape, unless a moderator already answered it. */
export function openMatch(item: Pick<QueueItemEntity, 'match'>) {
	const m = item.match;
	if (!m || m.dismissed) return null;
	return { match: { id: m.id, text: m.text, author: m.author }, method: m.method, score: m.score };
}

/** Who submitted it: "@kofi", or "a former member". */
export const submitter = (item: Pick<QueueItemEntity, 'contributor'>) =>
	item.contributor ? `@${item.contributor.handle}` : 'a former member';

/** ReviewDecision's moderation outcome as the API's decision. */
export function moderation(status: QuoteEntity['status'], note: string): ModerationDecision | null {
	const n = note.trim();
	if (status === 'PUBLISHED') return n ? { decision: 'publish', note: n } : { decision: 'publish' };
	if (status === 'DISPUTED') return n ? { decision: 'mark_disputed', note: n } : null;
	if (status === 'WITHDRAWN') return n ? { decision: 'withdraw', note: n } : null;
	return null;
}

/** Only held originals take a moderator's decision; canonical quotes go to the verifiers. */
export const isModerated = (item: Pick<QueueItemEntity, 'type' | 'status'>) =>
	item.type === 'original' && item.status === 'ORIGINALITY_CHECK';
