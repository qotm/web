import { describe, expect, it } from 'vitest';
import type { QuoteCardEntity } from '@/shared/types';
import { applyReaction } from './api';

const card = (viewer?: QuoteCardEntity['viewer']): QuoteCardEntity => ({
	id: 'q_1',
	text: 't',
	type: 'original',
	status: 'PUBLISHED',
	author: null,
	attribution: null,
	work: null,
	year: null,
	contributor: null,
	topics: [],
	counts: { likes: 3, favorites: 1, recommends: 0 },
	publishedAt: null,
	viewer
});

describe('applyReaction', () => {
	it('counts a new reaction once, and an undo once', () => {
		const q = card({ liked: false, favorited: false, recommended: false });
		applyReaction(q, 'like', true);
		expect(q.counts.likes).toBe(4);
		expect(q.viewer?.liked).toBe(true);
		applyReaction(q, 'like', true);
		expect(q.counts.likes).toBe(4);
		applyReaction(q, 'like', false);
		expect(q.counts.likes).toBe(3);
	});

	it('takes the API’s count when it has one, and never goes below zero', () => {
		const q = card();
		applyReaction(q, 'recommend', true, 9);
		expect(q.counts.recommends).toBe(9);
		expect(q.viewer).toEqual({ liked: false, favorited: false, recommended: true });
		applyReaction(q, 'recommend', false);
		applyReaction(q, 'recommend', false);
		expect(q.counts.recommends).toBe(8);
		const r = card();
		applyReaction(r, 'favorite', false);
		expect(r.counts.favorites).toBe(1);
	});
});
