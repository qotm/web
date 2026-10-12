import { describe, expect, it } from 'vitest';
import type { AdminQuoteEntity } from '@/shared/types';
import {
	CHECKLIST,
	allTicked,
	curation,
	emptyChecklist,
	correctionBody,
	correctionValues,
	isModerated,
	moderation,
	notesOf,
	openMatch,
	submitter,
	verification
} from './queues';

const knuth = {
	id: 'q_5k0q2j',
	text: 'Premature optimization is the root of all evil.',
	author: null,
	attribution: 'Donald E. Knuth',
	year: 1974,
	sourceUrl: null,
	context: null,
	history: [
		{ status: 'SUBMITTED', at: '2026-10-01T00:00:00Z', note: null, by: { handle: 'ada' } },
		{ status: 'NEEDS_EVIDENCE', at: '2026-10-02T00:00:00Z', note: 'Which paper?', by: { handle: 'mireille' } },
		{ status: 'UNDER_REVIEW', at: '2026-10-03T00:00:00Z', note: 'ACM Computing Surveys 6(4).', by: { handle: 'ada' } }
	]
} as unknown as AdminQuoteEntity;

describe('queues', () => {
	it('shows a match until it is dismissed', () => {
		const match = { id: 'q_2x7v3m', text: 'Make it work.', author: 'Kent Beck', method: 'fuzzy' as const, score: 0.97 };
		expect(openMatch({ match: { ...match, dismissed: false } })).toEqual({
			match: { id: 'q_2x7v3m', text: 'Make it work.', author: 'Kent Beck' },
			method: 'fuzzy',
			score: 0.97
		});
		expect(openMatch({ match: { ...match, dismissed: true } })).toBeNull();
		expect(openMatch({ match: null })).toBeNull();
	});

	it('names the submitter', () => {
		expect(submitter({ contributor: { handle: 'kofi' } })).toBe('@kofi');
		expect(submitter({ contributor: null })).toBe('a former member');
	});

	it('turns a moderation outcome into the API decision; dispute and withdraw need a note', () => {
		expect(moderation('PUBLISHED', ' ')).toEqual({ decision: 'publish' });
		expect(moderation('PUBLISHED', 'fine')).toEqual({ decision: 'publish', note: 'fine' });
		expect(moderation('DISPUTED', '')).toBeNull();
		expect(moderation('DISPUTED', 'Kent Beck’s')).toEqual({ decision: 'mark_disputed', note: 'Kent Beck’s' });
		expect(moderation('WITHDRAWN', 'dup')).toEqual({ decision: 'withdraw', note: 'dup' });
		expect(moderation('VERIFIED', 'x')).toBeNull();
	});

	it('moderates held originals only', () => {
		expect(isModerated({ type: 'original', status: 'ORIGINALITY_CHECK' })).toBe(true);
		expect(isModerated({ type: 'canonical', status: 'SUBMITTED' })).toBe(false);
	});

	it('turns a verification outcome into the API decision; evidence and rejection need a note', () => {
		expect(verification('VERIFIED', '')).toEqual({ decision: 'verify' });
		expect(verification('NEEDS_EVIDENCE', ' ')).toBeNull();
		expect(verification('NEEDS_EVIDENCE', 'Which paper?')).toEqual({
			decision: 'needs_evidence',
			note: 'Which paper?'
		});
		expect(verification('REJECTED', 'Misattributed.')).toEqual({ decision: 'reject', note: 'Misattributed.' });
	});

	it('sends only the corrected fields, with the note', () => {
		const start = correctionValues(knuth);
		expect(correctionBody(knuth, { ...start, note: 'Checked.' })).toEqual({ note: 'Checked.' });
		expect(
			correctionBody(knuth, {
				...start,
				text: ' Premature  optimization is the root of all evil (or at least most of it) in programming. ',
				author: 'knuth',
				year: '',
				sourceUrl: 'https://dl.acm.org/doi/10.1145/356635.356640',
				note: 'Matches the paper.'
			})
		).toEqual({
			text: 'Premature optimization is the root of all evil (or at least most of it) in programming.',
			author: 'knuth',
			year: null,
			sourceUrl: 'https://dl.acm.org/doi/10.1145/356635.356640',
			note: 'Matches the paper.'
		});
	});

	it('lists the notes on a quote, newest first', () => {
		expect(notesOf(knuth).map((h) => h.note)).toEqual(['ACM Computing Surveys 6(4).', 'Which paper?']);
	});

	it('curates only with every box ticked; keeping out needs a note', () => {
		const none = emptyChecklist();
		const all = Object.fromEntries(CHECKLIST.map(([k]) => [k, true])) as typeof none;
		expect(CHECKLIST).toHaveLength(7);
		expect(allTicked(none)).toBe(false);
		expect(curation('CURATED', '', none)).toBeNull();
		expect(curation('CURATED', ' ', all)).toEqual({ decision: 'curate', checklist: all });
		expect(curation('VERIFIED', '', none)).toBeNull();
		expect(curation('VERIFIED', 'Too long for a terminal.', none)).toEqual({
			decision: 'keep_out',
			checklist: none,
			note: 'Too long for a terminal.'
		});
	});
});
