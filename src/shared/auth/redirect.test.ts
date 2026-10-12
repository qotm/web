import { beforeEach, describe, expect, it } from 'vitest';
import { configureRedirects, getSafeRedirect } from './redirect';

describe('getSafeRedirect', () => {
	beforeEach(() => configureRedirects({ defaultRedirect: '/' }));
	const origin = window.location.origin;

	it('is absolute even with no target, so the API does not resolve it against itself', () => {
		expect(getSafeRedirect(null)).toBe(`${origin}/`);
		expect(getSafeRedirect('')).toBe(`${origin}/`);
	});

	it('keeps a same-origin target, made absolute', () => {
		expect(getSafeRedirect('/settings?tab=1')).toBe(`${origin}/settings?tab=1`);
		expect(getSafeRedirect(`${origin}/my-quotes`)).toBe(`${origin}/my-quotes`);
	});

	it('refuses another origin, falling back to this one', () => {
		expect(getSafeRedirect('https://evil.example/steal')).toBe(`${origin}/`);
		expect(getSafeRedirect('//evil.example/steal')).toBe(`${origin}/`);
	});
});
