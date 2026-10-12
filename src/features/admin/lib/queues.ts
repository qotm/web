import type {
	AdminQuoteEntity,
	CorrectQuote,
	CurationDecision,
	ModerationDecision,
	QueueItemEntity,
	QuoteEntity,
	VerificationDecision
} from '@/shared/types';

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

/** ReviewDecision's verification outcome as the API's decision (evidence and rejection need a note). */
export function verification(status: QuoteEntity['status'], note: string): VerificationDecision | null {
	const n = note.trim();
	if (status === 'VERIFIED') return n ? { decision: 'verify', note: n } : { decision: 'verify' };
	if (status === 'NEEDS_EVIDENCE') return n ? { decision: 'needs_evidence', note: n } : null;
	if (status === 'REJECTED') return n ? { decision: 'reject', note: n } : null;
	return null;
}

export type CorrectionValues = {
	text: string;
	author: string;
	year: string;
	sourceUrl: string;
	context: string;
	note: string;
};

export const correctionValues = (q: AdminQuoteEntity): CorrectionValues => ({
	text: q.text,
	author: q.author?.slug ?? '',
	year: q.year == null ? '' : String(q.year),
	sourceUrl: q.sourceUrl ?? '',
	context: q.context ?? '',
	note: ''
});

/** Only what changed, as `PATCH /v1/admin/quotes/:id` takes it; an emptied field unlinks or clears. */
export function correctionBody(q: AdminQuoteEntity, v: CorrectionValues): CorrectQuote {
	const was = correctionValues(q);
	const text = v.text.replace(/\s+/g, ' ').trim();
	const opt = (s: string) => s.trim() || null;
	return {
		...(text !== q.text ? { text } : {}),
		...(v.author.trim() !== was.author ? { author: opt(v.author) } : {}),
		...(v.year.trim() !== was.year ? { year: v.year.trim() ? Number(v.year) : null } : {}),
		...(v.sourceUrl.trim() !== was.sourceUrl ? { sourceUrl: opt(v.sourceUrl) } : {}),
		...(v.context.trim() !== was.context ? { context: opt(v.context) } : {}),
		note: v.note.trim()
	};
}

/** The notes left on a quote's moves (new evidence, earlier decisions), newest first. */
export const notesOf = (q: Pick<AdminQuoteEntity, 'history'>) => q.history.filter((h) => h.note).toReversed();

export type Checklist = CurationDecision['checklist'];

/** The curation checklist (BUILD-PLAN §5), in the API's order and words. */
export const CHECKLIST: [keyof Checklist, string][] = [
	['on_topic', 'About programming, technology or engineering'],
	['stands_alone', 'Useful on its own, without context'],
	['accurate', 'Accurate, with provenance or a declared original'],
	['concise', 'Concise enough for a terminal'],
	['not_duplicate', 'Not a duplicate'],
	['lasting', 'Will still read well in five years'],
	['no_open_reports', 'No open reports or moderation issues']
];

export const emptyChecklist = (): Checklist => Object.fromEntries(CHECKLIST.map(([k]) => [k, false])) as Checklist;

export const allTicked = (c: Checklist) => CHECKLIST.every(([k]) => c[k]);

/** ReviewDecision's curation outcome as the API's decision: curating needs every box, keeping out a note. */
export function curation(status: QuoteEntity['status'], note: string, checklist: Checklist): CurationDecision | null {
	const n = note.trim();
	if (status === 'CURATED')
		return allTicked(checklist) ? { decision: 'curate', checklist, ...(n ? { note: n } : {}) } : null;
	if (status === 'VERIFIED') return n ? { decision: 'keep_out', checklist, note: n } : null;
	return null;
}
