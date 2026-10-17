import { describe, expect, it } from 'vitest';
import { count } from './count';

describe('count', () => {
	it('says one in the singular, anything else in the plural', () => {
		expect(count(1, 'quote')).toBe('1 quote');
		expect(count(0, 'quote')).toBe('0 quotes');
		expect(count(2450, 'quote')).toBe('2,450 quotes');
		expect(count(2, 'person', 'people')).toBe('2 people');
	});
});
