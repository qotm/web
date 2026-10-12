import { describe, expect, it } from 'vitest';
import { isModerated, moderation, openMatch, submitter } from './queues';

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
});
