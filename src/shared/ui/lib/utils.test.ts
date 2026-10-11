import { describe, expect, it } from 'vitest';
import { cn, glyph } from './utils';

describe('cn', () => {
	it('keeps a kit text style beside a text colour', () => {
		expect(cn('text-meta', 'text-muted-foreground')).toBe('text-meta text-muted-foreground');
		expect(cn('text-label text-dark-muted')).toBe('text-label text-dark-muted');
	});

	it('still resolves real conflicts, the kit names included', () => {
		expect(cn('text-sm', 'text-meta')).toBe('text-meta');
		expect(cn('rounded-md', 'rounded-control')).toBe('rounded-control');
		expect(cn('p-4', 'p-tile')).toBe('p-tile');
		expect(cn('shadow-sm', 'shadow-terminal')).toBe('shadow-terminal');
	});
});

describe('glyph', () => {
	it('forces text presentation', () => {
		expect(glyph('★')).toBe('★︎');
	});
});
