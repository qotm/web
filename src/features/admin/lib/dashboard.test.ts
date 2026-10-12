import { describe, expect, it } from 'vitest';
import { ago, count, oldestNote, queueCards, rate, waited } from './dashboard';

const now = Date.parse('2026-10-12T12:00:00Z');

describe('dashboard', () => {
	it('shows how long an item has waited', () => {
		expect(waited('2026-10-12T11:48:00Z', now)).toBe('12m');
		expect(waited('2026-10-12T07:00:00Z', now)).toBe('5h');
		expect(waited('2026-10-06T10:00:00Z', now)).toBe('6d');
		expect(waited('2026-10-12T12:00:30Z', now)).toBe('0m');
	});

	it('notes the oldest wait in days', () => {
		expect(oldestNote(null, now)).toBeNull();
		expect(oldestNote('2026-10-12T02:00:00Z', now)).toBe('oldest waiting under a day');
		expect(oldestNote('2026-10-11T10:00:00Z', now)).toBe('oldest waiting 1 day');
		expect(oldestNote('2026-10-06T10:00:00Z', now)).toBe('oldest waiting 6 days');
	});

	it('formats rates and counts that may be missing', () => {
		expect(rate(0.8125)).toBe('81.3%');
		expect(rate(0)).toBe('0%');
		expect(rate(null)).toBe('—');
		expect(count(null)).toBe('—');
		expect(count(12)).toBe(12);
	});

	it('builds the queue cards with their notes', () => {
		const cards = queueCards(
			{
				verification: { count: 12, oldestSince: '2026-10-06T10:00:00Z', needsEvidence: 3 },
				curation: { count: 7, oldestSince: null, communityCandidates: 1 },
				reports: { count: 3, oldestSince: null, onCurated: 1 },
				submissions: { count: 23, oldestSince: null, originalityChecks: 9 }
			},
			now
		);
		expect(cards.map((c) => [c.label, c.value, c.note])).toEqual([
			['Verification queue', 12, 'oldest waiting 6 days'],
			['Curation queue', 7, '1 community candidate'],
			['Open reports', 3, '1 on a curated quote'],
			['Submissions', 23, '9 originality checks']
		]);
	});

	it('says how long ago', () => {
		expect(ago('2026-10-09T12:00:00Z', now)).toBe('3 days ago');
		expect(ago('2026-10-12T07:00:00Z', now)).toBe('5 hours ago');
		expect(ago('2026-10-12T11:59:50Z', now)).toBe('1 minute ago');
	});
});
